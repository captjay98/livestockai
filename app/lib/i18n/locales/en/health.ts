export const mortality = {
  title: 'Mortality Records',
  description:
    'Record deaths to monitor flock health and identify potential issues early.',
  recordLoss: 'Record Loss',
  recordLossTitle: 'Record Mortality',
  allCauses: 'All Causes',
  emptyTitle: 'No mortality records',
  emptyDescription: "Hopefully you don't need to add any soon.",
  recorded: 'Mortality recorded',
  cause: 'Cause',
  selectCause: 'Select cause',
  totalDeaths: 'Total Deaths',
  healthAlerts: 'Health Alerts',
  totalAlerts: '{{count}} total alerts',
  recordedIncidents: 'Recorded incidents',
  causes: {
    disease: 'Disease',
    predator: 'Predator Attack',
    weather: 'Weather/Environment',
    unknown: 'Unknown',
    other: 'Other',
  },
  error: {
    record: 'Failed to record mortality',
  },
  notesPlaceholder: 'Describe symptoms or incident...',
  records: 'Mortality Records',
}

export const vaccinations = {
  title: 'Health Records',
  description: 'Track vaccinations and treatments for your livestock batches.',
  actions: {
    vaccinate: 'Record Vaccination',
    treat: 'Record Treatment',
  },
  tabs: {
    all: 'All Records',
    vaccinations: 'Vaccinations',
    treatments: 'Treatments',
  },
  labels: {
    batch: 'Batch',
    vaccineName: 'Vaccine Name',
    medicationName: 'Medication Name',
    date: 'Date',
    dosage: 'Dosage',
    reason: 'Reason for Treatment',
    withdrawal: 'Withdrawal Period (days)',
    nextDueDate: 'Next Due Date',
    notes: 'Notes',
  },
  placeholders: {
    search: 'Search by name or batch...',
    dosage: 'e.g. 10ml',
    reason: 'e.g. Coccidiosis',
  },
  columns: {
    date: 'Date',
    type: 'Type',
    name: 'Name',
    batch: 'Batch',
    details: 'Details',
  },
  types: {
    prevention: 'Prevention',
    treatment: 'Treatment',
  },
  details: {
    next: 'Next due',
    for: 'For',
    withdrawalSuffix: ' day withdrawal',
  },
  alerts: {
    overdue: 'Overdue Vaccinations',
    upcoming: 'Upcoming Vaccinations',
  },
  dialog: {
    vaccinationTitle: 'Record Vaccination',
    treatmentTitle: 'Record Medical Treatment',
  },
  messages: {
    vaccinationRecorded: 'Vaccination recorded successfully',
    treatmentRecorded: 'Treatment recorded successfully',
    updated: 'Health record updated successfully',
    deleted: 'Health record deleted successfully',
  },
  empty: {
    title: 'No health records',
    description: 'Start tracking vaccinations and treatments for your flocks.',
  },
}

export const weight = {
  title: 'Weight Samples',
  description:
    'Track growth by recording periodic weight samples. Compare against industry standards.',
  addSample: 'Add Sample',
  addSampleTitle: 'Record Weight Sample',
  editSampleTitle: 'Edit Weight Sample',
  deleteSampleTitle: 'Delete Weight Sample',
  deleteConfirmation: 'Are you sure you want to delete this weight sample?',
  saveSample: 'Save Sample',
  growthAlerts: 'Growth Alerts',
  animalsCount: '{{count}} animals',
  avgWeight: 'Avg Weight',
  sampleSize: 'Sample Size',
  recorded: 'Weight sample recorded',
  emptyTitle: 'No weight samples',
  emptyDescription: 'Track the weight of your livestock regularly.',
  error: {
    record: 'Failed to save sample',
  },
}

export const waterQuality = {
  title: 'Water Quality',
  description:
    'Monitor pond conditions (pH, temperature, oxygen) to ensure optimal fish health.',
  addRecord: 'Add Record',
  addRecordTitle: 'Record Water Quality',
  editRecordTitle: 'Edit Water Quality Record',
  deleteRecordTitle: 'Delete Water Quality Record',
  deleteConfirmation:
    'Are you sure you want to delete this water quality record?',
  saveRecord: 'Save Record',
  qualityAlerts: 'Quality Alerts',
  selectFishBatch: 'Select fish batch',
  recorded: 'Water quality recorded',
  temp: 'Temp ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Ammonia',
  emptyTitle: 'No water quality records',
  emptyDescription: 'Monitor your water parameters regularly.',
  error: {
    record: 'Failed to save record',
  },
  labels: {
    ph: 'pH',
    temperature: 'Temperature',
    dissolvedOxygen: 'Dissolved Oxygen (mg/L)',
    ammonia: 'Ammonia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
