/**
 * Pure business logic for vaccination operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type {
  CreateTreatmentInput,
  CreateVaccinationInput,
  UpdateTreatmentInput,
  UpdateVaccinationInput,
} from './server'

/**
 * Calculate next vaccination date based on last date and interval
 *
 * @param lastDate - Date of the last vaccination
 * @param intervalDays - Number of days between vaccinations
 * @returns Next vaccination date, or null if interval is invalid
 *
 * @example
 * ```ts
 * const nextDate = calculateNextVaccinationDate(
 *   new Date('2024-01-01'),
 *   30
 * )
 * // Returns: Date('2024-01-31')
 * ```
 */
export function calculateNextVaccinationDate(
  lastDate: Date,
  intervalDays: number,
): Date | null {
  if (intervalDays <= 0) {
    return null
  }

  if (isNaN(lastDate.getTime())) {
    return null
  }

  const nextDate = new Date(lastDate)
  nextDate.setDate(nextDate.getDate() + intervalDays)
  return nextDate
}

/**
 * Validate vaccination data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Vaccination creation data to validate
 * @param batchId - ID of the batch (for validation context)
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateVaccinationData({
 *   batchId: 'batch-1',
 *   vaccineName: 'Newcastle',
 *   dateAdministered: new Date(),
 *   dosage: '0.5ml'
 * }, 'batch-1')
 * // Returns: null (valid)
 *
 * const invalidError = validateVaccinationData({
 *   ...sameData,
 *   vaccineName: ''
 * }, 'batch-1')
 * // Returns: "Vaccine name is required"
 * ```
 */
export function validateVaccinationData(
  data: CreateVaccinationInput,
  batchId: string,
): string | null {
  if (!data.batchId || data.batchId.trim() === '') {
    return 'Batch ID is required'
  }

  if (data.batchId !== batchId) {
    return 'Batch ID mismatch'
  }

  if (!data.vaccineName || data.vaccineName.trim() === '') {
    return 'Vaccine name is required'
  }

  if (!data.dosage || data.dosage.trim() === '') {
    return 'Dosage is required'
  }

  if (isNaN(data.dateAdministered.getTime())) {
    return 'Administration date is required'
  }

  // Validate next due date is after administration date if provided
  if (data.nextDueDate !== null && data.nextDueDate !== undefined) {
    if (data.nextDueDate <= data.dateAdministered) {
      return 'Next due date must be after administration date'
    }
  }

  return null
}

/**
 * Calculate vaccination compliance rate
 * Returns percentage of completed vaccinations
 *
 * @param scheduled - Number of scheduled vaccinations
 * @param completed - Number of completed vaccinations
 * @returns Compliance rate as a percentage (0-100)
 *
 * @example
 * ```ts
 * const rate = calculateComplianceRate(10, 8)
 * // Returns: 80 (80% compliance rate)
 * ```
 */
export function calculateComplianceRate(
  scheduled: number,
  completed: number,
): number {
  if (scheduled <= 0) {
    return 100 // No scheduled vaccinations means 100% compliant
  }

  const rate = (completed / scheduled) * 100
  return Math.min(100, Math.max(0, rate))
}

/**
 * Determine vaccination status based on dates
 *
 * @param scheduledDate - Date the vaccination was scheduled
 * @param completedDate - Date the vaccination was completed (null if not completed)
 * @returns 'pending', 'completed', or 'overdue'
 *
 * @example
 * ```ts
 * const status = determineVaccinationStatus(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-02')
 * )
 * // Returns: 'completed'
 *
 * const overdueStatus = determineVaccinationStatus(
 *   new Date('2024-01-01'),
 *   null
 * )
 * // Returns: 'overdue' (if past date)
 * ```
 */
export function determineVaccinationStatus(
  scheduledDate: Date,
  completedDate: Date | null,
): 'pending' | 'completed' | 'overdue' {
  if (completedDate !== null) {
    return 'completed'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const scheduled = new Date(scheduledDate)
  scheduled.setHours(0, 0, 0, 0)

  if (scheduled < today) {
    return 'overdue'
  }

  return 'pending'
}

/**
 * Build vaccination summary from records
 *
 * @param records - Array of vaccination records
 * @returns Summary object with totals and compliance info
 *
 * @example
 * ```ts
 * const summary = buildVaccinationSummary([
 *   { nextDueDate: new Date(), dateAdministered: new Date() },
 *   { nextDueDate: null, dateAdministered: new Date() }
 * ])
 * // Returns: { total: 2, completed: 1, scheduled: 1, ... }
 * ```
 */
export function buildVaccinationSummary(
  records: Array<{
    nextDueDate: Date | null
    dateAdministered: Date
  }>,
): {
  total: number
  completed: number
  scheduled: number
  overdue: number
  upcoming: number
  complianceRate: number
} {
  const total = records.length
  let completed = 0
  let overdue = 0
  let upcoming = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const record of records) {
    if (record.nextDueDate === null) {
      completed++
    } else {
      const dueDate = new Date(record.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        overdue++
      } else {
        upcoming++
      }
    }
  }

  const scheduled = overdue + upcoming
  const complianceRate = calculateComplianceRate(total, completed)

  return {
    total,
    completed,
    scheduled,
    overdue,
    upcoming,
    complianceRate,
  }
}

/**
 * Get upcoming vaccinations within a time window
 *
 * @param records - Array of vaccination records
 * @param daysAhead - Number of days to look ahead
 * @returns Array of upcoming vaccination records
 *
 * @example
 * ```ts
 * const upcoming = getUpcomingVaccinations(records, 7)
 * // Returns: vaccinations due in the next 7 days
 * ```
 */
export function getUpcomingVaccinations<T extends { nextDueDate: Date | null }>(
  records: Array<T>,
  daysAhead: number,
): Array<T> {
  if (daysAhead <= 0) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  futureDate.setHours(23, 59, 59, 999)

  return records.filter((record) => {
    if (record.nextDueDate === null) {
      return false
    }

    const dueDate = new Date(record.nextDueDate)
    dueDate.setHours(0, 0, 0, 0)

    return dueDate >= today && dueDate <= futureDate
  })
}

/**
 * Build compliance statistics from vaccination records
 *
 * @param records - Array of vaccination records
 * @returns Statistics object with compliance metrics
 *
 * @example
 * ```ts
 * const stats = buildComplianceStats(records)
 * // Returns: { onTimeRate, overdueRate, completedRate, ... }
 * ```
 */
export function buildComplianceStats(
  records: Array<{
    nextDueDate: Date | null
    dateAdministered: Date
  }>,
): {
  onTimeRate: number
  overdueRate: number
  completedRate: number
  pendingRate: number
} {
  let completedOnTime = 0
  let pending = 0
  let overdue = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const record of records) {
    if (record.nextDueDate === null) {
      // Completed - check if on time
      completedOnTime++
    } else {
      const dueDate = new Date(record.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        overdue++
      } else {
        pending++
      }
    }
  }

  const total = records.length
  if (total === 0) {
    return {
      onTimeRate: 100,
      overdueRate: 0,
      completedRate: 100,
      pendingRate: 0,
    }
  }

  return {
    onTimeRate: (completedOnTime / total) * 100,
    overdueRate: (overdue / total) * 100,
    completedRate: (completedOnTime / total) * 100,
    pendingRate: (pending / total) * 100,
  }
}

/**
 * Map sort column from UI to database column
 *
 * @param sortBy - UI sort column identifier
 * @returns Database column name
 *
 * @example
 * ```ts
 * const dbColumn = mapSortColumnToDbColumn('vaccineName')
 * // Returns: 'vaccineName'
 * ```
 */
export function mapSortColumnToDbColumn(sortBy: string): string {
  const columnMap: Record<string, string> = {
    date: 'dateAdministered',
    vaccineName: 'vaccineName',
    dosage: 'dosage',
    nextDueDate: 'nextDueDate',
    species: 'species',
    farmName: 'farmName',
  }

  return columnMap[sortBy] || 'dateAdministered'
}

/**
 * Validate vaccination update data
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 *
 * @example
 * ```ts
 * const error = validateUpdateData({ vaccineName: '' })
 * // Returns: "Vaccine name cannot be empty"
 * ```
 */
export function validateVaccinationUpdateData(
  data: UpdateVaccinationInput,
): string | null {
  if (data.vaccineName !== undefined && data.vaccineName.trim() === '') {
    return 'Vaccine name cannot be empty'
  }

  if (data.dosage !== undefined && data.dosage.trim() === '') {
    return 'Dosage cannot be empty'
  }

  if (data.dateAdministered !== undefined) {
    if (isNaN(data.dateAdministered.getTime())) {
      return 'Administration date is invalid'
    }
  }

  return null
}

/**
 * Validate treatment update data
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 *
 * @example
 * ```ts
 * const error = validateTreatmentUpdateData({ medicationName: '' })
 * // Returns: "Medication name cannot be empty"
 * ```
 */
export function validateTreatmentUpdateData(
  data: UpdateTreatmentInput,
): string | null {
  if (data.medicationName !== undefined && data.medicationName.trim() === '') {
    return 'Medication name cannot be empty'
  }

  if (data.reason !== undefined && data.reason.trim() === '') {
    return 'Reason cannot be empty'
  }

  if (data.dosage !== undefined && data.dosage.trim() === '') {
    return 'Dosage cannot be empty'
  }

  if (data.date !== undefined) {
    if (isNaN(data.date.getTime())) {
      return 'Treatment date is invalid'
    }
  }

  if (data.withdrawalDays !== undefined) {
    if (data.withdrawalDays < 0) {
      return 'Withdrawal days cannot be negative'
    }
  }

  return null
}

/**
 * Validate treatment data before creation
 *
 * @param data - Treatment creation data to validate
 * @param batchId - ID of the batch (for validation context)
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateTreatmentData({
 *   batchId: 'batch-1',
 *   medicationName: 'Antibiotic',
 *   reason: 'Infection',
 *   date: new Date(),
 *   dosage: '5ml',
 *   withdrawalDays: 7
 * }, 'batch-1')
 * // Returns: null (valid)
 * ```
 */
export function validateTreatmentData(
  data: CreateTreatmentInput,
  batchId: string,
): string | null {
  if (!data.batchId || data.batchId.trim() === '') {
    return 'Batch ID is required'
  }

  if (data.batchId !== batchId) {
    return 'Batch ID mismatch'
  }

  if (!data.medicationName || data.medicationName.trim() === '') {
    return 'Medication name is required'
  }

  if (!data.reason || data.reason.trim() === '') {
    return 'Reason is required'
  }

  if (!data.dosage || data.dosage.trim() === '') {
    return 'Dosage is required'
  }

  if (isNaN(data.date.getTime())) {
    return 'Treatment date is required'
  }

  if (data.withdrawalDays < 0) {
    return 'Withdrawal days cannot be negative'
  }

  return null
}

/**
 * Determine if treatment is within withdrawal period
 *
 * @param treatmentDate - Date treatment was administered
 * @param withdrawalDays - Withdrawal period in days
 * @returns True if still within withdrawal period
 *
 * @example
 * ```ts
 * const inWithdrawal = isInWithdrawalPeriod(
 *   new Date('2024-01-01'),
 *   7
 * )
 * // Returns: true if within 7 days of treatment
 * ```
 */
export function isInWithdrawalPeriod(
  treatmentDate: Date,
  withdrawalDays: number,
): boolean {
  if (withdrawalDays <= 0) {
    return false
  }

  if (isNaN(treatmentDate.getTime())) {
    return false
  }

  const today = new Date()
  const endDate = new Date(treatmentDate)
  endDate.setDate(endDate.getDate() + withdrawalDays)

  return today <= endDate
}

/**
 * Calculate days until withdrawal period ends
 *
 * @param treatmentDate - Date treatment was administered
 * @param withdrawalDays - Withdrawal period in days
 * @returns Number of days remaining, or 0 if period has ended
 *
 * @example
 * ```ts
 * const days = calculateWithdrawalDaysRemaining(
 *   new Date('2024-01-01'),
 *   7
 * )
 * // Returns: number of days until withdrawal ends
 * ```
 */
export function calculateWithdrawalDaysRemaining(
  treatmentDate: Date,
  withdrawalDays: number,
): number {
  if (withdrawalDays <= 0) {
    return 0
  }

  if (isNaN(treatmentDate.getTime())) {
    return 0
  }

  const today = new Date()
  const endDate = new Date(treatmentDate)
  endDate.setDate(endDate.getDate() + withdrawalDays)

  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}
