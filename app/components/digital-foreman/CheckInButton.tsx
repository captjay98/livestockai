'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogIn, LogOut, MapPin } from 'lucide-react'
import { checkInFn, checkOutFn } from '~/features/digital-foreman/server'
import { Button } from '~/components/ui/button'

interface CheckInButtonProps {
    farmId: string
    checkInId?: string | null
    isCheckedIn: boolean
}

export function CheckInButton({
    farmId,
    checkInId,
    isCheckedIn,
}: CheckInButtonProps) {
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    const checkIn = useMutation({
        mutationFn: checkInFn,
        onSuccess: () => {
            toast.success('Checked in successfully')
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
        onError: () => toast.error('Check-in failed'),
    })

    const checkOut = useMutation({
        mutationFn: checkOutFn,
        onSuccess: () => {
            toast.success('Checked out successfully')
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
        onError: () => toast.error('Check-out failed'),
    })

    const handleClick = async () => {
        setLoading(true)
        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                    })
                },
            )

            const { latitude, longitude, accuracy } = position.coords

            if (isCheckedIn && checkInId) {
                await checkOut.mutateAsync({
                    data: { checkInId, latitude, longitude },
                })
            } else {
                await checkIn.mutateAsync({
                    data: { farmId, latitude, longitude, accuracy },
                })
            }
        } catch (error) {
            toast.error('Could not get location')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            size="lg"
            className="h-16 w-full text-lg"
            variant={isCheckedIn ? 'destructive' : 'default'}
        >
            {loading ? (
                <MapPin className="mr-2 h-6 w-6 animate-pulse" />
            ) : isCheckedIn ? (
                <LogOut className="mr-2 h-6 w-6" />
            ) : (
                <LogIn className="mr-2 h-6 w-6" />
            )}
            {isCheckedIn ? 'Check Out' : 'Check In'}
        </Button>
    )
}
