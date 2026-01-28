import { sql } from 'kysely'
import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Update FarmRole to include 'worker'
  await sql`ALTER TABLE user_farms DROP CONSTRAINT IF EXISTS user_farms_role_check`.execute(db)
  await sql`ALTER TABLE user_farms ADD CONSTRAINT user_farms_role_check CHECK (role IN ('owner', 'manager', 'viewer', 'worker'))`.execute(db)

  // Worker Profiles
  await sql`
    CREATE TABLE worker_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "farmId" UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      phone VARCHAR(20) NOT NULL,
      "emergencyContactName" VARCHAR(100),
      "emergencyContactPhone" VARCHAR(20),
      "employmentStatus" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("employmentStatus" IN ('active', 'inactive', 'terminated')),
      "employmentStartDate" DATE NOT NULL DEFAULT CURRENT_DATE,
      "employmentEndDate" DATE,
      "wageRateAmount" DECIMAL(19,2) NOT NULL,
      "wageRateType" VARCHAR(10) NOT NULL CHECK ("wageRateType" IN ('hourly', 'daily', 'monthly')),
      "wageCurrency" VARCHAR(3) NOT NULL DEFAULT 'USD',
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      "structureIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "profilePhotoUrl" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now(),
      UNIQUE ("userId", "farmId")
    )
  `.execute(db)
  await sql`CREATE INDEX idx_worker_profiles_user_id ON worker_profiles ("userId")`.execute(db)
  await sql`CREATE INDEX idx_worker_profiles_farm_id ON worker_profiles ("farmId")`.execute(db)
  await sql`CREATE INDEX idx_worker_profiles_employment_status ON worker_profiles ("employmentStatus")`.execute(db)

  // Farm Geofences
  await sql`
    CREATE TABLE farm_geofences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "farmId" UUID NOT NULL UNIQUE REFERENCES farms(id) ON DELETE CASCADE,
      "geofenceType" VARCHAR(10) NOT NULL CHECK ("geofenceType" IN ('circle', 'polygon')),
      "centerLat" DECIMAL(10,7),
      "centerLng" DECIMAL(10,7),
      "radiusMeters" DECIMAL(10,2),
      vertices JSONB,
      "toleranceMeters" DECIMAL(10,2) NOT NULL DEFAULT 100,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    )
  `.execute(db)

  // Worker Check-ins
  await sql`
    CREATE TABLE worker_check_ins (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "workerId" UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
      "farmId" UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      "checkInTime" TIMESTAMPTZ NOT NULL,
      "checkInLat" DECIMAL(10,7) NOT NULL,
      "checkInLng" DECIMAL(10,7) NOT NULL,
      "checkInAccuracy" DECIMAL(10,2),
      "verificationStatus" VARCHAR(20) NOT NULL DEFAULT 'pending_sync' CHECK ("verificationStatus" IN ('verified', 'outside_geofence', 'manual', 'pending_sync')),
      "checkOutTime" TIMESTAMPTZ,
      "checkOutLat" DECIMAL(10,7),
      "checkOutLng" DECIMAL(10,7),
      "checkOutAccuracy" DECIMAL(10,2),
      "hoursWorked" DECIMAL(5,2),
      "syncStatus" VARCHAR(20) NOT NULL DEFAULT 'synced' CHECK ("syncStatus" IN ('synced', 'pending_sync', 'sync_failed')),
      "createdAt" TIMESTAMPTZ DEFAULT now()
    )
  `.execute(db)
  await sql`CREATE INDEX idx_worker_check_ins_worker_id ON worker_check_ins ("workerId")`.execute(db)
  await sql`CREATE INDEX idx_worker_check_ins_farm_id ON worker_check_ins ("farmId")`.execute(db)
  await sql`CREATE INDEX idx_worker_check_ins_check_in_time ON worker_check_ins ("checkInTime")`.execute(db)
  await sql`CREATE INDEX idx_worker_check_ins_open ON worker_check_ins ("workerId", "farmId") WHERE "checkOutTime" IS NULL`.execute(db)

  // Task Assignments
  await sql`
    CREATE TABLE task_assignments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "taskId" UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      "workerId" UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
      "assignedBy" UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      "farmId" UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      "dueDate" TIMESTAMPTZ,
      priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'pending_approval', 'verified', 'rejected')),
      "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
      "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      "completedAt" TIMESTAMPTZ,
      "completionNotes" TEXT,
      "approvedBy" UUID REFERENCES users(id),
      "approvedAt" TIMESTAMPTZ,
      "rejectionReason" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    )
  `.execute(db)
  await sql`CREATE INDEX idx_task_assignments_worker_id ON task_assignments ("workerId")`.execute(db)
  await sql`CREATE INDEX idx_task_assignments_farm_id ON task_assignments ("farmId")`.execute(db)
  await sql`CREATE INDEX idx_task_assignments_status ON task_assignments (status)`.execute(db)
  await sql`CREATE INDEX idx_task_assignments_due_date ON task_assignments ("dueDate")`.execute(db)
  await sql`CREATE INDEX idx_task_assignments_pending_approval ON task_assignments ("farmId") WHERE status = 'pending_approval'`.execute(db)

  // Task Photos
  await sql`
    CREATE TABLE task_photos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "assignmentId" UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
      "photoUrl" TEXT NOT NULL,
      "capturedLat" DECIMAL(10,7),
      "capturedLng" DECIMAL(10,7),
      "capturedAt" TIMESTAMPTZ NOT NULL,
      "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.execute(db)
  await sql`CREATE INDEX idx_task_photos_assignment_id ON task_photos ("assignmentId")`.execute(db)

  // Payroll Periods
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`.execute(db)
  await sql`
    CREATE TABLE payroll_periods (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "farmId" UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      "periodType" VARCHAR(15) NOT NULL CHECK ("periodType" IN ('weekly', 'bi-weekly', 'monthly')),
      "startDate" DATE NOT NULL,
      "endDate" DATE NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now(),
      CHECK ("startDate" < "endDate"),
      EXCLUDE USING gist ("farmId" WITH =, daterange("startDate", "endDate", '[]') WITH &&)
    )
  `.execute(db)

  // Wage Payments
  await sql`
    CREATE TABLE wage_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "workerId" UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
      "payrollPeriodId" UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
      "farmId" UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      amount DECIMAL(19,2) NOT NULL,
      "paymentDate" DATE NOT NULL,
      "paymentMethod" VARCHAR(20) NOT NULL CHECK ("paymentMethod" IN ('cash', 'bank_transfer', 'mobile_money')),
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    )
  `.execute(db)
  await sql`CREATE INDEX idx_wage_payments_worker_id ON wage_payments ("workerId")`.execute(db)
  await sql`CREATE INDEX idx_wage_payments_period_id ON wage_payments ("payrollPeriodId")`.execute(db)
  await sql`CREATE INDEX idx_wage_payments_farm_id ON wage_payments ("farmId")`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS wage_payments`.execute(db)
  await sql`DROP TABLE IF EXISTS payroll_periods`.execute(db)
  await sql`DROP TABLE IF EXISTS task_photos`.execute(db)
  await sql`DROP TABLE IF EXISTS task_assignments`.execute(db)
  await sql`DROP TABLE IF EXISTS worker_check_ins`.execute(db)
  await sql`DROP TABLE IF EXISTS farm_geofences`.execute(db)
  await sql`DROP TABLE IF EXISTS worker_profiles`.execute(db)
  await sql`ALTER TABLE user_farms DROP CONSTRAINT IF EXISTS user_farms_role_check`.execute(db)
  await sql`ALTER TABLE user_farms ADD CONSTRAINT user_farms_role_check CHECK (role IN ('owner', 'manager', 'viewer'))`.execute(db)
}
