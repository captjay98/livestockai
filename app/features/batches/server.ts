/**
 * Batches Server Functions - Barrel Export
 *
 * This file re-exports all server functions from the server/ subdirectory
 * for backward compatibility. The actual implementations are split into:
 *
 * - server/crud.ts      - Create, update, delete operations
 * - server/queries.ts   - GET operations and paginated queries
 * - server/stats.ts     - Statistics and summary functions
 * - server/types.ts     - Type definitions and constants
 * - server/validation.ts - Zod validation schemas
 */

// Re-export everything from the server subdirectory
export * from './server/index'
