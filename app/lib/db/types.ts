/**
 * Database Types - Main Entry Point
 *
 * This file serves as the main entry point for all database types.
 * Types are organized into domain-specific modules in the ./types/ directory.
 *
 * Structure:
 * - types/auth.ts         - User, Session, Account tables
 * - types/settings.ts     - UserSettings table
 * - types/farms.ts        - Farm, FarmModule, UserFarm, Structure tables
 * - types/livestock.ts    - Breed, Batch, Egg, Weight tables
 * - types/health.ts       - Mortality, Vaccination, Treatment, WaterQuality tables
 * - types/feed.ts         - Feed, FeedInventory, MedicationInventory, Formulation tables
 * - types/financial.ts    - Sale, Expense, Customer, Supplier, Invoice tables
 * - types/monitoring.ts   - AuditLog, GrowthStandard, MarketPrice, Notification, Task, Report tables
 * - types/digital-foreman.ts - Worker, Geofence, CheckIn, TaskAssignment, Payroll tables
 * - types/sensors.ts      - Sensor, SensorReading, SensorAggregate, SensorAlert tables
 * - types/marketplace.ts  - MarketplaceListing, ListingContactRequest, ListingView tables
 * - types/extension-worker.ts - Country, Region, UserDistrict, AccessRequest, VisitRecord, OutbreakAlert tables
 */

// Import types for Database interface (must be at top for ESLint import/first rule)
import type {
  AccessGrantTable,
  AccessRequestTable,
  AccountTable,
  AuditLogTable,
  BatchTable,
  BreedRequestTable,
  BreedTable,
  CountryTable,
  CreditReportTable,
  CustomerTable,
  EggTable,
  ExpenseTable,
  FarmGeofenceTable,
  FarmModuleTable,
  FarmTable,
  FeedIngredientTable,
  FeedInventoryTable,
  FeedTable,
  FormulationUsageTable,
  GrowthStandardTable,
  InvoiceItemTable,
  InvoiceTable,
  ListingContactRequestTable,
  ListingViewTable,
  MarketPriceTable,
  MarketplaceListingTable,
  MedicationInventoryTable,
  MortalityTable,
  NotificationTable,
  NutritionalRequirementTable,
  OutbreakAlertFarmTable,
  OutbreakAlertTable,
  PayrollPeriodTable,
  RegionTable,
  ReportAccessLogTable,
  ReportConfigTable,
  ReportRequestTable,
  SaleTable,
  SavedFormulationTable,
  SensorAggregateTable,
  SensorAlertConfigTable,
  SensorAlertTable,
  SensorReadingTable,
  SensorTable,
  SessionTable,
  SpeciesThresholdTable,
  StructureTable,
  SupplierTable,
  TaskAssignmentTable,
  TaskCompletionTable,
  TaskPhotoTable,
  TaskTable,
  TreatmentTable,
  UserDistrictTable,
  UserFarmTable,
  UserIngredientPriceTable,
  UserSettingsTable,
  UserTable,
  VaccinationTable,
  VerificationTable,
  VisitRecordTable,
  WagePaymentTable,
  WaterQualityTable,
  WeightTable,
  WorkerCheckInTable,
  WorkerProfileTable,
} from './types/index'

// Re-export all types from domain modules
export type {
  // Auth
  AccountTable,
  SessionTable,
  UserTable,
  VerificationTable,
  // Settings
  UserSettingsTable,
  // Farms
  FarmModuleTable,
  FarmRole,
  FarmTable,
  StructureTable,
  UserFarmTable,
  // Livestock
  BatchTable,
  BreedRequestTable,
  BreedTable,
  EggTable,
  WeightTable,
  // Health
  MortalityTable,
  TreatmentTable,
  VaccinationTable,
  WaterQualityTable,
  // Feed
  FeedIngredientTable,
  FeedInventoryTable,
  FeedTable,
  FormulationUsageTable,
  MedicationInventoryTable,
  NutritionalRequirementTable,
  SavedFormulationTable,
  UserIngredientPriceTable,
  // Financial
  CustomerTable,
  ExpenseTable,
  InvoiceItemTable,
  InvoiceTable,
  SaleTable,
  SupplierTable,
  // Monitoring
  AuditLogTable,
  CreditReportTable,
  GrowthStandardTable,
  MarketPriceTable,
  NotificationTable,
  ReportAccessLogTable,
  ReportConfigTable,
  ReportRequestTable,
  TaskCompletionTable,
  TaskTable,
  // Digital Foreman
  FarmGeofenceTable,
  ModulePermission,
  PayrollPeriodTable,
  TaskAssignmentTable,
  TaskPhotoTable,
  WagePaymentTable,
  WorkerCheckInTable,
  WorkerProfileTable,
  // Sensors
  SensorAggregateTable,
  SensorAlertConfigTable,
  SensorAlertTable,
  SensorAlertType,
  SensorReadingTable,
  SensorTable,
  SensorThresholds,
  SensorTrendConfig,
  SensorType,
  // Marketplace
  ContactRequestStatus,
  FuzzingLevel,
  ListingContactRequestTable,
  ListingStatus,
  ListingViewTable,
  MarketplaceLivestockType,
  MarketplaceListingTable,
  // Extension Worker
  AccessGrantTable,
  AccessRequestTable,
  CountryTable,
  OutbreakAlertFarmTable,
  OutbreakAlertTable,
  RegionTable,
  SpeciesThresholdTable,
  UserDistrictTable,
  VisitRecordTable,
} from './types/index'

/**
 * Database schema interface for Kysely ORM.
 * Defines all tables and their structures for the LivestockAI platform.
 *
 * Note: Column names use camelCase to match Better Auth expectations.
 */
export interface Database {
  // ============================================
  // Auth & User Management
  // ============================================
  /** System users and their core profile data */
  users: UserTable
  /** User-specific preferences for currency, units, etc. */
  user_settings: UserSettingsTable
  /** Authentication sessions */
  sessions: SessionTable
  /** OAuth and credential account links */
  account: AccountTable
  /** Email and phone verification tokens */
  verification: VerificationTable

  // ============================================
  // Farm Management
  // ============================================
  /** Farm definitions */
  farms: FarmTable
  /** Enabled modules for each farm */
  farm_modules: FarmModuleTable
  /** Junction table linking users to farms with roles */
  user_farms: UserFarmTable
  /** Farm structures (houses, ponds, etc.) */
  structures: StructureTable

  // ============================================
  // Livestock & Breeds
  // ============================================
  /** Livestock breeds reference data */
  breeds: BreedTable
  /** User requests for missing breeds */
  breed_requests: BreedRequestTable
  /** Livestock batch definitions */
  batches: BatchTable
  /** Records of egg collection and sales */
  egg_records: EggTable
  /** Periodic weight sampling records */
  weight_samples: WeightTable

  // ============================================
  // Health & Medical
  // ============================================
  /** Records of livestock mortality events */
  mortality_records: MortalityTable
  /** Vaccination schedule and records */
  vaccinations: VaccinationTable
  /** Medical treatment records */
  treatments: TreatmentTable
  /** Water parameters (pH, temperature, DO) */
  water_quality: WaterQualityTable

  // ============================================
  // Feed & Inventory
  // ============================================
  /** Records of feeding events */
  feed_records: FeedTable
  /** Feed inventory tracking */
  feed_inventory: FeedInventoryTable
  /** Medication inventory tracking */
  medication_inventory: MedicationInventoryTable
  /** Feed ingredients master data */
  feed_ingredients: FeedIngredientTable
  /** Nutritional requirements by species and stage */
  nutritional_requirements: NutritionalRequirementTable
  /** User-specific ingredient prices with history */
  user_ingredient_prices: UserIngredientPriceTable
  /** Saved feed formulations */
  saved_formulations: SavedFormulationTable
  /** Formulation usage tracking */
  formulation_usage: FormulationUsageTable

  // ============================================
  // Financial & Sales
  // ============================================
  /** Sales transactions */
  sales: SaleTable
  /** Farm expenses */
  expenses: ExpenseTable
  /** Customer contacts */
  customers: CustomerTable
  /** Supplier contacts */
  suppliers: SupplierTable
  /** Sales invoices */
  invoices: InvoiceTable
  /** Invoice line items */
  invoice_items: InvoiceItemTable

  // ============================================
  // Monitoring & Reports
  // ============================================
  /** System audit logs */
  audit_logs: AuditLogTable
  /** Expected growth standards by species */
  growth_standards: GrowthStandardTable
  /** Current market prices by species */
  market_prices: MarketPriceTable
  /** User notifications */
  notifications: NotificationTable
  /** Farm tasks (checklists) */
  tasks: TaskTable
  /** Task completion records */
  task_completions: TaskCompletionTable
  /** Saved report configurations */
  report_configs: ReportConfigTable
  /** Credit reports for farmers */
  credit_reports: CreditReportTable
  /** Report access requests */
  report_requests: ReportRequestTable
  /** Report access audit logs */
  report_access_logs: ReportAccessLogTable

  // ============================================
  // Digital Foreman
  // ============================================
  /** Worker employment profiles */
  worker_profiles: WorkerProfileTable
  /** Farm geofence configurations */
  farm_geofences: FarmGeofenceTable
  /** Worker attendance check-ins */
  worker_check_ins: WorkerCheckInTable
  /** Task assignments to workers */
  task_assignments: TaskAssignmentTable
  /** Photo proof for task completions */
  task_photos: TaskPhotoTable
  /** Payroll period definitions */
  payroll_periods: PayrollPeriodTable
  /** Wage payment records */
  wage_payments: WagePaymentTable

  // ============================================
  // IoT Sensors
  // ============================================
  /** IoT sensors for environmental monitoring */
  sensors: SensorTable
  /** Time-series sensor readings */
  sensor_readings: SensorReadingTable
  /** Aggregated sensor data (hourly/daily) */
  sensor_aggregates: SensorAggregateTable
  /** Sensor alert history */
  sensor_alerts: SensorAlertTable
  /** Per-sensor alert configuration */
  sensor_alert_config: SensorAlertConfigTable

  // ============================================
  // Offline Marketplace
  // ============================================
  /** Marketplace listings for livestock sales */
  marketplace_listings: MarketplaceListingTable
  /** Contact requests from buyers to sellers */
  listing_contact_requests: ListingContactRequestTable
  /** Listing view tracking for analytics */
  listing_views: ListingViewTable

  // ============================================
  // Extension Worker Mode
  // ============================================
  /** Countries with ISO codes */
  countries: CountryTable
  /** Geographic regions (State/Province -> District) */
  regions: RegionTable
  /** Extension worker district assignments */
  user_districts: UserDistrictTable
  /** Access requests from extension workers */
  access_requests: AccessRequestTable
  /** Time-limited access grants */
  access_grants: AccessGrantTable
  /** Species-specific mortality thresholds */
  species_thresholds: SpeciesThresholdTable
  /** Extension worker visit records */
  visit_records: VisitRecordTable
  /** Outbreak alerts for disease monitoring */
  outbreak_alerts: OutbreakAlertTable
  /** Junction table for farms affected by outbreak alerts */
  outbreak_alert_farms: OutbreakAlertFarmTable
}
