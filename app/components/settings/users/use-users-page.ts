import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { FarmAssignment, UserData } from './types'
import {
  banUserFn,
  getUserFn,
  listUsersFn,
  removeUserFn,
  unbanUserFn,
  updateUserRoleFn,
} from '~/features/users/server'

interface UseUsersPageProps {
  initialUsers: Array<UserData>
}

export function useUsersPage({ initialUsers }: UseUsersPageProps) {
  const { t } = useTranslation(['settings', 'common'])
  const [users, setUsers] = useState<Array<UserData>>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [farmAssignmentOpen, setFarmAssignmentOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [userFarmAssignments, setUserFarmAssignments] = useState<
    Array<FarmAssignment>
  >([])

  // Filter users by search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'banned' && user.banned) ||
      (roleFilter !== 'banned' && user.role === roleFilter)

    return matchesSearch && matchesRole
  })

  const refreshUsers = async () => {
    try {
      const updated = await listUsersFn({ data: {} })
      setUsers(updated as Array<UserData>)
    } catch {
      setError(t('users.errors.refresh'))
    }
  }

  const loadUserFarmAssignments = async (userId: string) => {
    try {
      const userData = await getUserFn({ data: { userId } })
      setUserFarmAssignments(userData.farmAssignments)
    } catch {
      setError(t('users.errors.loadAssignments'))
    }
  }

  const handleBanUser = async (reason?: string) => {
    if (!selectedUser) return
    setIsLoading(true)
    setError(null)
    try {
      await banUserFn({ data: { userId: selectedUser.id, reason } })
      await refreshUsers()
      setBanDialogOpen(false)
      setSelectedUser(null)
      toast.success(t('users.messages.banned'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errors.ban'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await unbanUserFn({ data: { userId } })
      await refreshUsers()
      toast.success(t('users.messages.unbanned'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errors.unban'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setIsLoading(true)
    setError(null)
    try {
      await removeUserFn({ data: { userId: selectedUser.id } })
      await refreshUsers()
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      toast.success(t('users.messages.deleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errors.delete'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      await updateUserRoleFn({ data: { userId, role: newRole } })
      await refreshUsers()
      toast.success(t('users.messages.roleUpdated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errors.role'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageFarms = async (user: UserData) => {
    setSelectedUser(user)
    await loadUserFarmAssignments(user.id)
    setFarmAssignmentOpen(true)
  }

  const handleResetPassword = (user: UserData) => {
    setSelectedUser(user)
    setResetPasswordOpen(true)
  }

  const handleBanUserDialog = (user: UserData) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  const handleDeleteUserDialog = (user: UserData) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  return {
    // State
    users,
    filteredUsers,
    searchQuery,
    roleFilter,
    isLoading,
    error,
    selectedUser,
    userFarmAssignments,

    // Dialog states
    addUserOpen,
    banDialogOpen,
    deleteDialogOpen,
    resetPasswordOpen,
    farmAssignmentOpen,

    // Setters
    setSearchQuery,
    setRoleFilter,
    setAddUserOpen,
    setBanDialogOpen,
    setDeleteDialogOpen,
    setResetPasswordOpen,
    setFarmAssignmentOpen,
    setSelectedUser,

    // Handlers
    refreshUsers,
    loadUserFarmAssignments,
    handleBanUser,
    handleUnbanUser,
    handleDeleteUser,
    handleToggleAdmin,
    handleManageFarms,
    handleResetPassword,
    handleBanUserDialog,
    handleDeleteUserDialog,
  }
}
