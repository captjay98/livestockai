import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

const assignTaskSchema = z.object({
    taskId: z.string().uuid(),
    workerId: z.string().uuid(),
    farmId: z.string().uuid(),
    dueDate: z.coerce.date().nullish(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    requiresPhoto: z.boolean().default(false),
    requiresApproval: z.boolean().default(false),
    notes: z.string().max(500).nullish(),
})

const completeTaskSchema = z.object({
    assignmentId: z.string().uuid(),
    completionNotes: z.string().max(500).optional(),
    photoData: z
        .object({
            base64: z.string(),
            capturedAt: z.coerce.date(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
        })
        .optional(),
})

const approveTaskSchema = z.object({
    assignmentId: z.string().uuid(),
    approved: z.boolean(),
    rejectionReason: z.string().max(500).optional(),
})

const getAssignmentsSchema = z.object({
    farmId: z.string().uuid(),
    status: z
        .enum([
            'pending',
            'in_progress',
            'completed',
            'pending_approval',
            'verified',
            'rejected',
        ])
        .optional(),
})

export const assignTaskFn = createServerFn({ method: 'POST' })
    .inputValidator(assignTaskSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { insertTaskAssignment, getWorkerProfileById } =
            await import('./repository')
        const { createDigitalForemanNotification } =
            await import('./notifications')
        const { logAudit } = await import('~/lib/logging/audit')

        const assignmentId = await insertTaskAssignment(db, {
            taskId: data.taskId,
            workerId: data.workerId,
            assignedBy: session.user.id,
            farmId: data.farmId,
            dueDate: data.dueDate,
            priority: data.priority,
            requiresPhoto: data.requiresPhoto,
            requiresApproval: data.requiresApproval,
            notes: data.notes,
        })

        // Log audit
        await logAudit({
            userId: session.user.id,
            userName: session.user.name,
            action: 'create',
            entityType: 'task_assignment',
            entityId: assignmentId,
            details: {
                taskId: data.taskId,
                workerId: data.workerId,
                priority: data.priority,
            },
        })

        // Send notification to worker
        const workerProfile = await getWorkerProfileById(db, data.workerId)
        if (workerProfile) {
            await createDigitalForemanNotification(db, {
                userId: workerProfile.userId,
                farmId: data.farmId,
                type: 'taskAssigned',
                title: 'New Task Assigned',
                message: `You have been assigned a new ${data.priority} priority task${data.dueDate ? ` due ${new Date(data.dueDate).toLocaleDateString()}` : ''}`,
                actionUrl: '/worker',
            })
        }

        return assignmentId
    })

export const completeTaskFn = createServerFn({ method: 'POST' })
    .inputValidator(completeTaskSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const {
            getTaskAssignmentById,
            updateTaskAssignment,
            insertTaskPhoto,
            getWorkerProfileByUserId,
        } = await import('./repository')
        const { validateTaskCompletion, determineCompletionStatus } =
            await import('./task-service')
        const { createDigitalForemanNotification } =
            await import('./notifications')
        const { uploadTaskPhoto } = await import('./photo-storage')

        const assignment = await getTaskAssignmentById(db, data.assignmentId)
        if (!assignment) throw new AppError('TASK_ASSIGNMENT_NOT_FOUND')

        // Get worker profile to verify assignee
        const profile = await getWorkerProfileByUserId(
            db,
            session.user.id,
            assignment.farmId,
        )
        if (!profile || profile.id !== assignment.workerId)
            throw new AppError('NOT_TASK_ASSIGNEE')

        const validation = validateTaskCompletion(
            {
                id: assignment.id,
                workerId: assignment.workerId,
                status: assignment.status,
                requiresPhoto: assignment.requiresPhoto,
                dueDate: assignment.dueDate || undefined,
            },
            assignment.workerId,
            !!data.photoData,
        )
        if (!validation.valid)
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validation.error },
            })

        // Handle photo upload if provided
        if (data.photoData) {
            // Upload to R2/S3 storage (falls back to base64 if not configured)
            const photoUrl = await uploadTaskPhoto(
                data.assignmentId,
                data.photoData.base64,
                assignment.farmId,
            )

            await insertTaskPhoto(db, {
                assignmentId: data.assignmentId,
                photoUrl: photoUrl || data.photoData.base64,
                capturedAt: data.photoData.capturedAt,
                capturedLat: data.photoData.latitude?.toFixed(7),
                capturedLng: data.photoData.longitude?.toFixed(7),
            })
        }

        const newStatus = determineCompletionStatus(assignment.requiresApproval)
        await updateTaskAssignment(db, data.assignmentId, {
            status: newStatus,
            completedAt: new Date(),
            completionNotes: data.completionNotes,
        })

        // Send notification to manager/assigner
        if (assignment.assignedBy) {
            await createDigitalForemanNotification(db, {
                userId: assignment.assignedBy,
                farmId: assignment.farmId,
                type: 'taskCompleted',
                title:
                    newStatus === 'pending_approval'
                        ? 'Task Pending Approval'
                        : 'Task Completed',
                message: `${session.user.name} has completed a task${newStatus === 'pending_approval' ? ' and it requires your approval' : ''}`,
                actionUrl:
                    newStatus === 'pending_approval'
                        ? '/task-assignments?status=pending_approval'
                        : '/task-assignments',
            })
        }
    })

export const approveTaskFn = createServerFn({ method: 'POST' })
    .inputValidator(approveTaskSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const {
            getTaskAssignmentById,
            updateTaskAssignment,
            getWorkerProfileById,
        } = await import('./repository')
        const { createDigitalForemanNotification } =
            await import('./notifications')
        const { logAudit } = await import('~/lib/logging/audit')

        const assignment = await getTaskAssignmentById(db, data.assignmentId)
        if (!assignment) throw new AppError('TASK_ASSIGNMENT_NOT_FOUND')
        if (assignment.status !== 'pending_approval') {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: 'Task not pending approval' },
            })
        }

        await updateTaskAssignment(db, data.assignmentId, {
            status: data.approved ? 'verified' : 'rejected',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            rejectionReason: data.approved ? null : data.rejectionReason,
        })

        // Log audit
        await logAudit({
            userId: session.user.id,
            userName: session.user.name,
            action: 'update',
            entityType: 'task_assignment',
            entityId: data.assignmentId,
            details: {
                approved: data.approved,
                rejectionReason: data.rejectionReason,
            },
        })

        // Send notification to worker
        const workerProfile = await getWorkerProfileById(
            db,
            assignment.workerId,
        )
        if (workerProfile) {
            await createDigitalForemanNotification(db, {
                userId: workerProfile.userId,
                farmId: assignment.farmId,
                type: data.approved ? 'taskApproved' : 'taskRejected',
                title: data.approved ? 'Task Approved' : 'Task Rejected',
                message: data.approved
                    ? 'Your completed task has been approved'
                    : `Your task was rejected${data.rejectionReason ? `: ${data.rejectionReason}` : ''}`,
                actionUrl: '/worker',
            })
        }
    })

export const getAssignmentsByWorkerFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ status: z.string().optional() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getAssignmentsByWorker } = await import('./repository')

        // Get first worker profile for this user (simplified)
        const profile = await db
            .selectFrom('worker_profiles')
            .select('id')
            .where('userId', '=', session.user.id)
            .executeTakeFirst()
        if (!profile) return []

        return getAssignmentsByWorker(db, profile.id, data.status)
    })

export const getAssignmentsByFarmFn = createServerFn({ method: 'GET' })
    .inputValidator(getAssignmentsSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getAssignmentsByFarm } = await import('./repository')
        return getAssignmentsByFarm(db, data.farmId)
    })

export const getPendingApprovalsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getPendingApprovals } = await import('./repository')
        return getPendingApprovals(db, data.farmId)
    })
