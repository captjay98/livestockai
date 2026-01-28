/**
 * Digital Foreman Feature
 *
 * Workforce management for farm workers with GPS-verified attendance,
 * granular permissions, task assignments with photo proof, and payroll tracking.
 */

// Server functions - Worker Management
export {
    createWorkerProfileFn,
    updateWorkerProfileFn,
    getWorkersByFarmFn,
    removeWorkerFromFarmFn,
    getOpenCheckInForCurrentUserFn,
    // Attendance
    checkInFn,
    checkOutFn,
    getAttendanceByFarmFn,
    syncOfflineCheckInsFn,
} from './server'

// Server functions - Tasks
export {
    assignTaskFn,
    completeTaskFn,
    approveTaskFn,
    getAssignmentsByWorkerFn,
    getAssignmentsByFarmFn,
    getPendingApprovalsFn,
} from './server-tasks'

// Server functions - Payroll
export {
    createPayrollPeriodFn,
    getPayrollSummaryFn,
    recordPaymentFn,
    getPayrollHistoryFn,
} from './server-payroll'

// Services (pure business logic)
export * from './attendance-service'
export * from './geofence-service'
export * from './task-service'
export * from './payroll-service'
export * from './permission-service'

// Notifications
export { createDigitalForemanNotification } from './notifications'
export type {
    DigitalForemanNotificationType,
    CreateDigitalForemanNotificationData,
} from './notifications'

// Photo storage
export {
    uploadTaskPhoto,
    deleteTaskPhoto,
    compressImageForUpload,
} from './photo-storage'
