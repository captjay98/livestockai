import type { Generated } from 'kysely'

// ============================================
// Extension Worker Mode Tables
// ============================================

/** Countries with ISO codes */
export interface CountryTable {
  id: Generated<string>
  code: string
  name: string
  localizedNames: Generated<string> // JSON string
  createdAt: Generated<Date>
}

/** Geographic regions (2-level: State/Province -> District) */
export interface RegionTable {
  id: Generated<string>
  countryId: string // UUID
  parentId: string | null
  level: 1 | 2
  name: string
  slug: string
  localizedNames: Generated<string> // JSON string
  isActive: Generated<boolean>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/** Extension worker district assignments */
export interface UserDistrictTable {
  id: Generated<string>
  userId: string
  districtId: string
  isSupervisor: Generated<boolean>
  assignedAt: Generated<Date>
  assignedBy: string | null
}

/** Access requests from extension workers to farmers */
export interface AccessRequestTable {
  id: Generated<string>
  requesterId: string
  farmId: string
  purpose: string
  requestedDurationDays: number
  status: 'pending' | 'approved' | 'denied' | 'expired'
  responderId: string | null
  rejectionReason: string | null
  respondedAt: Date | null
  expiresAt: Date
  createdAt: Generated<Date>
}

/** Time-limited access grants from farmers to extension workers */
export interface AccessGrantTable {
  id: Generated<string>
  userId: string
  farmId: string
  accessRequestId: string | null
  grantedBy: string | null
  grantedAt: Generated<Date>
  expiresAt: Date
  financialVisibility: Generated<boolean>
  revokedAt: Date | null
  revokedBy: string | null
  revokedReason: string | null
}

/** Species-specific mortality thresholds for health status */
export interface SpeciesThresholdTable {
  id: Generated<string>
  species: string
  regionId: string | null
  amberThreshold: string // DECIMAL
  redThreshold: string // DECIMAL
  createdAt: Generated<Date>
}

/** Extension worker visit records */
export interface VisitRecordTable {
  id: Generated<string>
  agentId: string
  farmId: string
  visitDate: Date
  visitType: 'routine' | 'emergency' | 'follow_up'
  findings: string
  recommendations: string
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  followUpDate: Date | null
  farmerAcknowledged: Generated<boolean>
  farmerAcknowledgedAt: Date | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/** Outbreak alerts for disease monitoring */
export interface OutbreakAlertTable {
  id: Generated<string>
  districtId: string
  species: string
  livestockType: string
  severity: 'watch' | 'alert' | 'critical'
  status: 'active' | 'monitoring' | 'resolved' | 'false_positive'
  detectedAt: Generated<Date>
  resolvedAt: Date | null
  notes: string | null
  createdBy: string
  updatedAt: Generated<Date>
  updatedBy: string
}

/** Junction table for farms affected by outbreak alerts */
export interface OutbreakAlertFarmTable {
  alertId: string
  farmId: string
  mortalityRate: string // DECIMAL(5,2)
  reportedAt: Generated<Date>
}
