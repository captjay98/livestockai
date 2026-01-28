'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createWorkerProfileFn, updateWorkerProfileFn } from '~/features/digital-foreman/server'
import { PERMISSION_TEMPLATES } from '~/features/digital-foreman/permission-service'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'

interface WorkerProfileFormProps {
  farmId: string
  userId?: string
  existingProfile?: {
    id: string
    phone: string
    wageRateAmount: string
    wageRateType: 'hourly' | 'daily' | 'monthly'
    permissions: Array<string>
  }
  onSuccess?: () => void
}

const ALL_PERMISSIONS = ['feed:log', 'mortality:log', 'weight:log', 'vaccination:log', 'water_quality:log', 'egg:log', 'sales:view', 'task:complete', 'batch:view'] as const

export function WorkerProfileForm({ farmId, userId, existingProfile, onSuccess }: WorkerProfileFormProps) {
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState(existingProfile?.phone || '')
  const [wageRateAmount, setWageRateAmount] = useState(existingProfile?.wageRateAmount || '')
  const [wageRateType, setWageRateType] = useState<'hourly' | 'daily' | 'monthly'>(existingProfile?.wageRateType || 'daily')
  const [permissions, setPermissions] = useState<Array<string>>(existingProfile?.permissions || [])

  const create = useMutation({
    mutationFn: createWorkerProfileFn,
    onSuccess: () => {
      toast.success('Worker profile created')
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      onSuccess?.()
    },
    onError: () => toast.error('Failed to create profile'),
  })

  const update = useMutation({
    mutationFn: updateWorkerProfileFn,
    onSuccess: () => {
      toast.success('Worker profile updated')
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      onSuccess?.()
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const handleSubmit = () => {
    if (existingProfile) {
      update.mutate({ data: { profileId: existingProfile.id, phone, wageRateAmount: Number(wageRateAmount), wageRateType, permissions } })
    } else if (userId) {
      create.mutate({ data: { userId, farmId, phone, wageRateAmount: Number(wageRateAmount), wageRateType, permissions } })
    }
  }

  const applyTemplate = (templateKey: string) => {
    const template = PERMISSION_TEMPLATES[templateKey as keyof typeof PERMISSION_TEMPLATES]
    setPermissions([...template])
  }

  const handleCheckboxChange = (perm: string, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setPermissions((prev) => [...prev, perm])
    } else {
      setPermissions((prev) => prev.filter((p) => p !== perm))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingProfile ? 'Edit Worker Profile' : 'Create Worker Profile'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Wage Rate</Label>
            <Input type="number" value={wageRateAmount} onChange={(e) => setWageRateAmount(e.target.value)} />
          </div>
          <div>
            <Label>Rate Type</Label>
            <Select value={wageRateType} onValueChange={(v) => v && setWageRateType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Permission Template</Label>
          <Select onValueChange={(v) => { if (typeof v === 'string' && v) applyTemplate(v) }}>
            <SelectTrigger><SelectValue placeholder="Apply template..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feed_handler">Feed Handler</SelectItem>
              <SelectItem value="health_monitor">Health Monitor</SelectItem>
              <SelectItem value="full_access">Full Access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Permissions</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 text-sm">
                <Checkbox checked={permissions.includes(perm)} onCheckedChange={(checked) => handleCheckboxChange(perm, checked)} />
                {perm}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
          {existingProfile ? 'Update' : 'Create'} Profile
        </Button>
      </CardContent>
    </Card>
  )
}
