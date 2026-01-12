/**
 * Date Formatter for Internationalization Settings
 *
 * Formats dates and times according to user-configured regional settings.
 * Supports multiple date formats and 12/24-hour time formats.
 */

import { format as dateFnsFormat } from 'date-fns'
import type { UserSettings } from './currency-presets'

/**
 * Map user-friendly date format strings to date-fns format patterns
 */
const DATE_FORMAT_MAP: Record<UserSettings['dateFormat'], string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
}

/**
 * Format a date according to user settings
 *
 * @param date - The date to format (Date object or ISO string)
 * @param settings - User settings containing date format configuration
 * @returns Formatted date string (e.g., "01/15/2025" or "15/01/2025")
 */
export function formatDate(
  date: Date | string,
  settings: Pick<UserSettings, 'dateFormat'>,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFnsFormat(d, DATE_FORMAT_MAP[settings.dateFormat])
}

/**
 * Format a time according to user settings
 *
 * @param date - The date/time to format (Date object or ISO string)
 * @param settings - User settings containing time format configuration
 * @returns Formatted time string (e.g., "2:30 PM" or "14:30")
 */
export function formatTime(
  date: Date | string,
  settings: Pick<UserSettings, 'timeFormat'>,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFnsFormat(d, settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm')
}

/**
 * Format a date and time according to user settings
 *
 * @param date - The date/time to format (Date object or ISO string)
 * @param settings - User settings containing date and time format configuration
 * @returns Formatted date and time string (e.g., "01/15/2025 2:30 PM")
 */
export function formatDateTime(
  date: Date | string,
  settings: Pick<UserSettings, 'dateFormat' | 'timeFormat'>,
): string {
  return `${formatDate(date, settings)} ${formatTime(date, settings)}`
}

/**
 * Format a date in a short format (month and day only)
 *
 * @param date - The date to format
 * @param settings - User settings containing date format configuration
 * @returns Short formatted date (e.g., "Jan 15" or "15 Jan")
 */
export function formatShortDate(
  date: Date | string,
  settings: Pick<UserSettings, 'dateFormat'>,
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // Use day-first or month-first based on user preference
  if (settings.dateFormat === 'DD/MM/YYYY') {
    return dateFnsFormat(d, 'd MMM')
  }
  return dateFnsFormat(d, 'MMM d')
}

/**
 * Format a date in a long format with full month name
 *
 * @param date - The date to format
 * @param settings - User settings containing date format configuration
 * @returns Long formatted date (e.g., "January 15, 2025" or "15 January 2025")
 */
export function formatLongDate(
  date: Date | string,
  settings: Pick<UserSettings, 'dateFormat'>,
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (settings.dateFormat === 'DD/MM/YYYY') {
    return dateFnsFormat(d, 'd MMMM yyyy')
  } else if (settings.dateFormat === 'YYYY-MM-DD') {
    return dateFnsFormat(d, 'yyyy MMMM d')
  }
  return dateFnsFormat(d, 'MMMM d, yyyy')
}

/**
 * Format a relative date (e.g., "Today", "Yesterday", "3 days ago")
 *
 * @param date - The date to format
 * @param settings - User settings containing date format configuration
 * @returns Relative date string or formatted date if too far in the past
 */
export function formatRelativeDate(
  date: Date | string,
  settings: Pick<UserSettings, 'dateFormat'>,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(d, settings)
  }
}

/**
 * Get the date-fns format pattern for the user's date format
 * Useful for date picker components
 */
export function getDateFormatPattern(
  settings: Pick<UserSettings, 'dateFormat'>,
): string {
  return DATE_FORMAT_MAP[settings.dateFormat]
}
