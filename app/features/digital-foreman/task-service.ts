/**
 * Pure service layer for task assignment operations.
 * No database access - only business logic and validation.
 */

export type AssignmentStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'pending_approval'
    | 'verified'
    | 'rejected'

export interface Assignment {
    id: string
    workerId: string
    status: AssignmentStatus
    requiresPhoto: boolean
    dueDate?: Date
}

export interface ValidationResult {
    valid: boolean
    error?: string
}

export interface TaskMetrics {
    total: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
}

/**
 * Validate task completion requirements
 */
export function validateTaskCompletion(
    assignment: Assignment,
    workerId: string,
    hasPhoto: boolean,
): ValidationResult {
    if (assignment.workerId !== workerId) {
        return { valid: false, error: 'Worker must be assignee' }
    }

    if (
        assignment.status !== 'pending' &&
        assignment.status !== 'in_progress'
    ) {
        return { valid: false, error: 'Status must be pending or in_progress' }
    }

    if (assignment.requiresPhoto && !hasPhoto) {
        return { valid: false, error: 'Photo required' }
    }

    return { valid: true }
}

/**
 * Determine completion status based on approval requirement
 */
export function determineCompletionStatus(
    requiresApproval: boolean,
): 'completed' | 'pending_approval' {
    return requiresApproval ? 'pending_approval' : 'completed'
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(
    assignment: Assignment,
    currentTime: Date,
): boolean {
    return assignment.dueDate ? assignment.dueDate < currentTime : false
}

/**
 * Calculate task metrics from assignments
 */
export function calculateTaskMetrics(
    assignments: Array<Assignment>,
    currentTime: Date = new Date(),
): TaskMetrics {
    const total = assignments.length
    const completed = assignments.filter(
        (a) => a.status === 'completed' || a.status === 'verified',
    ).length
    const pending = assignments.filter(
        (a) => a.status === 'pending' || a.status === 'in_progress',
    ).length
    const overdue = assignments.filter((a) =>
        isTaskOverdue(a, currentTime),
    ).length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, pending, overdue, completionRate }
}

/**
 * Validate photo count against maximum
 */
export function validatePhotoCount(
    currentCount: number,
    maxPhotos: number = 3,
): ValidationResult {
    if (currentCount > maxPhotos) {
        return { valid: false, error: `Maximum ${maxPhotos} photos allowed` }
    }
    return { valid: true }
}
