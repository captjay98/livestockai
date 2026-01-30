import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'
import { assignUserToDistrictFn } from '~/features/extension/admin-server'
import { useErrorMessage } from '~/hooks/useErrorMessage'

interface AssignUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  districts: Array<{ id: string; name: string }>
}

export function AssignUserDialog({
  open,
  onOpenChange,
  districts,
}: AssignUserDialogProps) {
  const { t } = useTranslation(['extension'])
  const queryClient = useQueryClient()
  const getErrorMessage = useErrorMessage()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [isSupervisor, setIsSupervisor] = useState(false)

  // Fetch users list
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      return db
        .selectFrom('users')
        .select(['id', 'name', 'email'])
        .where('role', 'in', ['user', 'admin'])
        .execute()
    },
    enabled: open,
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      assignUserToDistrictFn({
        data: {
          userId: selectedUserId,
          districtId: selectedDistrictId,
          isSupervisor,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['district-assignments'] })
      toast.success(
        t('extension:messages.userAssigned', {
          defaultValue: 'User assigned to district',
        }),
      )
      onOpenChange(false)
      // Reset form
      setSelectedUserId('')
      setSelectedDistrictId('')
      setIsSupervisor(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedDistrictId) {
      toast.error(
        t('extension:messages.selectBothFields', {
          defaultValue: 'Please select both user and district',
        }),
      )
      return
    }
    assignMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('extension:admin.assignUserTitle', {
              defaultValue: 'Assign User to District',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('extension:admin.assignUserDesc', {
              defaultValue:
                'Select a user and district to create a new assignment',
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select
              value={selectedUserId}
              onValueChange={(val) => val && setSelectedUserId(val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('extension:placeholders.selectUser', {
                    defaultValue: 'Select user',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Select
              value={selectedDistrictId}
              onValueChange={(val) => val && setSelectedDistrictId(val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('extension:placeholders.selectDistrict', {
                    defaultValue: 'Select district',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="supervisor"
              checked={isSupervisor}
              onCheckedChange={(checked) => setIsSupervisor(checked as boolean)}
            />
            <Label
              htmlFor="supervisor"
              className="text-sm font-normal cursor-pointer"
            >
              Assign as supervisor
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending
                ? t('extension:actions.assigning', {
                    defaultValue: 'Assigning...',
                  })
                : t('extension:actions.assignUser', {
                    defaultValue: 'Assign User',
                  })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
