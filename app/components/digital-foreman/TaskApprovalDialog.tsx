'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Check, Clock, Image as ImageIcon, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { approveTaskFn } from '~/features/digital-foreman/server-tasks'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'

interface TaskPhoto {
  id: string
  photoUrl: string
  capturedAt: string
}

interface TaskAssignment {
  id: string
  workerName: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  dueDate: string | null
  completedAt: string | null
  completionNotes: string | null
  photos?: Array<TaskPhoto>
}

interface TaskApprovalDialogProps {
  task: TaskAssignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskApprovalDialog({ task, open, onOpenChange }: TaskApprovalDialogProps) {
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const approve = useMutation({
    mutationFn: approveTaskFn,
    onSuccess: () => {
      toast.success('Task approved')
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] })
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to approve task'),
  })

  const reject = useMutation({
    mutationFn: approveTaskFn,
    onSuccess: () => {
      toast.success('Task rejected')
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] })
      onOpenChange(false)
      setRejectionReason('')
    },
    onError: () => toast.error('Failed to reject task'),
  })

  if (!task) return null

  const handleApprove = () => {
    approve.mutate({ data: { assignmentId: task.id, approved: true } })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    reject.mutate({ data: { assignmentId: task.id, approved: false, rejectionReason } })
  }

  const priorityColors = { low: 'secondary', medium: 'default', high: 'destructive', urgent: 'destructive' } as const

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Task Completion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{task.workerName || 'Unknown'}</span>
              </div>
              <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Due: {format(new Date(task.dueDate), 'PPp')}</span>
              </div>
            )}

            {task.completedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4" />
                <span>Completed: {format(new Date(task.completedAt), 'PPp')}</span>
              </div>
            )}

            {task.completionNotes && (
              <div className="bg-muted p-3 rounded-lg">
                <Label className="text-xs text-muted-foreground">Completion Notes</Label>
                <p className="mt-1 text-sm">{task.completionNotes}</p>
              </div>
            )}

            {task.photos && task.photos.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Photo Evidence</Label>
                <div className="grid grid-cols-3 gap-2">
                  {task.photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      onClick={() => setSelectedPhoto(photo.photoUrl)}
                    >
                      <img src={photo.photoUrl} alt="Task photo" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {task.photos?.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>No photos attached</span>
              </div>
            )}

            <div>
              <Label htmlFor="rejection-reason">Rejection Reason (required if rejecting)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this task is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reject.isPending || approve.isPending}
              className="min-h-[48px]"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approve.isPending || reject.isPending}
              className="min-h-[48px]"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img src={selectedPhoto} alt="Task photo preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
