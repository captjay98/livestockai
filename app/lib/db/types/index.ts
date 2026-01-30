/**
 * Database Types - Barrel Export
 *
 * This file re-exports all database table types from domain-specific modules.
 * Import from here or from the main types.ts file for backward compatibility.
 */

// Auth types
export type {
  UserTable,
  SessionTable,
  AccountTable,
  VerificationTable,
} from './auth'

// Settings types
export type { UserSettingsTable } from './settings'

// Farm types
export type {
  FarmTable,
  FarmModuleTable,
  UserFarmTable,
  FarmRole,
  StructureTable,
} from './farms'

// Livestock types
export type {
  BreedTable,
  BreedRequestTable,
  BatchTable,
  EggTable,
  WeightTable,
} from './livestock'

// Health types
export type {
  MortalityTable,
  VaccinationTable,
  TreatmentTable,
  WaterQualityTable,
} from './health'

// Feed types
export type {
  FeedTable,
  FeedInventoryTable,
  MedicationInventoryTable,
  SuppliesInventoryTable,
  FeedIngredientTable,
  NutritionalRequirementTable,
  UserIngredientPriceTable,
  SavedFormulationTable,
  FormulationUsageTable,
} from './feed'

// Financial types
export type {
  SaleTable,
  ExpenseTable,
  CustomerTable,
  SupplierTable,
  InvoiceTable,
  InvoiceItemTable,
} from './financial'

// Monitoring types
export type {
  AuditLogTable,
  GrowthStandardTable,
  MarketPriceTable,
  NotificationTable,
  TaskTable,
  TaskCompletionTable,
  ReportConfigTable,
  CreditReportTable,
  ReportRequestTable,
  ReportAccessLogTable,
} from './monitoring'

// Digital Foreman types
export type {
  ModulePermission,
  WorkerProfileTable,
  FarmGeofenceTable,
  WorkerCheckInTable,
  TaskAssignmentTable,
  TaskPhotoTable,
  PayrollPeriodTable,
  WagePaymentTable,
} from './digital-foreman'

// Sensor types
export type {
  SensorType,
  SensorThresholds,
  SensorTrendConfig,
  SensorTable,
  SensorReadingTable,
  SensorAggregateTable,
  SensorAlertType,
  SensorAlertTable,
  SensorAlertConfigTable,
} from './sensors'

// Marketplace types
export type {
  MarketplaceLivestockType,
  FuzzingLevel,
  ListingStatus,
  ContactRequestStatus,
  MarketplaceListingTable,
  ListingContactRequestTable,
  ListingViewTable,
} from './marketplace'

// Extension Worker types
export type {
  CountryTable,
  RegionTable,
  UserDistrictTable,
  AccessRequestTable,
  AccessGrantTable,
  SpeciesThresholdTable,
  VisitRecordTable,
  OutbreakAlertTable,
  OutbreakAlertFarmTable,
} from './extension-worker'
