import type { Generated } from 'kysely'

// ============================================
// Digital Foreman Tables
// ============================================

/**
 * Module-specific permissions for workers
 */
export type ModulePermission =
  | 'feed:log'
  | 'mortality:log'
  | 'weight:log'
  | 'vaccination:log'
  | 'water_quality:log'
  | 'egg:log'
  | 'sales:view'
  | 'task:complete'
  | 'batch:view'

/**
 * Worker employment profiles with wage configuration and permissions
 */
export interface WorkerProfileTable {
  /** Unique profile identifier */
  id: Generated<string>
  /** User ID of the worker */
  userId: string
  /** Farm this profile belongs to */
  farmId: string
  /** Worker's phone number (primary contact) */
  phone: string
  /** Emergency contact name */
  emergencyContactName: string | null
  /** Emergency contact phone */
  emergencyContactPhone: string | null
  /** Employment status */
  employmentStatus: 'active' | 'inactive' | 'terminated'
  /** Employment start date */
  employmentStartDate: Date
  /** Employment end date (for terminated workers) */
  employmentEndDate: Date | null
  /** Wage rate amount */
  wageRateAmount: string // DECIMAL(19,2)
  /** Wage rate type */
  wageRateType: 'hourly' | 'daily' | 'monthly'
  /** Wage currency (ISO 4217) */
  wageCurrency: string
  /** Module-specific permissions */
  permissions: Array<ModulePermission>
  /** Structure IDs the worker manages */
  structureIds: Array<string>
  /** Profile photo URL */
  profilePhotoUrl: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Farm geofence configuration for attendance verification
 */
export interface FarmGeofenceTable {
  /** Unique geofence identifier */
  id: Generated<string>
  /** Farm this geofence belongs to */
  farmId: string
  /** Geofence type */
  geofenceType: 'circle' | 'polygon'
  /** Center latitude (for circle) */
  centerLat: string | null // DECIMAL(10,8)
  /** Center longitude (for circle) */
  centerLng: string | null // DECIMAL(11,8)
  /** Radius in meters (for circle) */
  radiusMeters: string | null // DECIMAL(10,2)
  /** Polygon vertices (for polygon) */
  vertices: Array<{ lat: number; lng: number }> | null
  /** Tolerance buffer in meters */
  toleranceMeters: string // DECIMAL(10,2)
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Worker attendance check-in/check-out records
 */
export interface WorkerCheckInTable {
  /** Unique check-in identifier */
  id: Generated<string>
  /** Worker profile ID */
  workerId: string
  /** Farm ID */
  farmId: string
  /** Check-in timestamp */
  checkInTime: Date
  /** Check-in latitude */
  checkInLat: string // DECIMAL(10,8)
  /** Check-in longitude */
  checkInLng: string // DECIMAL(11,8)
  /** Check-in GPS accuracy in meters */
  checkInAccuracy: string | null // DECIMAL(10,2)
  /** Location verification status */
  verificationStatus:
    | 'verified'
    | 'outside_geofence'
    | 'manual'
    | 'pending_sync'
  /** Check-out timestamp */
  checkOutTime: Date | null
  /** Check-out latitude */
  checkOutLat: string | null // DECIMAL(10,8)
  /** Check-out longitude */
  checkOutLng: string | null // DECIMAL(11,8)
  /** Check-out GPS accuracy in meters */
  checkOutAccuracy: string | null // DECIMAL(10,2)
  /** Hours worked (calculated on check-out) */
  hoursWorked: string | null // DECIMAL(5,2)
  /** Sync status for offline check-ins */
  syncStatus: 'synced' | 'pending_sync' | 'sync_failed'
  createdAt: Generated<Date>
}

/**
 * Task assignments to workers
 */
export interface TaskAssignmentTable {
  /** Unique assignment identifier */
  id: Generated<string>
  /** Task ID */
  taskId: string
  /** Worker profile ID */
  workerId: string
  /** User ID who assigned the task */
  assignedBy: string
  /** Farm ID */
  farmId: string
  /** Due date and time */
  dueDate: Date | null
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent'
  /** Assignment status */
  status:
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'pending_approval'
    | 'verified'
    | 'rejected'
  /** Whether photo proof is required */
  requiresPhoto: boolean
  /** Whether supervisor approval is required */
  requiresApproval: boolean
  /** Assignment notes/instructions */
  notes: string | null
  /** Completion timestamp */
  completedAt: Date | null
  /** Worker's completion notes */
  completionNotes: string | null
  /** User ID who approved/rejected */
  approvedBy: string | null
  /** Approval timestamp */
  approvedAt: Date | null
  /** Rejection reason (if rejected) */
  rejectionReason: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Photo proof for task completions
 */
export interface TaskPhotoTable {
  /** Unique photo identifier */
  id: Generated<string>
  /** Task assignment ID */
  assignmentId: string
  /** Photo URL (Cloudflare R2) */
  photoUrl: string
  /** Capture latitude */
  capturedLat: string | null // DECIMAL(10,8)
  /** Capture longitude */
  capturedLng: string | null // DECIMAL(11,8)
  /** Capture timestamp */
  capturedAt: Date
  /** Upload timestamp */
  uploadedAt: Generated<Date>
}

/**
 * Payroll period definitions
 */
export interface PayrollPeriodTable {
  /** Unique period identifier */
  id: Generated<string>
  /** Farm ID */
  farmId: string
  /** Period type */
  periodType: 'weekly' | 'bi-weekly' | 'monthly'
  /** Period start date */
  startDate: Date
  /** Period end date */
  endDate: Date
  /** Period status */
  status: 'open' | 'closed'
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Wage payment records
 */
export interface WagePaymentTable {
  /** Unique payment identifier */
  id: Generated<string>
  /** Worker profile ID */
  workerId: string
  /** Payroll period ID */
  payrollPeriodId: string
  /** Farm ID */
  farmId: string
  /** Payment amount */
  amount: string // DECIMAL(19,2)
  /** Payment date */
  paymentDate: Date
  /** Payment method */
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money'
  /** Payment notes */
  notes: string | null
  createdAt: Generated<Date>
}
