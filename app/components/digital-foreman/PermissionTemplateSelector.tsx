'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { ModulePermission } from '~/lib/db/types'
import {
  PERMISSION_TEMPLATES,
  getPermissionsFromTemplate,
} from '~/features/digital-foreman/permission-service'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'

const ALL_PERMISSIONS: Array<{
  key: ModulePermission
  label: string
  description: string
}> = [
  {
    key: 'feed:log',
    label: 'Log Feed',
    description: 'Record feed consumption',
  },
  {
    key: 'mortality:log',
    label: 'Log Mortality',
    description: 'Record deaths',
  },
  {
    key: 'weight:log',
    label: 'Log Weight',
    description: 'Record weight samples',
  },
  {
    key: 'vaccination:log',
    label: 'Log Vaccination',
    description: 'Record vaccinations',
  },
  {
    key: 'water_quality:log',
    label: 'Log Water Quality',
    description: 'Record water tests',
  },
  { key: 'egg:log', label: 'Log Eggs', description: 'Record egg production' },
  {
    key: 'sales:view',
    label: 'View Sales',
    description: 'View sales records',
  },
  {
    key: 'task:complete',
    label: 'Complete Tasks',
    description: 'Mark tasks as done',
  },
  {
    key: 'batch:view',
    label: 'View Batches',
    description: 'View batch details',
  },
]

type TemplateName = keyof typeof PERMISSION_TEMPLATES | 'custom'

interface PermissionTemplateSelectorProps {
  value: Array<ModulePermission>
  onChange: (permissions: Array<ModulePermission>) => void
}

export function PermissionTemplateSelector({
  value,
  onChange,
}: PermissionTemplateSelectorProps) {
  const [template, setTemplate] = useState<TemplateName>('custom')

  // Detect if current permissions match a template
  useEffect(() => {
    const templateNames = Object.keys(PERMISSION_TEMPLATES) as Array<
      keyof typeof PERMISSION_TEMPLATES
    >
    for (const name of templateNames) {
      const templatePerms = getPermissionsFromTemplate(name)
      if (
        templatePerms.length === value.length &&
        templatePerms.every((p) => value.includes(p))
      ) {
        setTemplate(name)
        return
      }
    }
    setTemplate('custom')
  }, [value])

  const handleTemplateChange = (newTemplate: TemplateName) => {
    setTemplate(newTemplate)
    if (newTemplate !== 'custom') {
      onChange(getPermissionsFromTemplate(newTemplate))
    }
  }

  const handlePermissionToggle = (
    permission: ModulePermission,
    checked: boolean,
  ) => {
    if (checked) {
      onChange([...value, permission])
    } else {
      onChange(value.filter((p) => p !== permission))
    }
    setTemplate('custom')
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Permission Template</Label>
        <Select
          value={template}
          onValueChange={(v) => handleTemplateChange(v as TemplateName)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feed_handler">Feed Handler</SelectItem>
            <SelectItem value="health_monitor">Health Monitor</SelectItem>
            <SelectItem value="full_access">Full Access</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {template === 'feed_handler' && 'Can log feed and complete tasks'}
          {template === 'health_monitor' &&
            'Can log mortality, vaccinations, and water quality'}
          {template === 'full_access' && 'Access to all worker functions'}
          {template === 'custom' && 'Select individual permissions below'}
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Permissions</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_PERMISSIONS.map((perm) => (
            <label
              key={perm.key}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={value.includes(perm.key)}
                onCheckedChange={(checked) =>
                  handlePermissionToggle(perm.key, !!checked)
                }
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{perm.label}</div>
                <div className="text-xs text-muted-foreground">
                  {perm.description}
                </div>
              </div>
              {value.includes(perm.key) && (
                <Check className="h-4 w-4 text-green-600 shrink-0" />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {value.length} permission{value.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  )
}
