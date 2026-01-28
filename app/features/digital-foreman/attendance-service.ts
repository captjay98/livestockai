/**
 * Pure business logic for attendance tracking.
 * All functions are side-effect-free and easily unit testable.
 */

export interface AttendanceRecord {
  checkIn: Date
  checkOut?: Date | null
}

export interface AttendanceSummary {
  totalHours: number
  totalDays: number
  flaggedCheckIns: number
}

/**
 * Calculate hours worked between check-in and check-out times
 * 
 * @param checkIn - Check-in timestamp
 * @param checkOut - Check-out timestamp
 * @returns Hours worked rounded to 2 decimal places
 */
export function calculateHoursWorked(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime()
  const hours = diffMs / (1000 * 60 * 60)
  return Math.round(hours * 100) / 100
}

/**
 * Check if a new check-in is a duplicate within the threshold
 * 
 * @param lastCheckInTime - Previous check-in timestamp
 * @param newCheckInTime - New check-in timestamp
 * @param thresholdMinutes - Duplicate threshold in minutes (default: 5)
 * @returns True if within duplicate threshold
 */
export function isDuplicateCheckIn(
  lastCheckInTime: Date,
  newCheckInTime: Date,
  thresholdMinutes: number = 5
): boolean {
  const diffMs = Math.abs(newCheckInTime.getTime() - lastCheckInTime.getTime())
  const diffMinutes = diffMs / (1000 * 60)
  return diffMinutes < thresholdMinutes
}

/**
 * Check if auto-checkout should trigger (spans midnight)
 * 
 * @param checkInTime - Check-in timestamp
 * @param currentTime - Current timestamp
 * @returns True if check-in and current time are on different days
 */
export function shouldAutoCheckOut(checkInTime: Date, currentTime: Date): boolean {
  const checkInDate = new Date(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate())
  const currentDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
  return checkInDate.getTime() !== currentDate.getTime()
}

/**
 * Calculate attendance summary for a period
 * 
 * @param checkIns - Array of attendance records
 * @param periodStart - Period start date
 * @param periodEnd - Period end date
 * @returns Summary with total hours, days, and flagged check-ins
 */
export function calculateAttendanceSummary(
  checkIns: Array<AttendanceRecord>,
  periodStart: Date,
  periodEnd: Date
): AttendanceSummary {
  const periodRecords = checkIns.filter(record => 
    record.checkIn >= periodStart && record.checkIn <= periodEnd
  )

  let totalHours = 0
  let flaggedCheckIns = 0
  const workDays = new Set<string>()

  for (const record of periodRecords) {
    const dayKey = record.checkIn.toDateString()
    workDays.add(dayKey)

    if (record.checkOut) {
      totalHours += calculateHoursWorked(record.checkIn, record.checkOut)
    } else {
      flaggedCheckIns++
    }
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalDays: workDays.size,
    flaggedCheckIns
  }
}