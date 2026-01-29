/**
 * Species-specific vaccination schedules
 * Based on industry-standard protocols for Nigerian poultry and fish farms
 */

export interface VaccinationScheduleItem {
  name: string
  dayOfLife: number
  route: 'drinking_water' | 'eye_drop' | 'injection' | 'spray'
  notes?: string
}

export interface VaccinationSchedule {
  species: string
  schedules: Array<VaccinationScheduleItem>
}

/**
 * Broiler vaccination schedule (0-8 weeks)
 */
export const BROILER_SCHEDULE: VaccinationSchedule = {
  species: 'Broiler',
  schedules: [
    {
      name: "Marek's Disease",
      dayOfLife: 1,
      route: 'injection',
      notes: 'At hatchery',
    },
    { name: 'Newcastle (B1/La Sota)', dayOfLife: 7, route: 'eye_drop' },
    { name: 'Gumboro (IBD)', dayOfLife: 14, route: 'drinking_water' },
    { name: 'Newcastle Booster', dayOfLife: 21, route: 'drinking_water' },
    { name: 'Gumboro Booster', dayOfLife: 28, route: 'drinking_water' },
  ],
}

/**
 * Layer vaccination schedule (0-20 weeks)
 */
export const LAYER_SCHEDULE: VaccinationSchedule = {
  species: 'Layer',
  schedules: [
    {
      name: "Marek's Disease",
      dayOfLife: 1,
      route: 'injection',
      notes: 'At hatchery',
    },
    { name: 'Newcastle (B1)', dayOfLife: 7, route: 'eye_drop' },
    { name: 'Gumboro (IBD)', dayOfLife: 14, route: 'drinking_water' },
    { name: 'Newcastle Booster', dayOfLife: 21, route: 'drinking_water' },
    { name: 'Gumboro Booster', dayOfLife: 28, route: 'drinking_water' },
    {
      name: 'Fowl Pox',
      dayOfLife: 42,
      route: 'injection',
      notes: 'Wing web',
    },
    { name: 'Newcastle (La Sota)', dayOfLife: 56, route: 'drinking_water' },
    { name: 'Fowl Typhoid', dayOfLife: 63, route: 'injection' },
    {
      name: 'Newcastle (Killed)',
      dayOfLife: 112,
      route: 'injection',
      notes: 'Before lay',
    },
    {
      name: 'Egg Drop Syndrome',
      dayOfLife: 126,
      route: 'injection',
      notes: 'Before lay',
    },
  ],
}

/**
 * Catfish treatment schedule (preventive)
 * Fish don't have traditional vaccines but have preventive treatments
 */
export const CATFISH_SCHEDULE: VaccinationSchedule = {
  species: 'Catfish',
  schedules: [
    {
      name: 'Salt Bath (Stress)',
      dayOfLife: 1,
      route: 'drinking_water',
      notes: '0.3% salt for 30 min after stocking',
    },
    {
      name: 'Formalin Bath',
      dayOfLife: 14,
      route: 'drinking_water',
      notes: 'Parasite prevention',
    },
    {
      name: 'Potassium Permanganate',
      dayOfLife: 30,
      route: 'drinking_water',
      notes: 'Bacterial prevention',
    },
  ],
}

/**
 * Get vaccination schedule for a species
 */
export function getScheduleForSpecies(
  species: string,
): VaccinationSchedule | null {
  const normalized = species.toLowerCase()
  if (normalized === 'broiler') return BROILER_SCHEDULE
  if (normalized === 'layer') return LAYER_SCHEDULE
  if (normalized === 'catfish') return CATFISH_SCHEDULE
  return null
}

/**
 * Get upcoming vaccinations for a batch based on its age
 */
export function getUpcomingVaccinations(
  species: string,
  batchAgeInDays: number,
  lookAheadDays: number = 14,
): Array<VaccinationScheduleItem & { dueInDays: number }> {
  const schedule = getScheduleForSpecies(species)
  if (!schedule) return []

  return schedule.schedules
    .filter((v) => {
      const dueInDays = v.dayOfLife - batchAgeInDays
      return dueInDays > 0 && dueInDays <= lookAheadDays
    })
    .map((v) => ({
      ...v,
      dueInDays: v.dayOfLife - batchAgeInDays,
    }))
    .sort((a, b) => a.dueInDays - b.dueInDays)
}

/**
 * Get overdue vaccinations for a batch
 */
export function getOverdueVaccinations(
  species: string,
  batchAgeInDays: number,
  completedVaccinations: Array<string>,
): Array<VaccinationScheduleItem & { daysOverdue: number }> {
  const schedule = getScheduleForSpecies(species)
  if (!schedule) return []

  return schedule.schedules
    .filter((v) => {
      const isOverdue = v.dayOfLife < batchAgeInDays
      const isCompleted = completedVaccinations.some(
        (c) => c.toLowerCase() === v.name.toLowerCase(),
      )
      return isOverdue && !isCompleted
    })
    .map((v) => ({
      ...v,
      daysOverdue: batchAgeInDays - v.dayOfLife,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}
