export type NotificationType =
  // Core notifications
  | 'lowStock'
  | 'highMortality'
  | 'invoiceDue'
  | 'batchHarvest'
  | 'growthDeviation'
  | 'earlyHarvest'
  | 'reportRequest'
  | 'reportExpiring'
  // IoT Sensor Hub
  | 'sensorAlert'
  // Digital Foreman
  | 'taskAssigned'
  | 'taskCompleted'
  | 'taskApproved'
  | 'taskRejected'
  | 'flaggedCheckIn'
  // Offline Marketplace
  | 'contactRequest'
  | 'contactApproved'
  | 'contactDenied'
  | 'listingExpiring'
  | 'listingSold'
  // Extension Worker Mode
  | 'epidemicWarning'
  | 'farmHealthCritical'
  | 'extensionAccessGranted'

export interface Notification {
  id: string
  userId: string
  farmId: string | null
  type: NotificationType
  title: string
  message: string
  read: boolean
  actionUrl: string | null
  metadata: Record<string, any> | null
  createdAt: Date
}

export interface CreateNotificationData {
  userId: string
  farmId?: string | null
  type: NotificationType
  title: string
  message: string
  actionUrl?: string | null
  metadata?: Record<string, any> | null
}
