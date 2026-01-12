# Requirements Document

## Introduction

This document defines requirements for implementing user management capabilities in OpenLivestock Manager. The system will use Better Auth's Admin plugin for user administration and enhance the existing `user_farms` table with per-farm roles. This is designed for a single-person-per-farm model, not a multi-tenant system.

## Glossary

- **Admin_Plugin**: Better Auth plugin providing user administration capabilities (create, ban, remove users)
- **System**: The OpenLivestock Manager application
- **Admin**: A user with the global 'admin' role who can manage all users and farms
- **User**: A regular user who owns and manages their own farm(s)
- **Farm_Role**: The role a user has within a specific farm (owner, manager, viewer)

## Requirements

### Requirement 1: Admin Plugin Integration

**User Story:** As a system administrator, I want to manage users without requiring email verification, so that I can quickly onboard farmers who may not have reliable email access.

#### Acceptance Criteria

1. THE System SHALL integrate Better Auth Admin plugin for user management
2. WHEN an admin creates a new user, THE System SHALL create the user with a temporary password without email verification
3. WHEN an admin resets a user's password, THE System SHALL set a new password directly without email
4. WHEN an admin bans a user, THE System SHALL prevent that user from logging in
5. WHEN an admin unbans a user, THE System SHALL restore login capability
6. WHEN an admin removes a user, THE System SHALL delete the user and all associated data
7. THE System SHALL restrict admin operations to users with the 'admin' role

### Requirement 2: Enhanced User-Farm Relationship

**User Story:** As a system administrator, I want to assign roles to users within farms, so that I can control what actions they can perform.

#### Acceptance Criteria

1. THE System SHALL support farm-level roles: owner, manager, viewer
2. WHEN a user creates a farm, THE System SHALL automatically assign them as 'owner'
3. WHEN an admin assigns a user to a farm, THE System SHALL require a role selection
4. THE System SHALL enforce that each farm has at least one owner
5. WHILE a user has 'owner' role, THE System SHALL grant full farm management permissions
6. WHILE a user has 'manager' role, THE System SHALL grant data entry and viewing permissions
7. WHILE a user has 'viewer' role, THE System SHALL grant read-only access

### Requirement 3: User Management UI

**User Story:** As an admin, I want a dedicated page to manage users, so that I can view, create, and modify user accounts.

#### Acceptance Criteria

1. THE System SHALL provide a Users page accessible only to admins
2. WHEN viewing the Users page, THE System SHALL display a list of all users with name, email, role, and status
3. WHEN an admin clicks "Add User", THE System SHALL show a form to create a new user
4. WHEN an admin selects a user, THE System SHALL show options to edit, reset password, ban/unban, or remove
5. WHEN displaying a banned user, THE System SHALL show a visual indicator and ban reason
6. THE System SHALL require confirmation for destructive actions (ban, remove)

### Requirement 4: Farm Assignment Management

**User Story:** As an admin, I want to manage which users have access to which farms, so that I can control farm-level permissions.

#### Acceptance Criteria

1. THE System SHALL provide a farm assignment interface within user management
2. WHEN viewing a user's details, THE System SHALL show their farm assignments with roles
3. WHEN an admin assigns a user to a farm, THE System SHALL allow role selection (owner, manager, viewer)
4. WHEN an admin removes a user from a farm, THE System SHALL revoke their access
5. IF removing the last owner from a farm, THEN THE System SHALL prevent the removal and show an error

### Requirement 5: Database Schema Updates

**User Story:** As a developer, I want the database schema updated to support admin features and farm roles, so that the system can persist this data.

#### Acceptance Criteria

1. THE System SHALL add banned, banReason, banExpires columns to users table
2. THE System SHALL add a role column to user_farms table with values: owner, manager, viewer
3. THE System SHALL update existing user_farms records to have 'owner' role by default
4. THE System SHALL add appropriate indexes for new columns

### Requirement 6: User Onboarding Flow

**User Story:** As a new user who may not be tech-savvy, I want to be guided through the platform step-by-step, so that I understand how to use it effectively.

#### Acceptance Criteria

1. WHEN a new user logs in for the first time, THE System SHALL detect they have no farms and redirect to onboarding
2. THE System SHALL display a welcome step explaining what OpenLivestock does and its key benefits
3. THE System SHALL guide the user to create their first farm with clear explanations of each field
4. THE System SHALL guide the user to select which livestock modules to enable (poultry, fish, cattle, etc.)
5. THE System SHALL guide the user to create their first structure (house, pond, pen) with explanations
6. THE System SHALL guide the user to create their first batch with explanations of key concepts (batch, mortality, feed tracking)
7. THE System SHALL guide the user to configure preferences (currency, date format, weight units)
8. THE System SHALL provide a feature tour highlighting key areas: Dashboard, Batches, Sales, Reports, Settings
9. WHEN any step is completed, THE System SHALL show a progress indicator
10. THE System SHALL allow users to skip individual steps or the entire onboarding
11. THE System SHALL store onboarding progress so users can resume if interrupted
12. WHEN a user is added to a farm by admin, THE System SHALL skip farm creation and show welcome + tour only
13. WHEN onboarding completes, THE System SHALL redirect to the dashboard with a completion message
14. THE System SHALL provide a way to restart the tour from settings
