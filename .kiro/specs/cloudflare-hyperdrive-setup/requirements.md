# Requirements Document

## Introduction

This specification covers the setup of Cloudflare Hyperdrive to enable full transaction support in the OpenLivestock codebase. The current implementation uses `@neondatabase/serverless` with `NeonDialect` (HTTP driver), which does not support interactive transactions. The codebase has 11 places using `db.transaction()` that will fail at runtime. Cloudflare Hyperdrive with the standard `pg` driver provides full transaction support, connection pooling at the edge, and improved performance.

## Glossary

- **Hyperdrive**: Cloudflare's global database connection pooling service that accelerates queries to PostgreSQL databases
- **NeonDialect**: Kysely dialect using Neon's HTTP driver (stateless, no transaction support)
- **PostgresDialect**: Kysely dialect using the standard `pg` driver (supports transactions)
- **Interactive_Transaction**: A database transaction where queries can be executed, results read, and decisions made within the same transaction context
- **Connection_Pooling**: Reusing database connections to reduce connection overhead
- **Database_Module**: The `app/lib/db/index.ts` file that provides database access throughout the application

## Requirements

### Requirement 1: Hyperdrive Configuration

**User Story:** As a developer, I want Hyperdrive configured in the Cloudflare Workers environment, so that the application can use connection pooling and transaction support in production.

#### Acceptance Criteria

1. WHEN the application is deployed to Cloudflare Workers, THE Wrangler_Config SHALL include a Hyperdrive binding named `HYPERDRIVE`
2. WHEN the Hyperdrive binding is configured, THE Wrangler_Config SHALL reference a valid Hyperdrive configuration ID
3. WHEN running locally with `wrangler dev`, THE Wrangler_Config SHALL provide a `localConnectionString` for direct database access
4. THE Wrangler_Config SHALL include the `nodejs_compat` compatibility flag to support the `pg` driver

### Requirement 2: Database Connection Module Update

**User Story:** As a developer, I want the database module to use Hyperdrive in production and direct connections in development, so that transactions work in all environments.

#### Acceptance Criteria

1. WHEN running in Cloudflare Workers production, THE Database_Module SHALL use `PostgresDialect` with the Hyperdrive connection string
2. WHEN running in local development (Node.js/Bun), THE Database_Module SHALL use `PostgresDialect` with the direct `DATABASE_URL`
3. WHEN running in Cloudflare Workers local preview (`wrangler dev`), THE Database_Module SHALL use the Hyperdrive `localConnectionString`
4. THE Database_Module SHALL preserve the existing `getDb()` async function pattern for server functions
5. THE Database_Module SHALL preserve the existing synchronous `db` export for CLI scripts and migrations
6. WHEN a database connection is requested, THE Database_Module SHALL create a new connection pool per request in Cloudflare Workers (required by Workers runtime)

### Requirement 3: Transaction Support Verification

**User Story:** As a developer, I want all existing transaction code to work without modification, so that I don't need to refactor the 11 places using `db.transaction()`.

#### Acceptance Criteria

1. WHEN using `db.transaction().execute()`, THE Database_Module SHALL support interactive transactions with the new dialect
2. THE existing server functions using transactions SHALL continue to work without code changes
3. WHEN a transaction fails, THE Database_Module SHALL properly rollback all changes within the transaction

### Requirement 4: Environment Variable Management

**User Story:** As a developer, I want clear environment variable configuration for both local development and production, so that database connections work correctly in all environments.

#### Acceptance Criteria

1. WHEN running locally, THE Application SHALL read `DATABASE_URL` from `.dev.vars` or environment
2. WHEN deploying to production, THE Application SHALL use Cloudflare secrets for sensitive values
3. THE `.dev.vars` file SHALL document the required environment variables with examples
4. IF the `DATABASE_URL` is not configured, THEN THE Database_Module SHALL throw a descriptive error message

### Requirement 5: Backward Compatibility

**User Story:** As a developer, I want the migration to Hyperdrive to be transparent to existing code, so that no refactoring is required in server functions or repositories.

#### Acceptance Criteria

1. THE existing `getDb()` function signature SHALL remain unchanged
2. THE existing synchronous `db` export SHALL continue to work for CLI scripts
3. THE existing Kysely query patterns SHALL work identically with the new dialect
4. WHEN running tests, THE Test_Database SHALL continue to use the `DATABASE_URL_TEST` environment variable

### Requirement 6: Documentation

**User Story:** As a developer, I want clear documentation on the Hyperdrive setup, so that I can understand and maintain the configuration.

#### Acceptance Criteria

1. THE Implementation SHALL include inline code comments explaining the Hyperdrive integration
2. THE Implementation SHALL update the steering documentation with Hyperdrive setup instructions
3. THE Documentation SHALL include steps for creating a Hyperdrive configuration in Cloudflare dashboard
