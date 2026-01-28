# Implementation Plan: Fix Seeder Authentication

## Overview

This plan implements the fix for seeder authentication by removing the `password` column from the `users` table, creating a shared helper for user creation, and updating both seeders to properly create Better Auth-compatible users.

## Tasks

- [x]   1. Update database migration to remove users.password column
    - Edit `app/lib/db/migrations/2025-01-08-001-initial-schema.ts`
    - Remove `.addColumn('password', 'varchar(255)')` line from users table creation
    - Run `bun run db:reset` to apply changes
    - Verify users table has no password column
    - _Requirements: 6.1, 6.3_

- [x]   2. Update TypeScript schema types
    - Edit `app/lib/db/schema.ts`
    - Remove `password` field from `User` interface
    - Add JSDoc comment explaining passwords are in account table
    - Verify TypeScript compilation succeeds
    - _Requirements: 6.3, 7.4_

- [x]   3. Create shared user creation helper
    - [x] 3.1 Create `app/lib/db/seed-helpers.ts`
        - Implement `hashPassword()` function (PBKDF2, 100k iterations, base64)
        - Implement `createUserWithAuth()` function
        - Add JSDoc comments explaining Better Auth integration
        - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

    - [x] 3.2 Write unit tests for helper functions
        - Test `hashPassword()` produces 64-char base64 string
        - Test `hashPassword()` produces different hashes for same password
        - Test `createUserWithAuth()` creates both users and account entries
        - Test `createUserWithAuth()` sets correct providerId and accountId
        - Test `createUserWithAuth()` stores password in account table only
        - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

    - [x] 3.3 Write property test for user creation completeness
        - **Property 1: User Creation Completeness**
        - **Validates: Requirements 1.1**
        - For any valid email/password/name, verify both users and account entries exist
        - _Requirements: 1.1_

    - [x] 3.4 Write property test for account provider consistency
        - **Property 2: Account Provider Consistency**
        - **Validates: Requirements 1.2, 1.4**
        - For any created account, verify providerId='credential' and accountId=email
        - _Requirements: 1.2, 1.4_

    - [x] 3.5 Write property test for password storage location
        - **Property 3: Password Storage Location**
        - **Validates: Requirements 1.3, 1.5, 6.1**
        - For any created user, verify password is in account table, not users table
        - _Requirements: 1.3, 1.5, 6.1_

    - [x] 3.6 Write property test for password hash format
        - **Property 4: Password Hash Format**
        - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
        - For any password, verify hash is base64 with correct length (64 chars)
        - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x]   4. Update production seeder
    - [x] 4.1 Update `app/lib/db/seed.ts`
        - Import `createUserWithAuth` from seed-helpers
        - Replace direct users table insert with helper function
        - Remove password from users table insert
        - Add comments explaining Better Auth account creation
        - Keep existing logic for checking if user exists
        - _Requirements: 3.1, 3.2, 3.3, 3.4_

    - [x] 4.2 Write property test for seeder idempotency
        - **Property 6: Seeder Idempotency**
        - **Validates: Requirements 3.2**
        - For any seeder execution, running twice should not create duplicates
        - _Requirements: 3.2_

    - [x] 4.3 Write property test for authentication success
        - **Property 7: Authentication Success**
        - **Validates: Requirements 1.1, 2.1, 3.1**
        - For any user created by seeder, authentication with credentials must succeed
        - _Requirements: 1.1, 2.1, 3.1_

- [x]   5. Update development seeder
    - [x] 5.1 Update `app/lib/db/seed-dev.ts`
        - Import `createUserWithAuth` from seed-helpers
        - Replace direct users table insert with helper function
        - Remove password from users table insert
        - Add comments explaining Better Auth account creation
        - Ensure account table is cleared during cleanup
        - _Requirements: 4.1, 4.2, 4.3, 4.4_

    - [x] 5.2 Write property test for dev seeder authentication
        - **Property 7: Authentication Success (Dev Seeder)**
        - **Validates: Requirements 4.1**
        - For any user created by dev seeder, authentication must succeed
        - _Requirements: 4.1_

- [x]   6. Checkpoint - Test seeders and authentication
    - ✅ Run `bun run db:reset` to recreate database
    - ✅ Run `bun run db:seed` and verify admin can log in
    - ✅ Run `bun run db:reset` again
    - ✅ Run `bun run db:seed:dev` and verify admin can log in
    - ✅ Verify both users and account entries exist in database
    - ✅ Dev server running on http://localhost:3002/

- [x]   7. Update documentation
    - [x] 7.1 Update AGENTS.md
        - Document correct way to create users programmatically
        - Explain users vs account table relationship
        - Add code example using createUserWithAuth helper
        - _Requirements: 7.1, 7.4_

    - [x] 7.2 Update README.md
        - Document default admin credentials for production seeder
        - Document default admin credentials for development seeder
        - Add security note about changing default passwords
        - _Requirements: 7.3_

    - [x] 7.3 Add comments to seeder files
        - Explain Better Auth account creation in seed.ts
        - Explain Better Auth account creation in seed-dev.ts
        - Reference Better Auth documentation
        - _Requirements: 7.2_

- [x]   8. Final validation
    - Run full test suite: `bun run test`
    - Test on fresh database: `bun run db:reset && bun run db:seed`
    - Test authentication flow: log in as admin
    - Verify no TypeScript errors: `bun run check`
    - Verify no regressions in existing functionality

## Notes

- All tasks are required for comprehensive testing and documentation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All tasks must be completed before considering the fix production-ready
