# Requirements Document

## Introduction

The Credit Passport is a comprehensive financial verification system that enables smallholder farmers to generate cryptographically verifiable reports for banks, governments, NGOs, and insurance companies. This feature addresses the critical problem of farmers being "unbankable" due to lack of verifiable records by providing institutional-grade documentation of farm operations, financial health, and production history.

The system generates three types of reports (Credit Assessment, Production Certificate, Impact Report) with digital signatures, QR code verification, and tamper detection. Third parties can request reports from farmers, who maintain full control over what data is shared. All reports are stored securely with PDF files in Cloudflare R2 and metadata in PostgreSQL.

## Glossary

- **Credit_Passport**: The overall system for generating verifiable financial reports for farmers
- **Credit_Report**: A generated report document containing farm metrics, signed and stored for verification
- **Report_Generator**: The service responsible for calculating metrics and generating PDF reports
- **Verification_Portal**: A public-facing page where third parties can verify report authenticity
- **Digital_Signature**: An Ed25519 cryptographic signature proving report authenticity
- **Report_Hash**: A SHA-256 hash of the report content used for tamper detection
- **QR_Code**: A scannable code embedded in PDFs linking to the verification portal
- **Report_Request**: A request from a third party to access a farmer's report
- **Metrics_Engine**: The service that calculates financial and operational metrics from farm data
- **FCR**: Feed Conversion Ratio - kilograms of feed per kilogram of weight gain
- **Performance_Index**: Ratio of actual performance to expected performance as a percentage
- **Data_Freshness**: An indicator showing how recent the underlying data is

## Requirements

### Requirement 1: Metrics Engine - Financial Health Calculation

**User Story:** As a farmer, I want my financial health metrics calculated accurately from my farm data, so that banks can assess my creditworthiness.

#### Acceptance Criteria

1. WHEN calculating financial metrics for a date range, THE Metrics_Engine SHALL compute total revenue from the sales table for all farms included in the report
2. WHEN calculating financial metrics, THE Metrics_Engine SHALL compute total expenses from the expenses table categorized by expense type
3. WHEN calculating profit margin, THE Metrics_Engine SHALL compute (revenue - expenses) / revenue \* 100 as a percentage
4. WHEN calculating cash flow trends, THE Metrics_Engine SHALL aggregate monthly revenue and expenses for the specified period
5. IF revenue is zero for the period, THEN THE Metrics_Engine SHALL return profit margin as zero without division error
6. THE Metrics_Engine SHALL calculate average monthly revenue as total revenue divided by number of months in the period

### Requirement 2: Metrics Engine - Operational Efficiency Calculation

**User Story:** As a farmer, I want my operational efficiency metrics calculated from production data, so that lenders can assess my farming competence.

#### Acceptance Criteria

1. WHEN calculating FCR for a batch, THE Metrics_Engine SHALL compute total feed consumed (kg) divided by total weight gain (kg)
2. WHEN calculating mortality rate for a batch, THE Metrics_Engine SHALL compute (initial quantity - current quantity) / initial quantity \* 100
3. WHEN calculating growth performance, THE Metrics_Engine SHALL compare actual weight samples against growth_standards for the species
4. WHEN a batch has no weight samples, THE Metrics_Engine SHALL estimate current weight from growth_standards based on batch age
5. THE Metrics_Engine SHALL aggregate operational metrics across all batches included in the report
6. IF a batch has zero weight gain, THEN THE Metrics_Engine SHALL return FCR as null with an appropriate indicator

### Requirement 3: Metrics Engine - Asset Summary Calculation

**User Story:** As a farmer, I want my asset summary calculated accurately, so that lenders can understand my farm's value.

#### Acceptance Criteria

1. THE Metrics_Engine SHALL count active batches grouped by livestock type for the asset summary
2. THE Metrics_Engine SHALL calculate current inventory value as sum of (current quantity \* estimated market price) for all active batches
3. WHEN market prices are unavailable, THE Metrics_Engine SHALL use the batch's target price per unit as fallback
4. THE Metrics_Engine SHALL include farm infrastructure count (structures) in the asset summary
5. THE Metrics_Engine SHALL calculate total livestock count across all active batches

### Requirement 4: Metrics Engine - Track Record Calculation

**User Story:** As a farmer, I want my farming track record documented, so that lenders can see my experience and consistency.

#### Acceptance Criteria

1. THE Metrics_Engine SHALL calculate months of operation from the earliest batch acquisition date to the report date
2. THE Metrics_Engine SHALL count total batches completed (status = 'sold' or 'depleted')
3. THE Metrics_Engine SHALL calculate total production volume as sum of initial quantities across all completed batches
4. THE Metrics_Engine SHALL calculate average batch success rate as percentage of batches reaching target weight
5. THE Metrics_Engine SHALL include count of unique customers served from the customers table

### Requirement 5: Credit Assessment Report Generation

**User Story:** As a farmer applying for a loan, I want to generate a Credit Assessment Report, so that banks can evaluate my repayment capacity.

#### Acceptance Criteria

1. WHEN generating a Credit Assessment Report, THE Report_Generator SHALL include financial health metrics (revenue, expenses, profit margin, cash flow)
2. WHEN generating a Credit Assessment Report, THE Report_Generator SHALL include operational efficiency metrics (FCR, mortality rate, growth performance)
3. WHEN generating a Credit Assessment Report, THE Report_Generator SHALL include asset summary (active batches, inventory value)
4. WHEN generating a Credit Assessment Report, THE Report_Generator SHALL include track record (months operating, batches completed)
5. THE Report_Generator SHALL calculate a Credit Score indicator based on weighted metrics (profit margin 30%, track record 25%, operational efficiency 25%, asset value 20%)
6. THE Report_Generator SHALL include repayment capacity estimate based on average monthly profit

### Requirement 6: Production Certificate Generation

**User Story:** As a farmer selling to buyers or applying for government programs, I want to generate a Production Certificate, so that I can prove my verified output.

#### Acceptance Criteria

1. WHEN generating a Production Certificate, THE Report_Generator SHALL include total production volume by livestock type for the period
2. WHEN generating a Production Certificate, THE Report_Generator SHALL include sales records with quantities, dates, and customer information
3. WHEN generating a Production Certificate, THE Report_Generator SHALL include batch completion records with species, quantities, and dates
4. THE Report_Generator SHALL include farm registration details (name, location, type)
5. THE Report_Generator SHALL include compliance indicators (vaccination records, mortality rates within acceptable limits)

### Requirement 7: Impact Report Generation

**User Story:** As a farmer participating in NGO programs, I want to generate an Impact Report, so that I can demonstrate livelihood improvement over time.

#### Acceptance Criteria

1. WHEN generating an Impact Report, THE Report_Generator SHALL compare metrics between two periods (baseline vs current)
2. THE Report_Generator SHALL calculate revenue growth percentage between periods
3. THE Report_Generator SHALL calculate production volume growth percentage between periods
4. THE Report_Generator SHALL calculate efficiency improvement (FCR reduction, mortality reduction) between periods
5. THE Report_Generator SHALL include livelihood indicators (number of batches, customer base growth)
6. THE Report_Generator SHALL include a narrative summary of improvements suitable for NGO reporting

### Requirement 8: Report Customization and Rate Limiting

**User Story:** As a farmer, I want to customize my reports, so that I can control what information is shared with different parties.

#### Acceptance Criteria

1. WHEN creating a report, THE System SHALL allow the farmer to select a date range (start date, end date)
2. WHEN creating a report, THE System SHALL allow the farmer to select which farms to include (if multiple farms exist)
3. WHEN creating a report, THE System SHALL allow the farmer to select which batches to include
4. WHEN creating a report, THE System SHALL allow the farmer to add custom notes or context
5. THE System SHALL validate that at least one farm and one batch are selected before generating
6. THE System SHALL store the report configuration for future reference
7. THE System SHALL enforce a rate limit of 10 report generations per user per hour
8. THE System SHALL enforce a rate limit of 100 report generations per farm per day
9. WHEN rate limit is exceeded, THE System SHALL return a 429 Too Many Requests error with retry-after header

### Requirement 9: Digital Signature and Verification

**User Story:** As a bank officer, I want to verify that a farmer's report is authentic and untampered, so that I can trust the data for lending decisions.

#### Acceptance Criteria

1. WHEN a report is generated, THE System SHALL create a SHA-256 hash of the report content
2. WHEN a report is generated, THE System SHALL sign the hash using Ed25519 with the server's private key
3. THE System SHALL embed the signature and report ID in the generated PDF
4. THE System SHALL generate a QR code containing the verification URL and embed it in the PDF
5. WHEN verifying a report, THE Verification_Portal SHALL compare the stored hash against a recalculated hash of the report
6. IF the hashes do not match, THEN THE Verification_Portal SHALL display a tamper warning
7. THE Verification_Portal SHALL display the signature verification status (valid/invalid)

### Requirement 10: Verification Portal

**User Story:** As a bank officer, I want to access a public verification portal, so that I can confirm report authenticity without needing an account.

#### Acceptance Criteria

1. THE Verification_Portal SHALL be accessible at a public route without authentication
2. WHEN a valid report ID is provided, THE Verification_Portal SHALL display report authenticity status
3. WHEN a valid report ID is provided, THE Verification_Portal SHALL display key metrics summary (not full report)
4. THE Verification_Portal SHALL display report generation date and expiration date
5. THE Verification_Portal SHALL display data freshness indicator (how recent the underlying data is)
6. IF the report has expired, THEN THE Verification_Portal SHALL display an expiration warning
7. IF the report ID is invalid, THEN THE Verification_Portal SHALL display a "Report not found" message
8. THE Verification_Portal SHALL display only PUBLIC metrics: credit score, grade, validity status, farm name, report type, and date range
9. THE Verification_Portal SHALL NOT display PRIVATE metrics: detailed financials (revenue, expenses, profit), customer names, supplier names, or batch-level details
10. THE Verification_Portal SHALL indicate that full report details are available only to the farmer and approved requesters

### Requirement 11: Report Expiration

**User Story:** As a bank officer, I want reports to have expiration dates, so that I know the data is current.

#### Acceptance Criteria

1. WHEN creating a report, THE System SHALL allow the farmer to select validity period (30, 60, or 90 days)
2. THE System SHALL calculate expiration date as generation date plus validity period
3. WHEN a report is accessed after expiration, THE System SHALL mark it as expired but still viewable
4. THE Verification_Portal SHALL prominently display days remaining until expiration
5. THE System SHALL send a notification to the farmer 7 days before report expiration

### Requirement 12: Third-Party Access Requests

**User Story:** As a farmer, I want to control who can request my reports, so that I maintain privacy over my financial data.

#### Acceptance Criteria

1. WHEN a third party requests a report, THE System SHALL create a report_request record with requester details
2. THE System SHALL send a notification to the farmer about the pending request
3. WHEN the farmer approves a request, THE System SHALL generate the report with the specified scope
4. WHEN the farmer denies a request, THE System SHALL notify the requester of the denial
5. THE System SHALL allow farmers to view all pending and historical requests
6. THE System SHALL log all request approvals and denials in the audit_logs table

### Requirement 13: PDF Generation

**User Story:** As a farmer, I want professional PDF reports, so that I can submit them to formal institutions.

#### Acceptance Criteria

1. THE PDF_Generator SHALL use @react-pdf/renderer for PDF creation
2. THE PDF_Generator SHALL include OpenLivestock branding (logo, colors) by default
3. WHERE white-label option is selected, THE PDF_Generator SHALL use neutral branding
4. THE PDF_Generator SHALL embed the QR code for verification on the first page
5. THE PDF_Generator SHALL include page numbers and generation timestamp on each page
6. THE PDF_Generator SHALL support multiple languages (English, French, Swahili, Hausa)
7. THE PDF_Generator SHALL format currency values according to the farmer's currency settings

### Requirement 14: Offline Report Generation

**User Story:** As a farmer in a rural area, I want to generate reports offline, so that I can prepare documents without internet access.

#### Acceptance Criteria

1. WHEN offline, THE System SHALL allow report generation using locally cached data
2. WHEN generating offline, THE System SHALL mark the report as "Pending Verification"
3. WHEN the device comes online, THE System SHALL automatically sign and verify pending reports
4. THE System SHALL store pending reports in IndexedDB until synchronized
5. THE Verification_Portal SHALL indicate if a report is pending verification
6. WHEN a pending report is verified, THE System SHALL update its status and notify the farmer

### Requirement 15: Report Storage

**User Story:** As a system administrator, I want reports stored securely and efficiently, so that they can be retrieved and verified reliably.

#### Acceptance Criteria

1. THE System SHALL store report metadata in the credit_reports PostgreSQL table
2. THE System SHALL store PDF files in Cloudflare R2 with the report ID as the key
3. THE System SHALL store the digital signature and hash in the credit_reports table
4. THE System SHALL implement soft delete for reports (deletedAt timestamp)
5. THE System SHALL retain report metadata for audit purposes even after PDF deletion
6. THE System SHALL log all report access in the report_access_logs table

### Requirement 16: Audit Trail

**User Story:** As a compliance officer, I want a complete audit trail of report activities, so that I can investigate any disputes.

#### Acceptance Criteria

1. WHEN a report is generated, THE System SHALL log the action in audit_logs with userId, reportId, and timestamp
2. WHEN a report is verified, THE System SHALL log the verification in report_access_logs with IP address and timestamp
3. WHEN a report request is approved or denied, THE System SHALL log the decision in audit_logs
4. THE System SHALL log all report downloads with user information (if authenticated) or IP address
5. THE audit_logs SHALL be immutable (no updates or deletes allowed)

### Requirement 17: Report Generation Wizard UI

**User Story:** As a farmer, I want a step-by-step wizard to generate reports, so that I can easily create professional documents.

#### Acceptance Criteria

1. THE Wizard SHALL guide the farmer through report type selection as the first step
2. THE Wizard SHALL allow date range selection with preset options (last 30/60/90 days, custom)
3. THE Wizard SHALL allow farm and batch selection with multi-select capability
4. THE Wizard SHALL show a preview of key metrics before final generation
5. THE Wizard SHALL display progress indicator during PDF generation
6. WHEN generation completes, THE Wizard SHALL offer download and share options
7. THE Wizard SHALL follow the "Rugged Utility" design with 48px+ touch targets

### Requirement 18: Report History and Management

**User Story:** As a farmer, I want to view and manage my generated reports, so that I can track what I've shared and with whom.

#### Acceptance Criteria

1. THE Report_History_Page SHALL display all generated reports with status, type, and date
2. THE Report_History_Page SHALL allow filtering by report type and status
3. THE Report_History_Page SHALL allow downloading previously generated PDFs
4. THE Report_History_Page SHALL show verification count for each report
5. THE Report_History_Page SHALL allow soft deletion of reports
6. THE Report_History_Page SHALL display pending access requests requiring action
