import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    description: string | null
    frequency: 'daily' | 'weekly' | 'monthly'
  }) => void | Promise<void>
  isLoading?: boolean
}

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: TaskDialogProps) {
  const { t } = useTranslation(['common', 'tasks'])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (title.trim().length < 3) {
      setError(t('tasks:validation.titleMinLength'))
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        frequency,
      })
      // Reset form on success
      setTitle('')
      setDescription('')
      setFrequency('daily')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:error'))
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setTitle('')
      setDescription('')
      setFrequency('daily')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('tasks:createTask')}</DialogTitle>
            <DialogDescription>{t('tasks:createTaskDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t('tasks:taskTitle')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('tasks:taskTitlePlaceholder')}
                disabled={isLoading}
                minLength={3}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">{t('tasks:frequency')} *</Label>
              <Select
                value={frequency}
                onValueChange={(v) =>
                  setFrequency(v as 'daily' | 'weekly' | 'monthly')
                }
                disabled={isLoading}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('tasks:daily')}</SelectItem>
                  <SelectItem value="weekly">{t('tasks:weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('tasks:monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('tasks:taskDescription')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('tasks:taskDescriptionPlaceholder')}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {t('common:cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common:saving') : t('common:create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
