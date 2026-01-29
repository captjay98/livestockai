# Implementation Plan: User Management System

## Overview

This implementation plan covers adding Better Auth Admin plugin for user management and enhancing the existing `user_farms` table with per-farm roles. This is a simplified approach for a single-person-per-farm model.

## Tasks

- [x] 1. Update Database Schema
  - [x] 1.1 Add admin fields to users table
    - Add banned (boolean, default false), banReason (text), banExpires (timestamp) columns
    - Update role constraint from ('admin', 'staff') to ('admin', 'user')
    - Update existing migration file (not create new)
    - _Requirements: 5.1_
  - [x] 1.2 Add role column to user_farms table
    - Add role column with values: owner, manager, viewer
    - Add check constraint for valid roles
    - Set default to 'owner' for existing records
    - _Requirements: 5.2, 5.3_
  - [x] 1.3 Update TypeScript types
    - Update UserTable interface with new fields
    - Update UserFarmTable interface with role field
    - Add FarmRole type
    - _Requirements: 5.1, 5.2_

- [x] 2. Integrate Better Auth Admin Plugin
  - [x] 2.1 Install and configure Admin plugin
    - Add admin plugin to auth config
    - Set defaultRole to 'user' and adminRoles to ['admin']
    - Configure additional user fields (banned, banReason, banExpires)
    - _Requirements: 1.1_
  - [x] 2.2 Update auth client with admin client
    - Add adminClient to client config
    - Export admin namespace for client-side use
    - _Requirements: 1.1_
  - [x] 2.3 Create requireAdmin middleware
    - Add requireAdmin function to server-middleware
    - Check user role and throw 403 if not admin
    - _Requirements: 1.7_

- [x] 3. Checkpoint - Verify plugin integration
  - Run migrations and verify schema changes
  - Test that admin plugin is properly configured
  - Ensure all existing tests pass

- [x] 4. Implement User Management Server Functions
  - [x] 4.1 Create user management server functions
    - listUsers, createUser, setUserPassword, banUser, unbanUser, removeUser
    - Use dynamic imports for database and auth
    - Add Zod validation for all inputs
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 4.2 Write property test for user creation
    - **Property 1: User Creation Preserves Data**
    - **Validates: Requirements 1.2**
  - [x] 4.3 Write property test for ban/unban round-trip
    - **Property 2: Ban/Unban Round-Trip**
    - **Validates: Requirements 1.4, 1.5**

- [x] 5. Implement Farm Role Management
  - [x] 5.1 Update createFarm to assign owner role
    - Modify createFarm to insert into user_farms with role='owner'
    - _Requirements: 2.2_
  - [x] 5.2 Create farm assignment server functions
    - assignUserToFarm, removeUserFromFarm, updateUserFarmRole, getUserFarmAssignments
    - Include last-owner protection check
    - _Requirements: 2.3, 4.3, 4.4, 4.5_
  - [x] 5.3 Update permission checking utilities
    - Modify checkFarmAccess to consider farm roles
    - Add getFarmRole utility function
    - _Requirements: 2.5, 2.6, 2.7_
  - [x] 5.4 Write property test for farm role assignment
    - **Property 3: Farm Role Assignment Persistence**
    - **Validates: Requirements 2.3**
  - [x] 5.5 Write property test for last owner protection
    - **Property 4: Last Owner Protection**
    - **Validates: Requirements 2.4, 4.5**
  - [x] 5.6 Write property test for farm creator ownership
    - **Property 6: Farm Creator Becomes Owner**
    - **Validates: Requirements 2.2**

- [x] 6. Checkpoint - Verify server functions
  - Test all server functions manually
  - Ensure permission checks work correctly
  - Ensure all tests pass

- [x] 7. Build User Management UI
  - [x] 7.1 Create users settings route
    - Add \_auth.settings.users.tsx route
    - Add "Users" link to settings navigation (admin only)
    - _Requirements: 3.1_
  - [x] 7.2 Build user list component
    - Display list with name, email, role, status, createdAt
    - Add search functionality
    - Show banned indicator with reason
    - _Requirements: 3.2, 3.5_
  - [x] 7.3 Build add user dialog
    - Form with email, password, name, role fields
    - Validation and error handling
    - _Requirements: 3.3_
  - [x] 7.4 Build user actions menu
    - Edit, reset password, ban/unban, remove options
    - Confirmation dialogs for destructive actions
    - _Requirements: 3.4, 3.6_

- [x] 8. Build Farm Assignment UI
  - [x] 8.1 Add farm assignments section to user details
    - Show list of farms user is assigned to with roles
    - _Requirements: 4.2_
  - [x] 8.2 Build assign to farm dialog
    - Farm selector and role dropdown
    - _Requirements: 4.3_
  - [x] 8.3 Build farm assignment actions
    - Update role, remove from farm
    - Show error for last owner removal
    - _Requirements: 4.4, 4.5_

- [x] 9. Build Onboarding Flow
  - [x] 9.1 Create onboarding state management
    - Create onboarding context/store to track progress
    - Store progress in localStorage and user_settings
    - Track which steps are completed
    - _Requirements: 6.9, 6.11_
  - [x] 9.2 Create onboarding detection and routing
    - Check if user has farms on login
    - Check if onboarding is completed in user_settings
    - Redirect to /onboarding if needed
    - _Requirements: 6.1_
  - [x] 9.3 Build Step 1: Welcome screen
    - App introduction and key benefits
    - What LivestockAI helps with (tracking, forecasting, finances)
    - "Get Started" button
    - _Requirements: 6.2_
  - [x] 9.4 Build Step 2: Create farm
    - Reuse farm creation form with added explanations
    - Tooltips explaining each field (name, location, type)
    - Why farms matter in the system
    - _Requirements: 6.3_
  - [x] 9.5 Build Step 3: Enable modules
    - Show available livestock modules with icons and descriptions
    - Explain what each module provides
    - Allow multi-select based on farm type
    - _Requirements: 6.4_
  - [x] 9.6 Build Step 4: Create first structure
    - Explain farm hierarchy (Farm → Structure → Batch)
    - Informational step explaining organization
    - _Requirements: 6.5_
  - [x] 9.7 Build Step 5: Create first batch
    - Explain what a batch is and why it matters
    - Simplified batch creation form
    - Explain key concepts: mortality tracking, feed records, weight samples
    - _Requirements: 6.6_
  - [x] 9.8 Build Step 6: Configure preferences
    - Currency selection with preview
    - Date format selection
    - Weight unit selection (kg/lbs)
    - _Requirements: 6.7_
  - [x] 9.9 Build Step 7: Feature tour
    - Highlight Dashboard: overview of farm health
    - Highlight Batches: where daily work happens
    - Highlight Sales & Expenses: financial tracking
    - Highlight Reports: insights and forecasting
    - Interactive tour with progress dots
    - _Requirements: 6.8_
  - [x] 9.10 Build onboarding completion
    - Celebration/success message
    - Summary of what was set up
    - Redirect to dashboard
    - _Requirements: 6.13_
  - [x] 9.11 Build skip and resume functionality
    - Skip button on each step
    - Skip entire onboarding option
    - Resume from last incomplete step (localStorage)
    - _Requirements: 6.10, 6.11_
  - [x] 9.12 Handle admin-added users
    - Detect if user already has farm assignments
    - Show abbreviated flow: Welcome → Tour only
    - _Requirements: 6.12_
  - [x] 9.13 Add "Restart Tour" option in settings
    - Button in settings to re-run the feature tour
    - _Requirements: 6.14_
  - [x] 9.14 Write property test for new user detection
    - **Property 5: New User Has No Farms**
    - **Validates: Requirements 6.1**

- [x] 10. Final Checkpoint
  - Run all tests and ensure they pass
  - Test complete user flows manually
  - Verify admin-only access is enforced

## Notes

- All server functions must use dynamic imports for Cloudflare Workers compatibility
- Use fast-check for property-based testing with minimum 100 iterations
- The existing `user_farms` table is enhanced, not replaced
- Global role ('admin'/'user') is separate from farm role ('owner'/'manager'/'viewer')
- Admin users have access to all farms regardless of farm assignments
