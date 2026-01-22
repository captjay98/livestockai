/**
 * Database operations for mortality management.
 * All functions are pure data access - no business logic.
 */

import {  sql } from 'kysely'
import type {Kysely} from 'kysely';
import type { Database } from '~/lib/db/types'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
