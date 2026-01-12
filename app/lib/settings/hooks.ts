/**
 * Formatting Hooks
 *
 * React hooks that provide formatting functions bound to user settings.
 * These hooks read from the SettingsContext and return memoized formatters.
 */

import { useCallback } from 'react'
import { useSettingsValue } from './context'
import {
  formatCompactCurrency,
  formatCurrency,
  parseCurrency,
} from './currency-formatter'
import {
  formatDate,
  formatDateTime,
  formatLongDate,
  formatRelativeDate,
  formatShortDate,
  formatTime,
} from './date-formatter'
import {
  formatArea,
  formatAreaValue,
  formatTemperature,
  formatTemperatureValue,
  formatWeight,
  formatWeightValue,
  getAreaLabel,
  getTemperatureLabel,
  getWeightLabel,
  toCelsius,
  toMetricArea,
  toMetricWeight,
} from './unit-converter'
import type { MoneyInput } from '../currency'

/**
 * Hook for currency formatting
 *
 * Returns functions to format and parse currency values
 * according to user settings.
 */
export function useFormatCurrency() {
  const settings = useSettingsValue()

  const format = useCallback(
    (amount: MoneyInput) => formatCurrency(amount, settings),
    [settings],
  )

  const formatCompact = useCallback(
    (amount: MoneyInput) => formatCompactCurrency(amount, settings),
    [settings],
  )

  const parse = useCallback(
    (formatted: string) => parseCurrency(formatted, settings),
    [settings],
  )

  return {
    format,
    formatCompact,
    parse,
    symbol: settings.currencySymbol,
    code: settings.currencyCode,
  }
}

/**
 * Hook for date formatting
 *
 * Returns functions to format dates according to user settings.
 */
export function useFormatDate() {
  const settings = useSettingsValue()

  const format = useCallback(
    (date: Date | string) => formatDate(date, settings),
    [settings],
  )

  const formatShort = useCallback(
    (date: Date | string) => formatShortDate(date, settings),
    [settings],
  )

  const formatLong = useCallback(
    (date: Date | string) => formatLongDate(date, settings),
    [settings],
  )

  const formatRelative = useCallback(
    (date: Date | string) => formatRelativeDate(date, settings),
    [settings],
  )

  return {
    format,
    formatShort,
    formatLong,
    formatRelative,
    pattern: settings.dateFormat,
  }
}

/**
 * Hook for time formatting
 *
 * Returns functions to format times according to user settings.
 */
export function useFormatTime() {
  const settings = useSettingsValue()

  const format = useCallback(
    (date: Date | string) => formatTime(date, settings),
    [settings],
  )

  const formatWithDate = useCallback(
    (date: Date | string) => formatDateTime(date, settings),
    [settings],
  )

  return {
    format,
    formatWithDate,
    is24Hour: settings.timeFormat === '24h',
  }
}

/**
 * Hook for weight formatting and conversion
 *
 * Returns functions to format weights and convert between units.
 */
export function useFormatWeight() {
  const settings = useSettingsValue()

  const format = useCallback(
    (valueKg: number) => formatWeight(valueKg, settings),
    [settings],
  )

  const formatValue = useCallback(
    (valueKg: number) => formatWeightValue(valueKg, settings),
    [settings],
  )

  const toMetric = useCallback(
    (value: number) => toMetricWeight(value, settings.weightUnit),
    [settings.weightUnit],
  )

  return {
    format,
    formatValue,
    toMetric,
    unit: settings.weightUnit,
    label: getWeightLabel(settings.weightUnit),
  }
}

/**
 * Hook for area formatting and conversion
 *
 * Returns functions to format areas and convert between units.
 */
export function useFormatArea() {
  const settings = useSettingsValue()

  const format = useCallback(
    (valueSqm: number) => formatArea(valueSqm, settings),
    [settings],
  )

  const formatValue = useCallback(
    (valueSqm: number) => formatAreaValue(valueSqm, settings),
    [settings],
  )

  const toMetric = useCallback(
    (value: number) => toMetricArea(value, settings.areaUnit),
    [settings.areaUnit],
  )

  return {
    format,
    formatValue,
    toMetric,
    unit: settings.areaUnit,
    label: getAreaLabel(settings.areaUnit),
  }
}

/**
 * Hook for temperature formatting and conversion
 *
 * Returns functions to format temperatures and convert between units.
 */
export function useFormatTemperature() {
  const settings = useSettingsValue()

  const format = useCallback(
    (valueCelsius: number) => formatTemperature(valueCelsius, settings),
    [settings],
  )

  const formatValue = useCallback(
    (valueCelsius: number) => formatTemperatureValue(valueCelsius, settings),
    [settings],
  )

  const toMetric = useCallback(
    (value: number) => toCelsius(value, settings.temperatureUnit),
    [settings.temperatureUnit],
  )

  return {
    format,
    formatValue,
    toMetric,
    unit: settings.temperatureUnit,
    label: getTemperatureLabel(settings.temperatureUnit),
  }
}
