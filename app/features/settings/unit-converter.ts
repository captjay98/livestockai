/**
 * Unit Converter for Internationalization Settings
 *
 * Converts and formats measurements according to user-configured unit preferences.
 * All values are stored in metric (kg, sqm, Celsius) and converted for display.
 */

import type { UserSettings } from './currency-presets'

/**
 * Conversion factors for weight units
 * Base unit: kilograms (kg)
 */
const WEIGHT_FACTORS = {
  kg: 1,
  lbs: 2.20462,
} as const

/**
 * Conversion factors for area units
 * Base unit: square meters (sqm)
 */
const AREA_FACTORS = {
  sqm: 1,
  sqft: 10.7639,
} as const

/**
 * Temperature conversion functions
 * Base unit: Celsius
 */
const TEMPERATURE = {
  toFahrenheit: (celsius: number): number => (celsius * 9) / 5 + 32,
  toCelsius: (fahrenheit: number): number => ((fahrenheit - 32) * 5) / 9,
}

// ============ DISPLAY FORMATTING ============

/**
 * Format a weight value for display according to user settings
 *
 * @param valueKg - Weight in kilograms (storage unit)
 * @param settings - User settings containing weight unit preference
 * @returns Formatted weight string with unit (e.g., "2.50 kg" or "5.51 lbs")
 */
export function formatWeight(
  valueKg: number,
  settings: Pick<UserSettings, 'weightUnit'>,
): string {
  const converted = valueKg * WEIGHT_FACTORS[settings.weightUnit]
  return `${converted.toFixed(2)} ${settings.weightUnit}`
}

/**
 * Format a weight value without the unit suffix
 *
 * @param valueKg - Weight in kilograms (storage unit)
 * @param settings - User settings containing weight unit preference
 * @returns Formatted weight number string (e.g., "2.50" or "5.51")
 */
export function formatWeightValue(
  valueKg: number,
  settings: Pick<UserSettings, 'weightUnit'>,
): string {
  const converted = valueKg * WEIGHT_FACTORS[settings.weightUnit]
  return converted.toFixed(2)
}

/**
 * Format an area value for display according to user settings
 *
 * @param valueSqm - Area in square meters (storage unit)
 * @param settings - User settings containing area unit preference
 * @returns Formatted area string with unit (e.g., "100.00 m²" or "1076.39 ft²")
 */
export function formatArea(
  valueSqm: number,
  settings: Pick<UserSettings, 'areaUnit'>,
): string {
  const converted = valueSqm * AREA_FACTORS[settings.areaUnit]
  const unitLabel = settings.areaUnit === 'sqm' ? 'm²' : 'ft²'
  return `${converted.toFixed(2)} ${unitLabel}`
}

/**
 * Format an area value without the unit suffix
 *
 * @param valueSqm - Area in square meters (storage unit)
 * @param settings - User settings containing area unit preference
 * @returns Formatted area number string (e.g., "100.00" or "1076.39")
 */
export function formatAreaValue(
  valueSqm: number,
  settings: Pick<UserSettings, 'areaUnit'>,
): string {
  const converted = valueSqm * AREA_FACTORS[settings.areaUnit]
  return converted.toFixed(2)
}

/**
 * Format a temperature value for display according to user settings
 *
 * @param valueCelsius - Temperature in Celsius (storage unit)
 * @param settings - User settings containing temperature unit preference
 * @returns Formatted temperature string with unit (e.g., "25.0°C" or "77.0°F")
 */
export function formatTemperature(
  valueCelsius: number,
  settings: Pick<UserSettings, 'temperatureUnit'>,
): string {
  if (settings.temperatureUnit === 'fahrenheit') {
    const fahrenheit = TEMPERATURE.toFahrenheit(valueCelsius)
    return `${fahrenheit.toFixed(1)}°F`
  }
  return `${valueCelsius.toFixed(1)}°C`
}

/**
 * Format a temperature value without the unit suffix
 *
 * @param valueCelsius - Temperature in Celsius (storage unit)
 * @param settings - User settings containing temperature unit preference
 * @returns Formatted temperature number string (e.g., "25.0" or "77.0")
 */
export function formatTemperatureValue(
  valueCelsius: number,
  settings: Pick<UserSettings, 'temperatureUnit'>,
): string {
  if (settings.temperatureUnit === 'fahrenheit') {
    const fahrenheit = TEMPERATURE.toFahrenheit(valueCelsius)
    return fahrenheit.toFixed(1)
  }
  return valueCelsius.toFixed(1)
}

// ============ CONVERSION TO METRIC (FOR STORAGE) ============

/**
 * Convert a weight value from display unit to metric (kg) for storage
 *
 * @param value - Weight in display unit
 * @param unit - The unit of the input value
 * @returns Weight in kilograms
 */
export function toMetricWeight(value: number, unit: 'kg' | 'lbs'): number {
  return value / WEIGHT_FACTORS[unit]
}

/**
 * Convert an area value from display unit to metric (sqm) for storage
 *
 * @param value - Area in display unit
 * @param unit - The unit of the input value
 * @returns Area in square meters
 */
export function toMetricArea(value: number, unit: 'sqm' | 'sqft'): number {
  return value / AREA_FACTORS[unit]
}

/**
 * Convert a temperature value from display unit to Celsius for storage
 *
 * @param value - Temperature in display unit
 * @param unit - The unit of the input value
 * @returns Temperature in Celsius
 */
export function toCelsius(
  value: number,
  unit: 'celsius' | 'fahrenheit',
): number {
  return unit === 'fahrenheit' ? TEMPERATURE.toCelsius(value) : value
}

// ============ CONVERSION FROM METRIC (FOR DISPLAY) ============

/**
 * Convert a weight value from metric (kg) to display unit
 *
 * @param valueKg - Weight in kilograms
 * @param unit - The target display unit
 * @returns Weight in display unit
 */
export function fromMetricWeight(valueKg: number, unit: 'kg' | 'lbs'): number {
  return valueKg * WEIGHT_FACTORS[unit]
}

/**
 * Convert an area value from metric (sqm) to display unit
 *
 * @param valueSqm - Area in square meters
 * @param unit - The target display unit
 * @returns Area in display unit
 */
export function fromMetricArea(valueSqm: number, unit: 'sqm' | 'sqft'): number {
  return valueSqm * AREA_FACTORS[unit]
}

/**
 * Convert a temperature value from Celsius to display unit
 *
 * @param valueCelsius - Temperature in Celsius
 * @param unit - The target display unit
 * @returns Temperature in display unit
 */
export function fromCelsius(
  valueCelsius: number,
  unit: 'celsius' | 'fahrenheit',
): number {
  return unit === 'fahrenheit'
    ? TEMPERATURE.toFahrenheit(valueCelsius)
    : valueCelsius
}

// ============ UNIT LABELS ============

/**
 * Get the display label for a weight unit
 */
export function getWeightLabel(unit: 'kg' | 'lbs'): string {
  return unit
}

/**
 * Get the display label for an area unit
 */
export function getAreaLabel(unit: 'sqm' | 'sqft'): string {
  return unit === 'sqm' ? 'm²' : 'ft²'
}

/**
 * Get the display label for a temperature unit
 */
export function getTemperatureLabel(unit: 'celsius' | 'fahrenheit'): string {
  return unit === 'celsius' ? '°C' : '°F'
}
