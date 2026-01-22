/**
 * Database operations for notifications.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { CreateNotificationData, Notification } from './types'
