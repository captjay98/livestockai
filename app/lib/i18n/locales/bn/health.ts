export const mortality = {
  title: 'মৃত্যুহার রেকর্ড',
  description:
    'ঝাঁকের স্বাস্থ্য পর্যবেক্ষণ এবং প্রাথমিক সমস্যা শনাক্ত করতে মৃত্যু রেকর্ড করুন।',
  recordLoss: 'ক্ষতি রেকর্ড',
  recordLossTitle: 'মৃত্যু রেকর্ড করুন',
  allCauses: 'সব কারণ',
  emptyTitle: 'কোন মৃত্যু রেকর্ড নেই',
  emptyDescription: 'আশা করি শীঘ্রই আপনার কোনো যোগ করার প্রয়োজন হবে না।',
  recorded: 'মৃত্যু রেকর্ড করা হয়েছে',
  cause: 'কারণ',
  selectCause: 'কারণ নির্বাচন করুন',
  totalDeaths: 'মোট মৃত্যু',
  healthAlerts: 'স্বাস্থ্য সতর্কতা',
  totalAlerts: '{{count}} মোট সতর্কতা',
  recordedIncidents: 'রেকর্ডকৃত ঘটনা',
  causes: {
    disease: 'রোগ',
    predator: 'শিকারী আক্রমণ',
    weather: 'আবহাওয়া/পরিবেশ',
    unknown: 'অজানা',
    other: 'অন্যান্য',
  },
  error: {
    record: 'মৃত্যু রেকর্ড করতে ব্যর্থ',
  },
  notesPlaceholder: 'উপসর্গ বা ঘটনার বিবরণ দিন...',
  records: 'মৃত্যু রেকর্ড',
}

export const vaccinations = {
  title: 'স্বাস্থ্য রেকর্ড',
  description: 'আপনার গবাদি পশুর ব্যাচের জন্য টিকা এবং চিকিৎসা ট্র্যাক করুন।',
  actions: {
    vaccinate: 'টিকা রেকর্ড',
    treat: 'চিকিৎসা রেকর্ড',
  },
  tabs: {
    all: 'সব রেকর্ড',
    vaccinations: 'টিকা',
    treatments: 'চিকিৎসা',
  },
  labels: {
    batch: 'ব্যাচ',
    vaccineName: 'টিকার নাম',
    medicationName: 'ওষুধের নাম',
    date: 'তারিখ',
    dosage: 'ডোজ',
    reason: 'চিকিৎসার কারণ',
    withdrawal: 'প্রত্যাহার সময়কাল (দিন)',
    nextDueDate: 'পরবর্তী তারিখ',
    notes: 'নোট',
  },
  placeholders: {
    search: 'নাম বা ব্যাচ দ্বারা অনুসন্ধান...',
    dosage: 'যেমন 10ml',
    reason: 'যেমন Coccidiosis',
  },
  columns: {
    date: 'তারিখ',
    type: 'টাইপ',
    name: 'নাম',
    batch: 'ব্যাচ',
    details: 'বিবরণ',
  },
  types: {
    prevention: 'প্রতিরোধ',
    treatment: 'চিকিৎসা',
  },
  details: {
    next: 'পরবর্তী',
    for: 'জন্য',
    withdrawalSuffix: ' দিন প্রত্যাহার',
  },
  alerts: {
    overdue: 'মেয়াদোত্তীর্ণ টিকা',
    upcoming: 'আসন্ন টিকা',
  },
  dialog: {
    vaccinationTitle: 'টিকা রেকর্ড',
    treatmentTitle: 'চিকিৎসা রেকর্ড',
  },
  messages: {
    vaccinationRecorded: 'টিকা সফলভাবে রেকর্ড করা হয়েছে',
    treatmentRecorded: 'চিকিৎসা সফলভাবে রেকর্ড করা হয়েছে',
    updated: 'স্বাস্থ্য রেকর্ড সফলভাবে আপডেট করা হয়েছে',
    deleted: 'স্বাস্থ্য রেকর্ড সফলভাবে মুছে ফেলা হয়েছে',
  },
  empty: {
    title: 'কোন স্বাস্থ্য রেকর্ড নেই',
    description: 'আপনার ঝাঁকের জন্য টিকা এবং চিকিৎসা ট্র্যাক করা শুরু করুন।',
  },
}

export const weight = {
  title: 'ওজন নমুনা',
  description: 'পর্যায়ক্রমিক ওজন নমুনা রেকর্ড করে বৃদ্ধি ট্র্যাক করুন।',
  addSample: 'নমুনা যোগ করুন',
  addSampleTitle: 'ওজন নমুনা রেকর্ড করুন',
  editSampleTitle: 'ওজন নমুনা সম্পাদনা',
  deleteSampleTitle: 'ওজন নমুনা মুছুন',
  deleteConfirmation: 'আপনি কি নিশ্চিত যে আপনি এই ওজন নমুনা মুছতে চান?',
  saveSample: 'নমুনা সংরক্ষণ',
  growthAlerts: 'বৃদ্ধি সতর্কতা',
  animalsCount: '{{count}} প্রাণী',
  avgWeight: 'গড় ওজন',
  sampleSize: 'নমুনার আকার',
  recorded: 'ওজন নমুনা রেকর্ড করা হয়েছে',
  emptyTitle: 'কোন ওজন নমুনা নেই',
  emptyDescription: 'নিয়মিত আপনার গবাদি পশুর ওজন ট্র্যাক করুন।',
  error: {
    record: 'নমুনা সংরক্ষণ করতে ব্যর্থ',
  },
}

export const waterQuality = {
  title: 'পানির গুণমান',
  description:
    'মাছের সর্বোত্তম স্বাস্থ্যের জন্য পুকুরের অবস্থা (pH, তাপমাত্রা, অক্সিজেন) পর্যবেক্ষণ করুন।',
  addRecord: 'রেকর্ড যোগ করুন',
  addRecordTitle: 'পানির গুণমান রেকর্ড করুন',
  editRecordTitle: 'পানির গুণমান রেকর্ড সম্পাদনা',
  deleteRecordTitle: 'পানির গুণমান রেকর্ড মুছুন',
  deleteConfirmation:
    'আপনি কি নিশ্চিত যে আপনি এই পানির গুণমান রেকর্ড মুছতে চান?',
  saveRecord: 'রেকর্ড সংরক্ষণ',
  qualityAlerts: 'গুণমান সতর্কতা',
  selectFishBatch: 'মাছের ব্যাচ নির্বাচন করুন',
  recorded: 'পানির গুণমান রেকর্ড করা হয়েছে',
  temp: 'তাপমাত্রা ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'অ্যামোনিয়া',
  emptyTitle: 'কোন পানির গুণমান রেকর্ড নেই',
  emptyDescription: 'নিয়মিত আপনার পানির পরামিতি পর্যবেক্ষণ করুন।',
  error: {
    record: 'রেকর্ড সংরক্ষণ করতে ব্যর্থ',
  },
  labels: {
    ph: 'pH',
    temperature: 'তাপমাত্রা',
    dissolvedOxygen: 'দ্রবীভূত অক্সিজেন (mg/L)',
    ammonia: 'অ্যামোনিয়া (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
