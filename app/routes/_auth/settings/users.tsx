import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
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
} from '~/features/users/server'
import {
    assignUserToFarmFn,
    getUserFarmsWithRolesFn,
    removeUserFromFarmFn,
    updateUserFarmRoleFn,
} from '~/features/farms/server'
import { UsersSkeleton } from '~/components/settings/users-skeleton'

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
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
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
        <div className="p-4 text-red-600">
            Error loading users: {error.message}
        </div>
    ),
})

function UsersSettingsPage() {
    const { t } = useTranslation(['settings', 'common'])
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
        } catch (err) {
            setError(
                err instanceof Error ? err.message : t('users.errors.unban'),
            )
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
            setError(
                err instanceof Error ? err.message : t('users.errors.delete'),
            )
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
            setError(
                err instanceof Error ? err.message : t('users.errors.role'),
            )
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
                        <div>
                            <h3 className="text-lg font-medium">
                                {t('users.title')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t('users.description')}
                            </p>
                        </div>
                        <Button onClick={() => setAddUserOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('users.add')}
                        </Button>
                    </div>
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
                        placeholder={t('users.search')}
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
                            <h3 className="font-medium mb-1">
                                {t('users.empty.title')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery
                                    ? t('users.empty.desc')
                                    : t('users.empty.descEmpty')}
                            </p>
                        </Card>
                    ) : (
                        filteredUsers.map((user) => (
                            <Card key={user.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <span className="text-sm font-medium">
                                                {user.name
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                    user.email
                                                        .charAt(0)
                                                        .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">
                                                    {user.name ||
                                                        t('users.unnamed')}
                                                </span>
                                                {user.role === 'admin' && (
                                                    <Badge
                                                        variant="default"
                                                        className="shrink-0"
                                                    >
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        {t('users.roles.admin')}
                                                    </Badge>
                                                )}
                                                {user.banned && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="shrink-0"
                                                    >
                                                        <Ban className="h-3 w-3 mr-1" />
                                                        {t(
                                                            'users.status.banned',
                                                        )}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('users.status.joined')}{' '}
                                                {format(
                                                    new Date(user.createdAt),
                                                    'MMM d, yyyy',
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isLoading}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent align="end">
                                            {/* Manage Farm Assignments */}
                                            <DropdownMenuItem
                                                onClick={async () => {
                                                    setSelectedUser(user)
                                                    await loadUserFarmAssignments(
                                                        user.id,
                                                    )
                                                    setFarmAssignmentOpen(true)
                                                }}
                                            >
                                                <Building2 className="h-4 w-4 mr-2" />
                                                {t('users.actions.manageFarms')}
                                            </DropdownMenuItem>
                                            {/* Reset Password */}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setResetPasswordOpen(true)
                                                }}
                                            >
                                                <KeyRound className="h-4 w-4 mr-2" />
                                                {t(
                                                    'users.actions.resetPassword',
                                                )}
                                            </DropdownMenuItem>

                                            {/* Toggle Admin (not for self) */}
                                            {user.id !== session.user.id && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleToggleAdmin(
                                                            user.id,
                                                            user.role,
                                                        )
                                                    }
                                                >
                                                    {user.role === 'admin' ? (
                                                        <>
                                                            <ShieldOff className="h-4 w-4 mr-2" />
                                                            {t(
                                                                'users.actions.removeAdmin',
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield className="h-4 w-4 mr-2" />
                                                            {t(
                                                                'users.actions.makeAdmin',
                                                            )}
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
                                                        onClick={() =>
                                                            handleUnbanUser(
                                                                user.id,
                                                            )
                                                        }
                                                    >
                                                        <Check className="h-4 w-4 mr-2" />
                                                        {t(
                                                            'users.actions.unban',
                                                        )}
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(
                                                                user,
                                                            )
                                                            setBanDialogOpen(
                                                                true,
                                                            )
                                                        }}
                                                    >
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        {t('users.actions.ban')}
                                                    </DropdownMenuItem>
                                                ))}

                                            {/* Delete (not for self or admins) */}
                                            {user.id !== session.user.id &&
                                                user.role !== 'admin' && (
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setSelectedUser(
                                                                user,
                                                            )
                                                            setDeleteDialogOpen(
                                                                true,
                                                            )
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        {t(
                                                            'users.actions.delete',
                                                        )}
                                                    </DropdownMenuItem>
                                                )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Show ban reason if banned */}
                                {user.banned && user.banReason && (
                                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                        <span className="font-medium">
                                            {t('users.banReason')}:
                                        </span>{' '}
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
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t('users.dialogs.delete.title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                <Trans
                                    i18nKey="users.dialogs.delete.desc"
                                    values={{
                                        name:
                                            selectedUser?.name ||
                                            selectedUser?.email,
                                    }}
                                    components={{ b: <b /> }}
                                />
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {t('common.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteUser}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    t('users.dialogs.delete.submit')
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
    const { t } = useTranslation(['settings', 'common'])
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
            setError(
                err instanceof Error ? err.message : t('users.errors.create'),
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('users.dialogs.add.title')}</DialogTitle>
                    <DialogDescription>
                        {t('users.dialogs.add.desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">{t('users.form.name')}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder={t('users.form.namePlaceholder')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{t('users.form.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                            placeholder={t('users.form.emailPlaceholder')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {t('users.form.password')}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                }))
                            }
                            placeholder={t('users.form.passwordPlaceholder')}
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">{t('users.form.role')}</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(v) => {
                                if (v === 'user' || v === 'admin') {
                                    setFormData((prev) => ({
                                        ...prev,
                                        role: v,
                                    }))
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">
                                    {t('users.roles.user')}
                                </SelectItem>
                                <SelectItem value="admin">
                                    {t('users.roles.admin')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('users.form.roleDesc')}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t('users.dialogs.add.submit')
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
    const { t } = useTranslation(['settings', 'common'])
    const [reason, setReason] = useState('')

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('users.dialogs.ban.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <Trans
                            i18nKey="users.dialogs.ban.desc"
                            values={{ name: user?.name || user?.email }}
                            components={{ b: <b /> }}
                        />
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2">
                    <Label htmlFor="ban-reason">
                        {t('users.dialogs.ban.reason')}
                    </Label>
                    <Input
                        id="ban-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('users.dialogs.ban.reason')}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason('')}>
                        {t('common.cancel')}
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
                            t('users.dialogs.ban.submit')
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
    const { t } = useTranslation(['settings', 'common'])
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
            setError(
                err instanceof Error
                    ? err.message
                    : t('users.errors.resetPassword'),
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('users.dialogs.reset.title')}</DialogTitle>
                    <DialogDescription>
                        <Trans
                            i18nKey="users.dialogs.reset.desc"
                            values={{ name: user?.name || user?.email }}
                            components={{ b: <b /> }}
                        />
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="new-password">
                            {t('users.form.newPassword')}
                        </Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('users.form.passwordPlaceholder')}
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
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t('users.dialogs.reset.submit')
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
    const { t } = useTranslation(['settings', 'common'])
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
            setError(
                err instanceof Error
                    ? err.message
                    : t('users.errors.assignFarm'),
            )
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
            setError(
                err instanceof Error
                    ? err.message
                    : t('users.errors.updateFarmRole'),
            )
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
                err instanceof Error
                    ? err.message
                    : t('users.errors.removeFromFarm'),
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('users.dialogs.farms.title')}</DialogTitle>
                    <DialogDescription>
                        {t('users.dialogs.farms.desc', {
                            name: user?.name || user?.email,
                        })}
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
                            <p>{t('users.dialogs.farms.empty')}</p>
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
                                                        handleUpdateRole(
                                                            assignment.farmId,
                                                            v,
                                                        )
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-28 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="owner">
                                                        {t(
                                                            'users.roles.owner',
                                                            {
                                                                defaultValue:
                                                                    'Owner',
                                                            },
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="manager">
                                                        {t(
                                                            'users.roles.manager',
                                                            {
                                                                defaultValue:
                                                                    'Manager',
                                                            },
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="viewer">
                                                        {t(
                                                            'users.roles.viewer',
                                                            {
                                                                defaultValue:
                                                                    'Viewer',
                                                            },
                                                        )}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    handleRemoveFromFarm(
                                                        assignment.farmId,
                                                    )
                                                }
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
                                <Label>
                                    {t('users.dialogs.farms.selectFarm')}
                                </Label>
                                <Select
                                    value={selectedFarmId}
                                    onValueChange={(v) =>
                                        setSelectedFarmId(v || '')
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableFarms.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                {t(
                                                    'users.dialogs.farms.noFarms',
                                                )}
                                            </SelectItem>
                                        ) : (
                                            availableFarms.map((farm) => (
                                                <SelectItem
                                                    key={farm.id}
                                                    value={farm.id}
                                                >
                                                    {farm.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('users.dialogs.farms.role')}</Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(v) => {
                                        if (
                                            v === 'owner' ||
                                            v === 'manager' ||
                                            v === 'viewer'
                                        ) {
                                            setSelectedRole(v)
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">
                                            {t('users.dialogs.farms.owner')}
                                        </SelectItem>
                                        <SelectItem value="manager">
                                            {t('users.dialogs.farms.manager')}
                                        </SelectItem>
                                        <SelectItem value="viewer">
                                            {t('users.dialogs.farms.viewer')}
                                        </SelectItem>
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
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAssignFarm}
                                    disabled={!selectedFarmId || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        t('users.dialogs.farms.assign')
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
                                ? t('users.dialogs.farms.assigned')
                                : t('users.dialogs.farms.add')}
                        </Button>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.done', { defaultValue: 'Done' })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
