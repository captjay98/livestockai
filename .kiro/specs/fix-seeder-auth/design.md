# Design Document: Fix Seeder Authentication

## Overview

This design addresses the authentication issues in the production and development seeders by properly implementing Better Auth's credential provider pattern. The fix involves creating both `users` and `account` table entries, removing the unused `password` column from the `users` table, and ensuring consistent password hashing across the application.

## Architecture

### Current (Broken) Architecture

```
Seeder
  ↓
Insert into users table (with password)
  ↓
❌ No account table entry
  ↓
Better Auth looks for password in account table
  ↓
❌ NOT FOUND → Authentication fails
```

### Fixed Architecture

```
Seeder
  ↓
Insert into users table (password=NULL)
  ↓
Insert into account table (password=hash, providerId='credential')
  ↓
Better Auth looks for password in account table
  ↓
✅ FOUND → Authentication succeeds
```

### Database Schema Changes

**Before:**

```sql
users table:
  - id (uuid)
  - email (varchar)
  - password (varchar) ← UNUSED by Better Auth
  - name (varchar)
  - ...

account table:
  - id (varchar)
  - userId (uuid)
  - accountId (varchar)
  - providerId (varchar)
  - password (text) ← NULL for seeded users
  - ...
```

**After:**

```sql
users table:
  - id (uuid)
  - email (varchar)
  - name (varchar)
  - ... (password column REMOVED)

account table:
  - id (varchar)
  - userId (uuid)
  - accountId (varchar) ← user's email
  - providerId (varchar) ← 'credential'
  - password (text) ← password hash
  - ...
```

## Components and Interfaces

### 1. Database Migration Update

**File:** `app/lib/db/migrations/2025-01-08-001-initial-schema.ts` (existing file)

**Purpose:** Remove the `password` column from the `users` table in the initial schema

**Changes:**

- Remove `.addColumn('password', 'varchar(255)')` line from users table creation
- No need for separate migration since we're in development
- Existing databases will need `bun run db:reset` to apply changes

**Implementation:**

- Simply delete the password column definition
- Update rollback to not include password column

### 2. User Creation Helper

**File:** `app/lib/db/seed-helpers.ts` (new file)

**Purpose:** Centralize user creation logic for seeders

**Interface:**

```typescript
interface CreateUserParams {
  email: string
  password: string
  name: string
  role?: 'admin' | 'user'
}

interface CreatedUser {
  userId: string
  email: string
  name: string
  role: string
}

async function createUserWithAuth(
  db: Kysely<Database>,
  params: CreateUserParams,
): Promise<CreatedUser>

async function hashPassword(password: string): Promise<string>
```

**Implementation:**

1. Hash password using PBKDF2 (matching Better Auth)
2. Insert into `users` table (without password)
3. Insert into `account` table (with password, providerId='credential')
4. Return created user info

### 3. Production Seeder Updates

**File:** `app/lib/db/seed.ts`

**Changes:**

- Import `createUserWithAuth` helper
- Replace direct `users` table insert with helper function
- Add comments explaining Better Auth account creation
- Keep existing logic for checking if user exists

### 4. Development Seeder Updates

**File:** `app/lib/db/seed-dev.ts`

**Changes:**

- Import `createUserWithAuth` helper
- Replace direct `users` table insert with helper function
- Add comments explaining Better Auth account creation
- Ensure `account` table is cleared during cleanup

### 5. Schema Type Updates

**File:** `app/lib/db/schema.ts`

**Changes:**

- Remove `password` field from `User` interface
- Update type exports
- Add JSDoc comments explaining password storage

## Data Models

### User Model (Updated)

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  emailVerified: boolean
  image: string | null
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  updatedAt: Date
  // password field REMOVED
}
```

### Account Model (Existing)

```typescript
interface Account {
  id: string
  userId: string
  accountId: string // user's email for credential provider
  providerId: string // 'credential' for email/password
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: Date | null
  refreshTokenExpiresAt: Date | null
  scope: string | null
  idToken: string | null
  password: string | null // password hash stored here
  createdAt: Date
  updatedAt: Date
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: User Creation Completeness

_For any_ user created by a seeder, both a `users` table entry and an `account` table entry must exist with matching `userId`.

**Validates: Requirements 1.1**

### Property 2: Account Provider Consistency

_For any_ account entry created for email/password authentication, the `providerId` must be 'credential' and `accountId` must equal the user's email.

**Validates: Requirements 1.2, 1.4**

### Property 3: Password Storage Location

_For any_ user created by a seeder, the password hash must be stored in `account.password`, not `users.password` (which should not exist).

**Validates: Requirements 1.3, 1.5, 6.1**

### Property 4: Password Hash Format

_For any_ password hash created by the seeder, it must be a base64-encoded string of exactly 64 characters (16-byte salt + 32-byte hash).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Migration Reversibility

_For any_ database state, applying the migration then rolling it back must restore the original schema (though data may be lost).

**Validates: Requirements 6.2**

### Property 6: Seeder Idempotency

_For any_ seeder execution, running it twice should not create duplicate users or fail due to constraint violations.

**Validates: Requirements 3.2, 4.2**

### Property 7: Authentication Success

_For any_ user created by a seeder with email and password, attempting to authenticate with those credentials must succeed.

**Validates: Requirements 1.1, 2.1, 3.1, 4.1**

## Error Handling

### Migration Errors

**Scenario:** Migration fails to drop `password` column
**Handling:**

- Log detailed error message
- Provide rollback instructions
- Check for dependent constraints or indexes

**Scenario:** Rollback fails to restore `password` column
**Handling:**

- Log error with schema state
- Provide manual SQL to restore column
- Document data loss implications

### Seeder Errors

**Scenario:** User already exists
**Handling:**

- Skip user creation
- Log informational message
- Continue with reference data seeding

**Scenario:** Account creation fails after user creation
**Handling:**

- Log error with user ID
- Attempt to clean up orphaned user record
- Fail seeder execution to prevent partial state

**Scenario:** Password hashing fails
**Handling:**

- Log error with context (no sensitive data)
- Fail seeder execution immediately
- Provide troubleshooting guidance

### Type Errors

**Scenario:** Code references `users.password` after migration
**Handling:**

- TypeScript compilation error
- Clear error message pointing to `account.password`
- Update code to use correct field

## Testing Strategy

### Unit Tests

**Test File:** `app/lib/db/seed-helpers.test.ts`

Tests for the user creation helper:

1. `createUserWithAuth` creates both users and account entries
2. `createUserWithAuth` sets correct providerId and accountId
3. `createUserWithAuth` stores password in account table only
4. `hashPassword` produces correct format (64-char base64)
5. `hashPassword` produces different hashes for same password (due to random salt)

### Property-Based Tests

**Test File:** `app/lib/db/seed-helpers.property.test.ts`

Property tests using fast-check:

1. **Property 1 Test:** For any valid email/password/name, `createUserWithAuth` creates matching users and account entries
2. **Property 2 Test:** For any created account, providerId='credential' and accountId=email
3. **Property 3 Test:** For any created user, users.password does not exist (after migration)
4. **Property 4 Test:** For any password string, hash format is valid base64 with correct length
5. **Property 7 Test:** For any created user, Better Auth can authenticate with the credentials

### Integration Tests

**Test File:** `app/lib/db/seed.integration.test.ts`

Integration tests for seeders:

1. Production seeder creates admin user that can authenticate
2. Development seeder creates admin user that can authenticate
3. Running seeder twice doesn't create duplicates
4. Seeder works correctly after migration

### Manual Testing

1. Run migration: `bun run db:migrate`
2. Verify `users` table has no `password` column
3. Run production seeder: `bun run db:seed`
4. Verify admin user can log in
5. Run development seeder: `bun run db:seed:dev`
6. Verify admin user can log in
7. Check database: both `users` and `account` entries exist

## Implementation Notes

### Password Hashing Algorithm

Better Auth uses PBKDF2 with these parameters:

- **Algorithm:** PBKDF2
- **Hash function:** SHA-256
- **Iterations:** 100,000
- **Salt size:** 16 bytes
- **Hash size:** 32 bytes (256 bits)
- **Encoding:** Base64

Our seeder must match these exactly.

### Account ID Format

For credential provider:

- `accountId` = user's email address
- `providerId` = 'credential'
- This allows Better Auth to look up the account by email

### Migration Timing

Since we're in development, we'll edit the existing migration:

1. Edit `2025-01-08-001-initial-schema.ts` (remove `users.password`)
2. Run `bun run db:reset` to apply changes
3. Deploy updated seeders (use `account.password`)
4. No production migration needed (we haven't shipped yet)

### Backward Compatibility

Existing users with `users.password` set:

- Will continue to work (Better Auth checks `account` table first)
- Migration doesn't modify existing data
- Only affects new users created by seeders

## Deployment Plan

### Phase 1: Migration Update

1. Edit existing migration file to remove `users.password` column
2. Run `bun run db:reset` to apply changes
3. Verify `users.password` column is not in schema

### Phase 2: Helper Function

1. Create `seed-helpers.ts` with user creation logic
2. Write unit tests for helper
3. Write property tests for helper
4. Verify tests pass

### Phase 3: Seeder Updates

1. Update production seeder to use helper
2. Update development seeder to use helper
3. Test both seeders on clean database
4. Verify authentication works

### Phase 4: Documentation

1. Update AGENTS.md with user creation pattern
2. Update README with seeder credentials
3. Add comments to seeder files
4. Update schema documentation

### Phase 5: Validation

1. Run full test suite
2. Test on fresh database
3. Test authentication flow
4. Verify no regressions

## Security Considerations

### Password Storage

- Passwords stored only in `account` table
- Hashed using PBKDF2 with 100,000 iterations
- Random salt per password
- No plaintext passwords in logs or errors

### Default Credentials

- Production seeder uses env vars (ADMIN_EMAIL, ADMIN_PASSWORD)
- Development seeder uses known defaults (documented)
- Users should change default passwords immediately
- Document security best practices in README

### Migration Safety

- Editing existing migration (development only)
- Run `bun run db:reset` to apply changes
- No production impact (haven't shipped yet)
- Test thoroughly before any production deployment

## Performance Considerations

### Seeder Performance

- User creation adds one extra INSERT (account table)
- Negligible impact (seeders run once)
- Password hashing is intentionally slow (security)

### Migration Performance

- Editing existing migration (no separate migration needed)
- Run `bun run db:reset` to recreate schema
- Fast operation (drops and recreates all tables)
- Development only (no production impact)

### Authentication Performance

- No change (Better Auth already uses `account` table)
- Same number of database queries
- No performance regression

## Future Enhancements

### Potential Improvements

1. Add support for OAuth providers in seeders
2. Create helper for bulk user creation
3. Add seeder for test users with various roles
4. Implement user factory for testing

### Not in Scope

- Migrating existing users (they already work)
- Changing Better Auth configuration
- Adding new authentication methods
- Modifying Better Auth internals
