'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { completeTaskFn } from '~/features/digital-foreman/server-tasks'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'

interface TaskCompletionDialogProps {
    assignmentId: string
    requiresPhoto: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TaskCompletionDialog({
    assignmentId,
    requiresPhoto,
    open,
    onOpenChange,
}: TaskCompletionDialogProps) {
    const queryClient = useQueryClient()
    const [notes, setNotes] = useState('')
    const [photo, setPhoto] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const complete = useMutation({
        mutationFn: completeTaskFn,
        onSuccess: () => {
            toast.success('Task completed')
            queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
            queryClient.invalidateQueries({ queryKey: ['task-assignments'] })
            onOpenChange(false)
            setNotes('')
            setPhoto(null)
        },
        onError: () => toast.error('Failed to complete task'),
    })

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPhoto(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = () => {
        if (requiresPhoto && !photo) {
            toast.error('Photo is required')
            return
        }

        complete.mutate({
            data: {
                assignmentId,
                completionNotes: notes || undefined,
                photoData: photo
                    ? { base64: photo, capturedAt: new Date() }
                    : undefined,
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add completion notes..."
                        />
                    </div>

                    <div>
                        <Label>
                            {requiresPhoto
                                ? 'Photo (Required)'
                                : 'Photo (Optional)'}
                        </Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoCapture}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            {photo ? 'Change Photo' : 'Take Photo'}
                        </Button>
                        {photo && (
                            <img
                                src={photo}
                                alt="Captured"
                                className="mt-2 rounded-lg max-h-40 object-cover"
                            />
                        )}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={complete.isPending}
                        className="w-full"
                    >
                        Complete Task
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
