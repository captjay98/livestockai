// Safe ranges for water quality parameters
export const WATER_QUALITY_THRESHOLDS = {
  ph: { min: 6.5, max: 9.0 },
  temperature: { min: 25, max: 30 },
  dissolvedOxygen: { min: 5, max: Infinity },
  ammonia: { min: 0, max: 0.02 },
}
