'use client'

import { AlertTriangle, Clock, UserCheck, UserX } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'

interface AttendanceSummaryCardProps {
    present: number
    absent: number
    late: number
    flagged: number
    totalHours: number
}

export function AttendanceSummaryCard({
    present,
    absent,
    late,
    flagged,
    totalHours,
}: AttendanceSummaryCardProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Card>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <div>
                            <div className="text-2xl font-bold">{present}</div>
                            <div className="text-xs text-muted-foreground">
                                Present
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <UserX className="h-5 w-5 text-red-600" />
                        <div>
                            <div className="text-2xl font-bold">{absent}</div>
                            <div className="text-xs text-muted-foreground">
                                Absent
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                            <div className="text-2xl font-bold">{late}</div>
                            <div className="text-xs text-muted-foreground">
                                Late
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                            <div className="text-2xl font-bold">{flagged}</div>
                            <div className="text-xs text-muted-foreground">
                                Flagged
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                            <div className="text-2xl font-bold">
                                {totalHours.toFixed(1)}h
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Total Hours
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
