# Requirements Document

## Introduction

The Digital Foreman is a comprehensive workforce management system for farm workers within LivestockAI. It extends the existing user/farm/task systems to provide worker role management with granular permissions, GPS-based attendance tracking with geofencing verification, task assignment with optional photo proof and approval workflows, and payroll tracking with wage calculations.

This feature addresses the critical need for small-to-medium scale livestock farmers in Africa to manage their workforce effectively. Workers may be semi-literate and use basic Android phones, so the system prioritizes a simple mobile-first UI with offline-first capabilities for areas with unreliable internet connectivity.

## Glossary

- **Digital_Foreman**: The overall workforce management system for farm workers
- **Worker**: A farm employee with the 'worker' role who performs assigned tasks
- **Worker_Profile**: Extended employment information for a worker including wage rate and contact details
- **Check_In**: A GPS-verified attendance record when a worker arrives at a farm
- **Check_Out**: A GPS-verified attendance record when a worker leaves a farm
- **Geofence**: A virtual geographic boundary defined around a farm for attendance verification
- **Task_Assignment**: A specific task assigned to a worker with due date and priority
- **Photo_Proof**: An optional photo attachment with GPS coordinates and timestamp for task completion
- **Approval_Workflow**: An optional supervisor review process for task completion verification
- **Payroll_Period**: A defined time period for calculating worker wages
- **Wage_Payment**: A record of payment made to a worker for a payroll period
- **Attendance_Session**: A check-in/check-out pair representing a work shift
- **Module_Permission**: Granular access control for workers per livestock module

## Requirements

### Requirement 1: Worker Role and Farm Assignment

**User Story:** As a farm owner, I want to add workers to my farm with the 'worker' role, so that I can manage my workforce within the system.

#### Acceptance Criteria

1. WHEN a farm owner invites a user as a worker, THE System SHALL create a user_farms record with role 'worker'
2. THE System SHALL support assigning a single worker to multiple farms
3. WHEN a worker is assigned to a farm, THE System SHALL allow specifying which structures the worker manages
4. THE System SHALL allow farm owners to view all workers assigned to their farm
5. WHEN a worker is removed from a farm, THE System SHALL preserve historical attendance and task records
6. THE System SHALL prevent workers from accessing farms they are not assigned to

### Requirement 2: Worker Profile Management

**User Story:** As a farm owner, I want to maintain detailed worker profiles, so that I can track employment information and contact details.

#### Acceptance Criteria

1. WHEN creating a worker profile, THE System SHALL capture phone number as the primary contact method
2. THE System SHALL store employment status as 'active', 'inactive', or 'terminated'
3. WHEN creating a worker profile, THE System SHALL capture wage information including rate amount, rate type (hourly/daily/monthly), and currency
4. THE System SHALL store employment start date and optional end date for terminated workers
5. THE System SHALL allow storing emergency contact information (name and phone)
6. WHEN a worker profile is updated, THE System SHALL log the change in audit_logs
7. THE System SHALL allow attaching a profile photo for worker identification

### Requirement 3: Module-Specific Permissions

**User Story:** As a farm owner, I want to grant workers granular permissions per module, so that workers can only access features relevant to their responsibilities.

#### Acceptance Criteria

1. THE System SHALL define permissions per module: feed logging, mortality logging, weight sampling, vaccination logging, water quality logging, egg collection, sales viewing
2. WHEN assigning a worker to a farm, THE System SHALL allow selecting which module permissions to grant
3. WHEN a worker attempts an action, THE System SHALL verify they have the required module permission
4. IF a worker lacks permission for an action, THEN THE System SHALL display an access denied message
5. THE System SHALL allow farm owners to update worker permissions at any time
6. THE System SHALL provide preset permission templates: 'Feed Handler', 'Health Monitor', 'Full Access'

### Requirement 4: Farm Geofence Configuration

**User Story:** As a farm owner, I want to define a geofence around my farm, so that worker attendance can be verified by location.

#### Acceptance Criteria

1. THE System SHALL allow defining a circular geofence with center coordinates (latitude, longitude) and radius in meters
2. THE System SHALL support polygon geofences for irregular farm shapes with up to 20 vertices
3. WHEN creating a geofence, THE System SHALL allow setting a tolerance buffer (default 100 meters)
4. THE System SHALL validate that geofence coordinates are within valid GPS ranges
5. THE System SHALL allow updating geofence configuration without affecting historical check-in records
6. THE System SHALL display the geofence on a map for visual confirmation

### Requirement 5: GPS Check-In

**User Story:** As a worker, I want to check in when I arrive at the farm, so that my attendance is recorded with location verification.

#### Acceptance Criteria

1. WHEN a worker initiates check-in, THE System SHALL capture current GPS coordinates
2. THE System SHALL compare worker coordinates against the farm's geofence
3. IF the worker is within the geofence (including tolerance), THEN THE System SHALL record a successful check-in with status 'verified'
4. IF the worker is outside the geofence, THEN THE System SHALL record the check-in with status 'outside_geofence' and flag for review
5. WHEN GPS is unavailable, THE System SHALL allow manual check-in with status 'manual' requiring supervisor approval
6. THE System SHALL store check-in timestamp, coordinates, accuracy, and verification status
7. THE System SHALL prevent duplicate check-ins within 5 minutes

### Requirement 6: GPS Check-Out

**User Story:** As a worker, I want to check out when I leave the farm, so that my work hours are accurately recorded.

#### Acceptance Criteria

1. WHEN a worker initiates check-out, THE System SHALL capture current GPS coordinates
2. THE System SHALL link the check-out to the most recent open check-in for that worker and farm
3. THE System SHALL calculate hours worked as the difference between check-in and check-out times
4. IF no open check-in exists, THEN THE System SHALL display an error message
5. THE System SHALL store check-out timestamp, coordinates, and calculated hours
6. THE System SHALL support automatic check-out at midnight for workers who forget to check out

### Requirement 7: Offline Attendance

**User Story:** As a worker in a rural area, I want to record attendance offline, so that connectivity issues don't prevent time tracking.

#### Acceptance Criteria

1. WHEN offline, THE System SHALL allow check-in/check-out with locally stored GPS coordinates
2. THE System SHALL store offline attendance records in IndexedDB with 'pending_sync' status
3. WHEN connectivity is restored, THE System SHALL automatically sync pending attendance records
4. THE System SHALL display pending sync count to the worker
5. IF sync fails after 3 retries, THEN THE System SHALL notify the worker and flag for manual review
6. THE System SHALL preserve offline records for up to 7 days before requiring sync

### Requirement 8: Task Assignment to Workers

**User Story:** As a farm manager, I want to assign tasks to specific workers, so that responsibilities are clear and trackable.

#### Acceptance Criteria

1. WHEN creating a task assignment, THE System SHALL require selecting a worker and a task
2. THE System SHALL allow setting a due date and time for the assignment
3. THE System SHALL support priority levels: low, medium, high, urgent
4. THE System SHALL set initial assignment status as 'pending'
5. WHEN a task is assigned, THE System SHALL send a notification to the worker
6. THE System SHALL allow assigning the same task to multiple workers
7. THE System SHALL allow adding assignment notes with instructions

### Requirement 9: Task Completion by Workers

**User Story:** As a worker, I want to mark my assigned tasks as complete, so that my work is recorded and visible to supervisors.

#### Acceptance Criteria

1. WHEN a worker marks a task complete, THE System SHALL update status to 'completed' and record completion timestamp
2. THE System SHALL allow workers to add completion notes
3. IF photo proof is required for the task, THEN THE System SHALL require a photo before allowing completion
4. THE System SHALL validate that the worker is the assignee before allowing completion
5. WHEN a task is completed, THE System SHALL notify the assigning manager
6. THE System SHALL allow workers to mark tasks as 'in_progress' before completion

### Requirement 10: Photo Proof for Tasks

**User Story:** As a farm manager, I want workers to attach photo proof to task completions, so that I can verify work was done correctly.

#### Acceptance Criteria

1. WHEN configuring a task assignment, THE System SHALL allow marking photo proof as required or optional
2. WHEN a worker attaches a photo, THE System SHALL capture GPS coordinates and timestamp with the photo
3. THE System SHALL store photos in Cloudflare R2 with the task assignment ID as reference
4. THE System SHALL compress photos to maximum 1MB before upload
5. THE System SHALL support offline photo capture with sync when online
6. THE System SHALL allow attaching up to 3 photos per task completion

### Requirement 11: Task Approval Workflow

**User Story:** As a farm manager, I want to review and approve task completions, so that I can ensure quality standards are met.

#### Acceptance Criteria

1. WHEN configuring a task assignment, THE System SHALL allow enabling approval requirement
2. WHEN a task requiring approval is completed, THE System SHALL set status to 'pending_approval'
3. THE System SHALL notify the supervisor when a task is pending approval
4. WHEN a supervisor approves a task, THE System SHALL update status to 'verified' and record approver and timestamp
5. WHEN a supervisor rejects a task, THE System SHALL update status to 'rejected' with rejection reason
6. IF a task is rejected, THEN THE System SHALL notify the worker and allow resubmission
7. THE System SHALL allow supervisors to view all tasks pending their approval

### Requirement 12: Payroll Period Management

**User Story:** As a farm owner, I want to define payroll periods, so that I can calculate wages for specific time ranges.

#### Acceptance Criteria

1. THE System SHALL support payroll period types: weekly, bi-weekly, monthly
2. WHEN creating a payroll period, THE System SHALL specify start date and end date
3. THE System SHALL prevent overlapping payroll periods for the same farm
4. THE System SHALL calculate total hours worked per worker from attendance records within the period
5. THE System SHALL calculate gross wages based on worker's rate type and hours/days worked
6. THE System SHALL generate a payroll summary with all workers and their calculated wages

### Requirement 13: Wage Payment Recording

**User Story:** As a farm owner, I want to record wage payments to workers, so that I can track payroll expenses and outstanding balances.

#### Acceptance Criteria

1. WHEN recording a payment, THE System SHALL capture amount, payment date, and payment method
2. THE System SHALL support payment methods: cash, bank_transfer, mobile_money
3. THE System SHALL link payments to specific payroll periods
4. THE System SHALL calculate outstanding balance as gross wages minus payments made
5. THE System SHALL allow partial payments with remaining balance tracked
6. WHEN a payment is recorded, THE System SHALL log it in audit_logs and create an expense record

### Requirement 14: Worker Dashboard

**User Story:** As a worker, I want a simple mobile dashboard, so that I can see my tasks and check in/out easily.

#### Acceptance Criteria

1. THE Worker_Dashboard SHALL display a prominent check-in/check-out button based on current status
2. THE Worker_Dashboard SHALL show today's assigned tasks with priority indicators
3. THE Worker_Dashboard SHALL display current check-in status and hours worked today
4. THE Worker_Dashboard SHALL use large touch targets (minimum 48px) for all interactive elements
5. THE Worker_Dashboard SHALL work offline with cached task data
6. THE Worker_Dashboard SHALL show sync status indicator for pending offline data
7. THE Worker_Dashboard SHALL support the worker's preferred language

### Requirement 15: Manager Attendance Overview

**User Story:** As a farm manager, I want to see attendance status for all workers, so that I can monitor who is present and working.

#### Acceptance Criteria

1. THE Attendance_Overview SHALL display all workers with current status: checked_in, checked_out, not_checked_in
2. THE Attendance_Overview SHALL show check-in time and hours worked for checked-in workers
3. THE Attendance_Overview SHALL highlight workers with flagged check-ins (outside geofence, manual)
4. THE Attendance_Overview SHALL allow filtering by date and worker
5. THE Attendance_Overview SHALL show daily attendance summary: present, absent, late arrivals
6. THE Attendance_Overview SHALL allow exporting attendance data to CSV

### Requirement 16: Manager Task Overview

**User Story:** As a farm manager, I want to see task completion status across all workers, so that I can monitor productivity and identify issues.

#### Acceptance Criteria

1. THE Task_Overview SHALL display all task assignments with status, worker, and due date
2. THE Task_Overview SHALL highlight overdue tasks
3. THE Task_Overview SHALL show completion rate metrics: completed, pending, overdue
4. THE Task_Overview SHALL allow filtering by worker, status, priority, and date range
5. THE Task_Overview SHALL allow bulk task assignment to multiple workers
6. THE Task_Overview SHALL show tasks pending approval with quick approve/reject actions

### Requirement 17: Payroll Dashboard

**User Story:** As a farm owner, I want a payroll dashboard, so that I can manage worker compensation efficiently.

#### Acceptance Criteria

1. THE Payroll_Dashboard SHALL display current payroll period with summary totals
2. THE Payroll_Dashboard SHALL show per-worker breakdown: hours worked, gross wages, payments made, balance
3. THE Payroll_Dashboard SHALL highlight workers with outstanding balances
4. THE Payroll_Dashboard SHALL allow recording payments directly from the dashboard
5. THE Payroll_Dashboard SHALL show historical payroll periods with totals
6. THE Payroll_Dashboard SHALL allow exporting payroll reports to CSV or PDF

### Requirement 18: Worker Performance Metrics

**User Story:** As a farm manager, I want to see worker performance metrics, so that I can identify top performers and areas for improvement.

#### Acceptance Criteria

1. THE System SHALL calculate task completion rate per worker (completed / assigned)
2. THE System SHALL calculate average task completion time per worker
3. THE System SHALL calculate attendance reliability (on-time check-ins / total check-ins)
4. THE System SHALL track tasks rejected vs approved for workers with approval workflow
5. THE System SHALL display performance trends over time (weekly, monthly)
6. THE System SHALL allow comparing performance across workers
