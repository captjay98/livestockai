# Requirements Document: Fix Health Records Fetch Error

## Introduction

The LivestockAI application is experiencing a runtime error when fetching health records (vaccinations and treatments). The error "Failed to fetch health records" is occurring during server function response deserialization, causing the React component tree to crash and trigger error boundaries. This spec addresses the root cause diagnosis, error handling improvements, and prevention of similar issues.

## Glossary

- **Health_Records**: Combined view of vaccination and treatment records for livestock batches
- **Server_Function**: TanStack Start server function that executes on the server and returns serialized data
- **Deserialization_Error**: Error occurring when server response cannot be properly converted to client-side objects
- **Error_Boundary**: React component that catches JavaScript errors in child component tree
- **Loader**: TanStack Router data fetching mechanism that runs before route rendering
- **Repository_Layer**: Database access layer using Kysely ORM
- **Service_Layer**: Business logic layer with pure functions
- **AppError**: Custom error class for structured error handling

## Requirements

### Requirement 1: Diagnose Root Cause

**User Story:** As a developer, I want to identify the exact cause of the health records fetch failure, so that I can implement a targeted fix.

#### Acceptance Criteria

1. WHEN investigating the error, THE System SHALL identify whether the issue is in database queries, data serialization, or error handling
2. WHEN examining the `getHealthRecordsPaginated` function, THE System SHALL verify that all database operations handle edge cases correctly
3. WHEN checking data types, THE System SHALL ensure all returned values are serializable (no undefined, functions, or circular references)
4. WHEN reviewing the union query, THE System SHALL confirm that NULL handling for type-specific fields is correct
5. WHEN analyzing the error path, THE System SHALL trace the exact location where deserialization fails

### Requirement 2: Fix Data Serialization Issues

**User Story:** As a developer, I want all server function responses to be properly serializable, so that data can be safely transmitted to the client.

#### Acceptance Criteria

1. WHEN a server function returns data, THE System SHALL ensure all Date objects are converted to ISO strings or remain as Date objects (TanStack Start handles Date serialization)
2. WHEN union queries combine vaccinations and treatments, THE System SHALL ensure NULL values for type-specific fields are explicitly handled
3. WHEN database queries return results, THE System SHALL validate that no undefined values exist in the response
4. WHEN constructing response objects, THE System SHALL use consistent data types across all records
5. WHEN handling empty result sets, THE System SHALL return valid empty arrays rather than null or undefined

### Requirement 3: Improve Error Handling

**User Story:** As a user, I want meaningful error messages when data fetching fails, so that I understand what went wrong and can take appropriate action.

#### Acceptance Criteria

1. WHEN a database error occurs, THE System SHALL log the full error details including stack trace and query context
2. WHEN an error is caught in the server function, THE System SHALL preserve the original error cause for debugging
3. WHEN returning errors to the client, THE System SHALL provide user-friendly messages without exposing sensitive database details
4. WHEN deserialization fails, THE System SHALL identify which field or record caused the failure
5. WHEN multiple operations fail, THE System SHALL aggregate errors rather than failing on the first error

### Requirement 4: Add Validation and Type Safety

**User Story:** As a developer, I want runtime validation of server function responses, so that type mismatches are caught before deserialization.

#### Acceptance Criteria

1. WHEN server functions return data, THE System SHALL validate the response structure matches expected types
2. WHEN database queries return records, THE System SHALL ensure all required fields are present
3. WHEN optional fields are null, THE System SHALL explicitly set them to null rather than undefined
4. WHEN pagination metadata is returned, THE System SHALL validate that page, pageSize, total, and totalPages are valid numbers
5. WHEN union queries combine different record types, THE System SHALL ensure discriminator fields are correctly set

### Requirement 5: Prevent Component Tree Crashes

**User Story:** As a user, I want the application to gracefully handle errors without crashing the entire page, so that I can continue using other features.

#### Acceptance Criteria

1. WHEN a loader fails, THE System SHALL display an error component without unmounting the entire route
2. WHEN error boundaries catch errors, THE System SHALL provide a reset mechanism to retry the operation
3. WHEN data fetching fails, THE System SHALL preserve user input and navigation state
4. WHEN displaying error messages, THE System SHALL show actionable recovery options (retry, go back, contact support)
5. WHEN errors occur repeatedly, THE System SHALL prevent infinite retry loops

### Requirement 6: Add Comprehensive Logging

**User Story:** As a developer, I want detailed logs of data fetching operations, so that I can diagnose issues in production.

#### Acceptance Criteria

1. WHEN server functions execute, THE System SHALL log the input parameters (excluding sensitive data)
2. WHEN database queries run, THE System SHALL log query execution time and row counts
3. WHEN errors occur, THE System SHALL log the full error context including user ID, farm ID, and request parameters
4. WHEN data is serialized, THE System SHALL log any type coercion or transformation applied
5. WHEN responses are returned, THE System SHALL log response size and structure summary

### Requirement 7: Add Integration Tests

**User Story:** As a developer, I want automated tests for health records fetching, so that regressions are caught before deployment.

#### Acceptance Criteria

1. WHEN testing the repository layer, THE System SHALL verify that union queries return correctly structured data
2. WHEN testing with empty databases, THE System SHALL confirm that empty result sets are handled correctly
3. WHEN testing with various filter combinations, THE System SHALL ensure all query paths work correctly
4. WHEN testing pagination, THE System SHALL verify that page boundaries are handled correctly
5. WHEN testing error scenarios, THE System SHALL confirm that errors are properly caught and transformed
