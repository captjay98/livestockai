import { common, tasks } from './common'
import { auth } from './auth'
import { batches } from './batches'
import { farms } from './farms'
import { dashboard } from './dashboard'
import { reports, settings } from './settings'
import { eggs, feed, inventory } from './feed'
import {
  customers,
  expenses,
  financial,
  invoices,
  sales,
  suppliers,
} from './financial'
import { health, mortality, vaccinations, waterQuality, weight } from './health'
import { errors } from './errors'
import { marketplace } from './marketplace'
import { notifications } from './notifications'
import { pwa } from './pwa'
import { sensors } from './sensors'
import { digitalForeman } from './digitalForeman'
import { extension } from './extension'
import { creditPassport } from './creditPassport'
import { workers } from './workers'
import { feedFormulation } from './feedFormulation'
import { breeds } from './breeds'

export const hi = {
  common,
  tasks,
  auth,
  batches,
  farms,
  dashboard,
  settings,
  reports,
  onboarding: {}, // Missing in en modular files
  feed,
  eggs,
  inventory,
  financial,
  expenses,
  invoices,
  sales,
  customers,
  suppliers,
  health,
  mortality,
  vaccinations,
  weight,
  'water-quality': waterQuality,
  errors,
  validation: {}, // Missing in en modular files
  marketplace,
  notifications,
  pwa,
  sensors,
  digitalForeman,
  extension,
  creditPassport,
  workers,
  feedFormulation,
  breeds,
  'credit-passport': creditPassport, // Alias for kebab-case
}
