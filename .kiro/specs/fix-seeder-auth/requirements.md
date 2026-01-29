# Requirements Document: Fix Seeder Authentication

## Introduction

The production and development seeders currently create admin users incorrectly, storing passwords in the `users` table instead of the `account` table where Better Auth expects them. This causes authentication failures for seeded users. This spec fixes the seeders to properly create users compatible with Better Auth's credential provider.

## Glossary

- **Better Auth**: The authentication library used by LivestockAI
- **Credential Provider**: Better Auth's email/password authentication method
- **Account Table**: Better Auth table that stores provider-specific authentication data
- **Users Table**: Application table that stores user profile information
- **Seeder**: Script that populates the database with initial or demo data

## Requirements

### Requirement 1: Proper User Creation in Seeders

**User Story:** As a developer, I want seeders to create users that can authenticate successfully, so that the application works correctly after seeding.

#### Acceptance Criteria

1. WHEN a seeder creates an admin user, THE System SHALL create both a `users` table entry and an `account` table entry
2. WHEN creating the `account` entry, THE System SHALL set `providerId` to 'credential' for email/password authentication
3. WHEN creating the `account` entry, THE System SHALL store the password hash in the `account.password` column
4. WHEN creating the `account` entry, THE System SHALL set `accountId` to the user's email address
5. THE `users.password` column SHALL be set to NULL (Better Auth stores passwords in the `account` table per official documentation)

### Requirement 2: Consistent Password Hashing

**User Story:** As a developer, I want password hashing to be consistent between seeders and Better Auth, so that authentication works correctly.

#### Acceptance Criteria

1. THE Seeder SHALL use the same password hashing algorithm as Better Auth (PBKDF2 with 100,000 iterations)
2. THE Seeder SHALL use the same salt size (16 bytes) as Better Auth
3. THE Seeder SHALL use the same hash size (32 bytes) as Better Auth
4. THE Seeder SHALL encode the combined salt+hash using base64, matching Better Auth's format

### Requirement 3: Production Seeder Compliance

**User Story:** As a system administrator, I want the production seeder to create a working admin account, so that I can log in after initial deployment.

#### Acceptance Criteria

1. WHEN running `bun run db:seed`, THE System SHALL create an admin user with both `users` and `account` entries
2. WHEN the admin user already exists, THE System SHALL skip user creation and only update reference data
3. THE Production seeder SHALL use environment variables for admin credentials (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
4. THE Production seeder SHALL default to 'admin@livestockai.local' / 'password123' if env vars are not set

### Requirement 4: Development Seeder Compliance

**User Story:** As a developer, I want the development seeder to create a working admin account with demo data, so that I can test the application.

#### Acceptance Criteria

1. WHEN running `bun run db:seed:dev`, THE System SHALL create an admin user with both `users` and `account` entries
2. THE Development seeder SHALL use the same user creation logic as the production seeder
3. THE Development seeder SHALL create demo farms, batches, and transactions after creating the admin user
4. THE Development seeder SHALL clear existing data before seeding, including both `users` and `account` tables

### Requirement 5: Backward Compatibility

**User Story:** As a developer, I want existing users to continue working after the fix, so that we don't break production systems.

#### Acceptance Criteria

1. WHEN a user exists in the `users` table with a password but no `account` entry, THE System SHALL still allow authentication (handled by Better Auth)
2. THE Migration SHALL NOT modify existing user data
3. THE Fix SHALL only affect new users created by seeders
4. THE System SHALL log clear messages about what data is being created

### Requirement 6: Remove Password Column from Users Table

**User Story:** As a developer, I want the `users` table to not have a `password` column, so that there's no confusion about where passwords are stored.

#### Acceptance Criteria

1. THE System SHALL create a database migration to drop the `password` column from the `users` table
2. THE Migration SHALL be safe and reversible
3. THE Schema types SHALL be updated to reflect that `users` table has no `password` column
4. THE Migration SHALL run before the seeder fixes are applied
5. THE Documentation SHALL explain that passwords are stored in the `account` table only

### Requirement 7: Documentation Updates

**User Story:** As a developer, I want clear documentation on how users are created, so that I understand the authentication flow.

#### Acceptance Criteria

1. THE AGENTS.md file SHALL document the correct way to create users programmatically
2. THE Seeder files SHALL include comments explaining the Better Auth account creation
3. THE README SHALL document the default admin credentials for both seeders
4. THE Documentation SHALL explain that passwords are stored in the `account` table, not `users` table
