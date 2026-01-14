/**
 * Notifications Context
 *
 * Provides notification state and actions throughout the application.
 * Auto-refreshes notifications every 30 seconds.
 */

import { createContext, useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteNotificationFn,
  getNotificationsFn,
  markAllAsReadFn,
  markAsReadFn,
} from './server'
import type { ReactNode } from 'react'
import type { Notification } from './types'

interface NotificationsContextValue {
  notifications: Array<Notification>
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refetch: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
)

interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Notifications Provider Component
 *
 * Wraps the application to provide notifications context.
 * Auto-refreshes every 30 seconds.
 */
export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const queryClient = useQueryClient()

  // Fetch notifications with auto-refresh
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsFn({ data: { limit: 50 } }),
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  })

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markAsReadFn({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsReadFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotificationFn({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: (notificationId: string) =>
      markAsReadMutation.mutateAsync(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
    deleteNotification: (notificationId: string) =>
      deleteNotificationMutation.mutateAsync(notificationId),
    refetch: () => {
      refetch()
    },
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Hook to access notifications context
 */
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider',
    )
  }
  return context
}
