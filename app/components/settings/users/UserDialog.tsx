import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Building2, Loader2, Plus, Trash2 } from 'lucide-react'
import type { FarmAssignment, FarmData, UserData } from './types'
import { useUserMutations } from '~/features/users/mutations'
import { useFarmUserMutations } from '~/features/farms/mutations'
import { Button } from '~/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
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
import { Card } from '~/components/ui/card'

// Add User Dialog
interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddUserDialogProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { createUser } = useUserMutations()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'admin',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser.mutate(formData, {
      onSuccess: () => {
        setFormData({ email: '', password: '', name: '', role: 'user' })
        onSuccess()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.dialogs.add.title')}</DialogTitle>
          <DialogDescription>{t('users.dialogs.add.desc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {createUser.error && (
            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
              {createUser.error instanceof Error
                ? createUser.error.message
                : t('users.errors.create')}
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
            <Label htmlFor="password">{t('users.form.password')}</Label>
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
                <SelectItem value="user">{t('users.roles.user')}</SelectItem>
                <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
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
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? (
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

// Ban User Dialog
interface BanUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  onConfirm: (reason?: string) => void
  isLoading: boolean
}

export function BanUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading,
}: BanUserDialogProps) {
  const { t } = useTranslation(['settings', 'common'])
  const [reason, setReason] = useState('')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('users.dialogs.ban.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="users.dialogs.ban.desc"
              values={{ name: user?.name || user?.email }}
              components={{ b: <b /> }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="ban-reason">{t('users.dialogs.ban.reason')}</Label>
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

// Reset Password Dialog
interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  onSuccess: () => void
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { setUserPassword } = useUserMutations()
  const [newPassword, setNewPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUserPassword.mutate(
      { userId: user.id, newPassword },
      {
        onSuccess: () => {
          setNewPassword('')
          onSuccess()
        },
      },
    )
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
          {setUserPassword.error && (
            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
              {setUserPassword.error instanceof Error
                ? setUserPassword.error.message
                : t('users.errors.resetPassword')}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('users.form.newPassword')}</Label>
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
            <Button type="submit" disabled={setUserPassword.isPending}>
              {setUserPassword.isPending ? (
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

// Farm Assignment Dialog
interface FarmAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData | null
  farms: Array<FarmData>
  assignments: Array<FarmAssignment>
  onAssignmentChange: () => void
}

export function FarmAssignmentDialog({
  open,
  onOpenChange,
  user,
  farms,
  assignments,
  onAssignmentChange,
}: FarmAssignmentDialogProps) {
  const { t } = useTranslation(['settings', 'common'])
  const {
    assignUserToFarm,
    updateUserFarmRole,
    removeUserFromFarm,
    isPending,
  } = useFarmUserMutations()
  const [addFarmOpen, setAddFarmOpen] = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [selectedRole, setSelectedRole] = useState<
    'owner' | 'manager' | 'viewer'
  >('viewer')

  // Get farms not yet assigned to this user
  const availableFarms = farms.filter(
    (farm) => !assignments.some((a) => a.farmId === farm.id),
  )

  const handleAssignFarm = () => {
    if (!user || !selectedFarmId) return

    assignUserToFarm.mutate(
      {
        userId: user.id,
        farmId: selectedFarmId,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setAddFarmOpen(false)
          setSelectedFarmId('')
          setSelectedRole('viewer')
          onAssignmentChange()
        },
      },
    )
  }

  const handleUpdateRole = (
    farmId: string,
    newRole: 'owner' | 'manager' | 'viewer',
  ) => {
    if (!user) return

    updateUserFarmRole.mutate(
      {
        userId: user.id,
        farmId,
        role: newRole,
      },
      {
        onSuccess: () => {
          onAssignmentChange()
        },
      },
    )
  }

  const handleRemoveFromFarm = (farmId: string) => {
    if (!user) return

    removeUserFromFarm.mutate(
      {
        userId: user.id,
        farmId,
      },
      {
        onSuccess: () => {
          onAssignmentChange()
        },
      },
    )
  }

  const error =
    assignUserToFarm.error ||
    updateUserFarmRole.error ||
    removeUserFromFarm.error

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
            {error instanceof Error ? error.message : t('common:error.generic')}
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
                            handleUpdateRole(assignment.farmId, v)
                          }
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">
                            {t('users.roles.owner', {
                              defaultValue: 'Owner',
                            })}
                          </SelectItem>
                          <SelectItem value="manager">
                            {t('users.roles.manager', {
                              defaultValue: 'Manager',
                            })}
                          </SelectItem>
                          <SelectItem value="viewer">
                            {t('users.roles.viewer', {
                              defaultValue: 'Viewer',
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => handleRemoveFromFarm(assignment.farmId)}
                        disabled={isPending}
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
                <Label>{t('users.dialogs.farms.selectFarm')}</Label>
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
                        {t('users.dialogs.farms.noFarms')}
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
                <Label>{t('users.dialogs.farms.role')}</Label>
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
                  disabled={!selectedFarmId || isPending}
                >
                  {isPending ? (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.done', { defaultValue: 'Done' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
