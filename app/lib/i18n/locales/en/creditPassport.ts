export const creditPassport = {
  title: 'Credit Passport',
  fullTitle: 'LivestockAI Credit Passport',

  // Toast messages
  messages: {
    csvDownloaded: 'CSV report downloaded successfully',
    generationFailed: 'Failed to generate report',
  },

  // Verification page
  verification: {
    failed: 'Verification Failed',
    freshnessLevel: 'Freshness Level',
    reportType: 'Report Type:',
    verificationCount: 'Verification Count:',
  },

  // Steps
  steps: {
    selectReportType: 'Select Report Type',
    selectDateRange: 'Select Date Range',
    selectBatches: 'Select Batches',
  },

  // Filters
  filters: {
    filterByType: 'Filter by type',
    filterByStatus: 'Filter by status',
    allTypes: 'All Types',
    allStatus: 'All Status',
  },

  // Placeholders
  placeholders: {
    reportNotes:
      'Add any additional context or specific requirements for this report...',
  },

  // Dialogs
  dialogs: {
    deleteReport: 'Delete Report',
    deleteReportDesc:
      'Are you sure you want to delete this report? This action cannot be undone. The report will no longer be accessible for verification.',
  },

  // Empty states
  empty: {
    total: 'No reports found',
    desc: 'Generate your first credit passport report to get started.',
  },
}
