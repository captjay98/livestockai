export type NotificationType =
  | 'lowStock'
  | 'highMortality'
  | 'invoiceDue'
  | 'batchHarvest'

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
