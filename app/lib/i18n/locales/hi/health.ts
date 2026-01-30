export const mortality = {
  title: 'मृत्यु रिकॉर्ड',
  description:
    'स्वास्थ्य की निगरानी और समस्याओं का जल्दी पता लगाने के लिए मृत्यु दर रिकॉर्ड करें।',
  recordLoss: 'नुकसान रिकॉर्ड करें',
  recordLossTitle: 'मृत्यु रिकॉर्ड करें',
  allCauses: 'सभी कारण',
  emptyTitle: 'कोई मृत्यु रिकॉर्ड नहीं',
  emptyDescription:
    'उम्मीद है कि आपको जल्द ही कोई रिकॉर्ड जोड़ने की आवश्यकता नहीं होगी।',
  recorded: 'मृत्यु दर रिकॉर्ड की गई',
  cause: 'कारण',
  selectCause: 'कारण चुनें',
  totalDeaths: 'कुल मौतें',
  healthAlerts: 'स्वास्थ्य अलर्ट',
  totalAlerts: '{{count}} कुल अलर्ट',
  recordedIncidents: 'रिकॉर्ड की गई घटनाएं',
  causes: {
    disease: 'बीमारी',
    predator: 'शिकारी',
    weather: 'मौसम/पर्यावरण',
    unknown: 'अनजान',
    other: 'अन्य',
  },
  error: {
    record: 'रिकॉर्ड करने में विफल',
  },
  notesPlaceholder: 'लक्षण या घटना का वर्णन करें...',
  records: 'मृत्यु रिकॉर्ड',
}

export const vaccinations = {
  title: 'स्वास्थ्य रिकॉर्ड',
  description: 'अपने बैचों के लिए टीकाकरण और उपचार को ट्रैक करें।',
  actions: {
    vaccinate: 'टीकाकरण रिकॉर्ड करें',
    treat: 'उपचार रिकॉर्ड करें',
  },
  tabs: {
    all: 'सभी रिकॉर्ड',
    vaccinations: 'टीकाकरण',
    treatments: 'उपचार',
  },
  labels: {
    batch: 'बैच',
    vaccineName: 'टीके का नाम',
    medicationName: 'दवा का नाम',
    date: 'तारीख',
    dosage: 'खुराक',
    reason: 'उपचार का कारण',
    withdrawal: 'निकासी की अवधि (दिन)',
    nextDueDate: 'अगली देय तिथि',
    notes: 'नोट्स',
  },
  placeholders: {
    search: 'नाम या बैच द्वारा खोजें...',
    dosage: 'उदहारण: 10ml',
    reason: 'उदहारण: Coccidiosis',
  },
  columns: {
    date: 'तारीख',
    type: 'प्रकार',
    name: 'नाम',
    batch: 'बैच',
    details: 'विवरण',
  },
  types: {
    prevention: 'रोकथाम',
    treatment: 'उपचार',
  },
  details: {
    next: 'अगला',
    for: 'के लिए',
    withdrawalSuffix: ' दिन निकासी',
  },
  alerts: {
    overdue: 'अतिदेय टीकाकरण',
    upcoming: 'आगामी टीकाकरण',
  },
  dialog: {
    vaccinationTitle: 'टीकाकरण रिकॉर्ड करें',
    treatmentTitle: 'उपचार रिकॉर्ड करें',
  },
  messages: {
    vaccinationRecorded: 'टीकाकरण रिकॉर्ड किया गया',
    treatmentRecorded: 'उपचार रिकॉर्ड किया गया',
    updated: 'स्वास्थ्य रिकॉर्ड अपडेट किया गया',
    deleted: 'स्वास्थ्य रिकॉर्ड हटाया गया',
  },
  empty: {
    title: 'कोई स्वास्थ्य रिकॉर्ड नहीं',
    description: 'टीकाकरण और उपचार को ट्रैक करना शुरू करें।',
  },
}

export const weight = {
  title: 'वजन नमूनाकरण',
  description: 'समय-समय पर वजन के नमूने रिकॉर्ड करके विकास को ट्रैक करें।',
  addSample: 'नमूना जोड़ें',
  addSampleTitle: 'वजन नमूना रिकॉर्ड करें',
  editSampleTitle: 'वजन नमूना संपादित करें',
  deleteSampleTitle: 'वजन नमूना हटाएं',
  deleteConfirmation: 'क्या आप वाकई इस नमूने को हटाना चाहते हैं?',
  saveSample: 'नमूना सहेजें',
  growthAlerts: 'विकास अलर्ट',
  animalsCount: '{{count}} जानवर',
  avgWeight: 'औसत वजन',
  sampleSize: 'नमूना आकार',
  recorded: 'वजन नमूना रिकॉर्ड किया गया',
  emptyTitle: 'कोई वजन नमूना नहीं',
  emptyDescription: 'अपने पशुओं के विकास को नियमित रूप से ट्रैक करें।',
  error: {
    record: 'नमूना सहेजने में विफल',
  },
}

export const waterQuality = {
  title: 'पानी की गुणवत्ता',
  description:
    'इष्टतम मछली स्वास्थ्य के लिए तालाब की स्थिति (pH, तापमान, ऑक्सीजन) की निगरानी करें।',
  addRecord: 'रिकॉर्ड जोड़ें',
  addRecordTitle: 'पानी की गुणवत्ता रिकॉर्ड करें',
  editRecordTitle: 'पानी की गुणवत्ता रिकॉर्ड संपादित करें',
  deleteRecordTitle: 'पानी की गुणवत्ता रिकॉर्ड हटाएं',
  deleteConfirmation: 'क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?',
  saveRecord: 'रिकॉर्ड सहेजें',
  qualityAlerts: 'गुणवत्ता अलर्ट',
  selectFishBatch: 'मछली बैच चुनें',
  recorded: 'पानी की गुणवत्ता रिकॉर्ड की गई',
  temp: 'तापमान ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'अमोनिया',
  emptyTitle: 'कोई गुणवत्ता रिकॉर्ड नहीं',
  emptyDescription: 'अपने पानी के मानकों की नियमित निगरानी करें।',
  error: {
    record: 'रिकॉर्ड सहेजने में विफल',
  },
  labels: {
    ph: 'pH',
    temperature: 'तापमान',
    dissolvedOxygen: 'घुलित ऑक्सीजन (mg/L)',
    ammonia: 'अमोनिया (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
