import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Users } from 'lucide-react'
import type { FarmData, UserData } from '~/components/settings/users'
import { listUsersFn } from '~/features/users/server'
import { getUserFarmsWithRolesFn } from '~/features/farms/server'
import { UsersSkeleton } from '~/components/settings/users-skeleton'
import { Button } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  AddUserDialog,
  BanUserDialog,
  FarmAssignmentDialog,
  ResetPasswordDialog,
  UserFilters,
  UserList,
  UserStats,
  useUsersPage,
} from '~/components/settings/users'

export const Route = createFileRoute('/_auth/settings/users')({
  loader: async () => {
    // Check if user is admin
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    if ((session.user as any).role !== 'admin') {
      throw redirect({ to: '/settings' })
    }

    const [users, farms] = await Promise.all([
      listUsersFn({ data: {} }),
      getUserFarmsWithRolesFn({ data: {} }),
    ])
    return { users, farms, session }
  },
  component: UsersSettingsPage,
  pendingComponent: UsersSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">Error loading users: {error.message}</div>
  ),
})

function UsersSettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { users: initialUsers, farms, session } = Route.useLoaderData()

  const {
    users,
    filteredUsers,
    searchQuery,
    roleFilter,
    isLoading,
    error,
    selectedUser,
    userFarmAssignments,
    addUserOpen,
    banDialogOpen,
    deleteDialogOpen,
    resetPasswordOpen,
    farmAssignmentOpen,
    setSearchQuery,
    setRoleFilter,
    setAddUserOpen,
    setBanDialogOpen,
    setDeleteDialogOpen,
    setResetPasswordOpen,
    setFarmAssignmentOpen,
    setSelectedUser,
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
  } = useUsersPage({ initialUsers: initialUsers as Array<UserData> })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-medium">{t('users.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('users.description')}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('users.add')}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <UserStats users={users} />

      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <UserList
        users={filteredUsers}
        currentUserId={session.user.id}
        isLoading={isLoading}
        onManageFarms={handleManageFarms}
        onResetPassword={handleResetPassword}
        onToggleAdmin={handleToggleAdmin}
        onBanUser={handleBanUserDialog}
        onUnbanUser={handleUnbanUser}
        onDeleteUser={handleDeleteUserDialog}
      />

      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          setAddUserOpen(false)
          refreshUsers()
        }}
      />

      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        user={selectedUser}
        onConfirm={handleBanUser}
        isLoading={isLoading}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('users.dialogs.delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.dialogs.delete.desc', {
                name: selectedUser?.name || selectedUser?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('users.dialogs.delete.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onSuccess={() => {
          setResetPasswordOpen(false)
          setSelectedUser(null)
        }}
      />

      <FarmAssignmentDialog
        open={farmAssignmentOpen}
        onOpenChange={setFarmAssignmentOpen}
        user={selectedUser}
        farms={farms as Array<FarmData>}
        assignments={userFarmAssignments}
        onAssignmentChange={async () => {
          if (selectedUser) {
            await loadUserFarmAssignments(selectedUser.id)
          }
        }}
      />
    </div>
  )
}
