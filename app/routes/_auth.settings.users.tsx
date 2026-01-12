import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  Ban,
  Building2,
  Check,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users,
} from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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
  banUserFn,
  createUserFn,
  getUserFn,
  listUsersFn,
  removeUserFn,
  setUserPasswordFn,
  unbanUserFn,
  updateUserRoleFn,
} from '~/lib/users/server'
import {
  assignUserToFarmFn,
  getUserFarmsWithRolesFn,
  removeUserFromFarmFn,
  updateUserFarmRoleFn,
} from '~/lib/farms/server'

// Type definitions
interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
}

interface FarmData {
  id: string
  name: string
  location: string | null
  type: string
  farmRole: string
}

interface FarmAssignment {
  farmId: string
  role: string
  farmName: string
}

export const Route = createFileRoute('/_auth/settings/users')({
  loader: async () => {
    // Check if user is admin
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    if (session.user.role !== 'admin') {
      throw redirect({ to: '/settings' })
    }

    const [users, farms] = await Promise.all([
      listUsersFn(),
      getUserFarmsWithRolesFn(),
    ])
    return { users, farms, session }
  },
  component: UsersSettingsPage,
})

function UsersSettingsPage() {
  const { users: initialUsers, farms, session } = Route.useLoaderData()
  const [users, setUsers] = useState<Array<UserData>>(
    initialUsers as Array<UserData>,
  )
  const [searchQuery, setSearchQuery] = useState('')
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

  // Filter users by search
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const refreshUsers = async () => {
    try {
      const updated = await listUsersFn()
      setUsers(updated as Array<UserData>)
    } catch {
      setError('Failed to refresh users')
    }
  }

  const loadUserFarmAssignments = async (userId: string) => {
    try {
      const userData = await getUserFn({ data: { userId } })
      setUserFarmAssignments(userData.farmAssignments)
    } catch {
      setError('Failed to load farm assignments')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-medium">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No users found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first user to get started'}
            </p>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() ||
                        user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {user.name || 'Unnamed'}
                      </span>
                      {user.role === 'admin' && (
                        <Badge variant="default" className="shrink-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.banned && (
                        <Badge variant="destructive" className="shrink-0">
                          <Ban className="h-3 w-3 mr-1" />
                          Banned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {/* Manage Farm Assignments */}
                    <DropdownMenuItem
                      onClick={async () => {
                        setSelectedUser(user)
                        await loadUserFarmAssignments(user.id)
                        setFarmAssignmentOpen(true)
                      }}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Manage Farms
                    </DropdownMenuItem>

                    {/* Reset Password */}
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user)
                        setResetPasswordOpen(true)
                      }}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>

                    {/* Toggle Admin (not for self) */}
                    {user.id !== session.user.id && (
                      <DropdownMenuItem
                        onClick={() => handleToggleAdmin(user.id, user.role)}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </>
                        )}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Ban/Unban (not for self or admins) */}
                    {user.id !== session.user.id &&
                      user.role !== 'admin' &&
                      (user.banned ? (
                        <DropdownMenuItem
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setBanDialogOpen(true)
                          }}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                      ))}

                    {/* Delete (not for self or admins) */}
                    {user.id !== session.user.id && user.role !== 'admin' && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Show ban reason if banned */}
              {user.banned && user.banReason && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  <span className="font-medium">Ban reason:</span>{' '}
                  {user.banReason}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          setAddUserOpen(false)
          refreshUsers()
        }}
      />

      {/* Ban User Dialog */}
      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        user={selectedUser}
        onConfirm={handleBanUser}
        isLoading={isLoading}
      />

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              {selectedUser?.name || selectedUser?.email}? This action cannot be
              undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onSuccess={() => {
          setResetPasswordOpen(false)
          setSelectedUser(null)
        }}
      />

      {/* Farm Assignment Dialog */}
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

// ============================================
// Add User Dialog Component
// ============================================

function AddUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'admin',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await createUserFn({ data: formData })
      setFormData({ email: '', password: '', name: '', role: 'user' })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. They will be able to log in with these
            credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => {
                if (v === 'user' || v === 'admin') {
                  setFormData((prev) => ({ ...prev, role: v }))
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can manage all users and farms. Regular users need farm
              assignments.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Ban User Dialog Component
// ============================================

function BanUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  onConfirm: (reason?: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to ban {user?.name || user?.email}? They will
            not be able to log in until unbanned.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="ban-reason">Reason (optional)</Label>
          <Input
            id="ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for ban..."
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(reason || undefined)
              setReason('')
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Ban User'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ============================================
// Reset Password Dialog Component
// ============================================

function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      await setUserPasswordFn({ data: { userId: user.id, newPassword } })
      setNewPassword('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.name || user?.email}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Farm Assignment Dialog Component
// ============================================

function FarmAssignmentDialog({
  open,
  onOpenChange,
  user,
  farms,
  assignments,
  onAssignmentChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  farms: Array<FarmData>
  assignments: Array<FarmAssignment>
  onAssignmentChange: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addFarmOpen, setAddFarmOpen] = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [selectedRole, setSelectedRole] = useState<
    'owner' | 'manager' | 'viewer'
  >('viewer')

  // Get farms not yet assigned to this user
  const availableFarms = farms.filter(
    (farm) => !assignments.some((a) => a.farmId === farm.id),
  )

  const handleAssignFarm = async () => {
    if (!user || !selectedFarmId) return
    setIsLoading(true)
    setError(null)

    try {
      await assignUserToFarmFn({
        data: {
          userId: user.id,
          farmId: selectedFarmId,
          role: selectedRole,
        },
      })
      setAddFarmOpen(false)
      setSelectedFarmId('')
      setSelectedRole('viewer')
      onAssignmentChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign farm')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (
    farmId: string,
    newRole: 'owner' | 'manager' | 'viewer',
  ) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      await updateUserFarmRoleFn({
        data: {
          userId: user.id,
          farmId,
          role: newRole,
        },
      })
      onAssignmentChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromFarm = async (farmId: string) => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      await removeUserFromFarmFn({
        data: {
          userId: user.id,
          farmId,
        },
      })
      onAssignmentChange()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove from farm',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Farm Assignments</DialogTitle>
          <DialogDescription>
            Manage farm access for {user?.name || user?.email}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Current Assignments */}
          {assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No farm assignments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <Card key={assignment.farmId} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {assignment.farmName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={assignment.role}
                        onValueChange={(v) => {
                          if (
                            v === 'owner' ||
                            v === 'manager' ||
                            v === 'viewer'
                          ) {
                            handleUpdateRole(assignment.farmId, v)
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveFromFarm(assignment.farmId)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Farm Section */}
          {addFarmOpen ? (
            <Card className="p-4 space-y-3 border-dashed">
              <div className="space-y-2">
                <Label>Select Farm</Label>
                <Select
                  value={selectedFarmId}
                  onValueChange={(v) => setSelectedFarmId(v || '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFarms.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No farms available
                      </SelectItem>
                    ) : (
                      availableFarms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => {
                    if (v === 'owner' || v === 'manager' || v === 'viewer') {
                      setSelectedRole(v)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner - Full access</SelectItem>
                    <SelectItem value="manager">
                      Manager - Can edit data
                    </SelectItem>
                    <SelectItem value="viewer">Viewer - Read only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddFarmOpen(false)
                    setSelectedFarmId('')
                    setSelectedRole('viewer')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAssignFarm}
                  disabled={!selectedFarmId || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assign'
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddFarmOpen(true)}
              disabled={availableFarms.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {availableFarms.length === 0
                ? 'All farms assigned'
                : 'Add Farm Assignment'}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
