export const mortality = {
  title: 'የሞት መዝገቦች',
  description: 'የመንጋውን ጤና ለመከታተል እና ችግሮችን በጊዜ ለመለየት ሞትን ይመዝግቡ።',
  recordLoss: 'ኪሳራ መዝግብ',
  recordLossTitle: 'ሞትን መዝግብ',
  allCauses: 'ሁሉም ምክንያቶች',
  emptyTitle: 'ምንም የሞት መዝገቦች የሉም',
  emptyDescription: 'ምንም እንደማይኖር ተስፋ እናደርጋለን።',
  recorded: 'ሞት ተመዝግቧል',
  cause: 'ምክንያት',
  selectCause: 'ምክንያት ይምረጡ',
  totalDeaths: 'ጠቅላላ ሞት',
  healthAlerts: 'የጤና ማስጠንቀቂያዎች',
  totalAlerts: '{{count}} ማስጠንቀቂያዎች',
  recordedIncidents: 'የተመዘገቡ',
  causes: {
    disease: 'በሽታ',
    predator: 'አዳኝ',
    weather: 'አየር ሁኔታ/አካባቢ',
    unknown: 'ያልታወቀ',
    other: 'ሌላ',
  },
  error: {
    record: 'ሞትን መመዝገብ አልተቻለም',
  },
  notesPlaceholder: 'ምልክቶችን ያስረዱ...',
  records: 'የሞት መዝገቦች',
}

export const vaccinations = {
  title: 'የጤና መዝገቦች',
  description: 'ለእርሻ እንስሳትዎ ክትባት እና ህክምና ይከታተሉ።',
  actions: {
    vaccinate: 'ክትባት መዝግብ',
    treat: 'ህክምና መዝግብ',
  },
  tabs: {
    all: 'ሁሉም መዝገቦች',
    vaccinations: 'ክትባቶች',
    treatments: 'ህክምናዎች',
  },
  labels: {
    batch: 'ባች',
    vaccineName: 'የክትባት ስም',
    medicationName: 'የመድሃኒት ስም',
    date: 'ቀን',
    dosage: 'መጠን',
    reason: 'የህክምናው ምክንያት',
    withdrawal: 'የመድሃኒት ቀሪ ጊዜ (ቀናት)',
    nextDueDate: 'የሚቀጥለው ቀን',
    notes: 'ማስታወሻዎች',
  },
  placeholders: {
    search: 'በስም ወይም ባች ይፈልጉ...',
    dosage: 'ምሳሌ 10ml',
    reason: 'ምሳሌ ኮሲዲዮሲስ',
  },
  columns: {
    date: 'ቀን',
    type: 'ዓይነት',
    name: 'ስም',
    batch: 'ባች',
    details: 'ዝርዝሮች',
  },
  types: {
    prevention: 'መከላከል',
    treatment: 'ህክምና',
  },
  details: {
    next: 'ቀጣይ',
    for: 'ለ',
    withdrawalSuffix: ' ቀናት ቀሪ',
  },
  alerts: {
    overdue: 'ያለፈባቸው ክትባቶች',
    upcoming: 'ቀጣይ ክትባቶች',
  },
  dialog: {
    vaccinationTitle: 'ክትባት መዝግብ',
    treatmentTitle: 'ህክምና መዝግብ',
  },
  messages: {
    vaccinationRecorded: 'ክትባት በተሳካ ሁኔታ ተመዝግቧል',
    treatmentRecorded: 'ህክምና በተሳካ ሁኔታ ተመዝግቧል',
    updated: 'የጤና መዝገብ በተሳካ ሁኔታ ዘምኗል',
    deleted: 'የጤና መዝገብ በተሳካ ሁኔታ ተሰርዟል',
  },
  empty: {
    title: 'ምንም የጤና መዝገቦች የሉም',
    description: 'የመንጋዎችዎን ክትባት እና ህክምና መከታተል ይጀምሩ።',
  },
}

export const weight = {
  title: 'የክብደት ናሙና',
  description: 'በየጊዜው የክብደት ናሙናዎችን በመውሰድ እድገትን ይከታተሉ።',
  addSample: 'ናሙና አክል',
  addSampleTitle: 'የክብደት ናሙና መዝግብ',
  editSampleTitle: 'የክብደት ናሙና አርትዕ',
  deleteSampleTitle: 'የክብደት ናሙና ሰርዝ',
  deleteConfirmation: 'ይህንን የክብደት ናሙና መሰረዝ ይፈልጋሉ?',
  saveSample: 'ናሙና አስቀምጥ',
  growthAlerts: 'የእድገት ማስጠንቀቂያዎች',
  animalsCount: '{{count}} እንስሳት',
  avgWeight: 'አማካይ ክብደት',
  sampleSize: 'የናሙና መጠን',
  recorded: 'የክብደት ናሙና ተመዝግቧል',
  emptyTitle: 'ምንም የክብደት ናሙናዎች የሉም',
  emptyDescription: 'የእንስሳትዎን ክብደት በመደበኛነት ይከታተሉ።',
  error: {
    record: 'ናሙና ማስቀመጥ አልተቻለም',
  },
}

export const waterQuality = {
  title: 'የውሃ ጥራት',
  description: 'ለዓሳዎች ምርጥ ጤና የኩሬ ሁኔታዎችን (pH፣ የሙቀት መጠን፣ ኦክስጅን) ይከታተሉ።',
  addRecord: 'መዝገብ አክል',
  addRecordTitle: 'የውሃ ጥራት መዝግብ',
  editRecordTitle: 'የውሃ ጥራት አርትዕ',
  deleteRecordTitle: 'የውሃ ጥራት ሰርዝ',
  deleteConfirmation: 'ይህንን የውሃ ጥራት መዝገብ መሰረዝ ይፈልጋሉ?',
  saveRecord: 'መዝገብ አስቀምጥ',
  qualityAlerts: 'የጥራት ማስጠንቀቂያዎች',
  selectFishBatch: 'የዓሳ ባች ይምረጡ',
  recorded: 'የውሃ ጥራት ተመዝግቧል',
  temp: 'የሙቀት መጠን ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'አሞኒያ',
  emptyTitle: 'ምንም የውሃ ጥራት መዝገቦች የሉም',
  emptyDescription: 'የውሃ ሁኔታዎችን በመደበኛነት ይቆጣጠሩ።',
  error: {
    record: 'መዝገብ ማስቀመጥ አልተቻለም',
  },
  labels: {
    ph: 'pH',
    temperature: 'የሙቀት መጠን',
    dissolvedOxygen: 'የተሟሟ ኦክስጅን (mg/L)',
    ammonia: 'አሞኒያ (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
