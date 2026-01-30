export const mortality = {
  title: 'Bayanan Mutuwa',
  description:
    'Yi rikodin mutuwa don lura da lafiyar garken da gano matsaloli da wuri.',
  recordLoss: 'Yi Rikodin Asara',
  recordLossTitle: 'Yi Rikodin Mutuwa',
  allCauses: 'Dukkan Dalilai',
  emptyTitle: 'Babu bayanan mutuwa',
  emptyDescription:
    'Muna fata ba za ku buƙaci ƙara kowa ba nan ba da jimawa ba.',
  recorded: 'An yi rikodin mutuwa',
  cause: 'Dalili',
  selectCause: 'Zaɓi dalili',
  totalDeaths: 'Jimlar Mutuwa',
  healthAlerts: 'Sanarwar Lafiya',
  totalAlerts: '{{count}} jimlar sanarwa',
  recordedIncidents: 'Abubuwan da aka rubuta',
  causes: {
    disease: 'Cuta',
    predator: 'Hari daga dabbobin daji',
    weather: 'Yanayi/Muhalli',
    unknown: 'Ba a sani ba',
    other: 'Sauran',
  },
  error: {
    record: 'An kasa yin rikodin mutuwa',
  },
  notesPlaceholder: 'Bayyana alamomi ko abin da ya faru...',
  records: 'Bayanan Mutuwa',
}

export const vaccinations = {
  title: 'Bayanan Lafiya',
  description: 'Bincika alluran rigakafi da magunguna don rukunin dabbobin ku.',
  actions: {
    vaccinate: 'Yi Rikodin Allurar Rigakafi',
    treat: 'Yi Rikodin Magani',
  },
  tabs: {
    all: 'Dukkan Bayanai',
    vaccinations: 'Alluran Rigakafi',
    treatments: 'Magunguna',
  },
  labels: {
    batch: 'Rukuni',
    vaccineName: 'Sunan Allurar',
    medicationName: 'Sunan Magani',
    date: 'Kwanan wata',
    dosage: 'Magani',
    reason: 'Dalilin Magani',
    withdrawal: 'Lokacin Janyewa (kwana)',
    nextDueDate: 'Ranar Karewa ta Gaba',
    notes: 'Bayanai',
  },
  placeholders: {
    search: 'Bincika ta suna ko rukuni...',
    dosage: 'misali 10ml',
    reason: 'misali Coccidiosis',
  },
  columns: {
    date: 'Kwanan wata',
    type: "Nau'i",
    name: 'Suna',
    batch: 'Rukuni',
    details: 'Bayanai',
  },
  types: {
    prevention: 'Kariya',
    treatment: 'Magani',
  },
  details: {
    next: 'Na gaba',
    for: 'Don',
    withdrawalSuffix: ' janyewar rana',
  },
  alerts: {
    overdue: 'Alluran da suka wuce lokaci',
    upcoming: 'Alluran masu zuwa',
  },
  dialog: {
    vaccinationTitle: 'Yi Rikodin Allurar Rigakafi',
    treatmentTitle: 'Yi Rikodin Magani',
  },
  messages: {
    vaccinationRecorded: 'An yi rikodin allura',
    treatmentRecorded: 'An yi rikodin magani',
    updated: 'An sabunta bayanan lafiya',
    deleted: 'An goge bayanan lafiya',
  },
  empty: {
    title: 'Babu bayanan lafiya',
    description: 'Fara bin diddigin alluran rigakafi da magunguna.',
  },
}

export const weight = {
  title: 'Samfurin Nauyi',
  description:
    "Bincika girma ta hanyar yin rikodin samfurin nauyi lokaci-lokaci. Kwatanta da ma'auni na masana'antu.",
  addSample: 'Ƙara Samfuri',
  addSampleTitle: 'Yi Rikodin Samfurin Nauyi',
  editSampleTitle: 'Gyara Samfurin Nauyi',
  deleteSampleTitle: 'Goge Samfurin Nauyi',
  deleteConfirmation: 'Kun tabbata kuna son goge wannan samfurin nauyi?',
  saveSample: 'Ajiye Samfuri',
  growthAlerts: 'Sanarwar Girma',
  animalsCount: '{{count}} dabbobi',
  avgWeight: 'Matsakaicin Nauyi',
  sampleSize: 'Girman Samfuri',
  recorded: 'An yi rikodin samfurin nauyi',
  emptyTitle: 'Babu samfurin nauyi',
  emptyDescription: 'Bincika nauyin dabbobin ku akai-akai.',
  error: {
    record: 'An kasa ajiye samfuri',
  },
}

export const waterQuality = {
  title: 'Ingancin Ruwa',
  description:
    'Lura da yanayin tafki (pH, zafin jiki, oxygen) don tabbatar da lafiyar kifi mai kyau.',
  addRecord: 'Ƙara Rikodi',
  addRecordTitle: 'Yi Rikodin Ingancin Ruwa',
  editRecordTitle: 'Gyara Rikodin Ingancin Ruwa',
  deleteRecordTitle: 'Goge Rikodin Ingancin Ruwa',
  deleteConfirmation: 'Kun tabbata kuna son goge wannan rikodin ingancin ruwa?',
  saveRecord: 'Ajiye Rikodi',
  qualityAlerts: 'Sanarwar Inganci',
  selectFishBatch: 'Zaɓi rukunin kifi',
  recorded: 'An yi rikodin ingancin ruwa',
  temp: 'Zafin ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Ammonia',
  emptyTitle: 'Babu bayanan ingancin ruwa',
  emptyDescription: "Lura da ma'aunin ruwan ku akai-akai.",
  error: {
    record: 'An kasa ajiye rikodi',
  },
  labels: {
    ph: 'pH',
    temperature: 'Zafin jiki',
    dissolvedOxygen: 'Oxygen da ya narke (mg/L)',
    ammonia: 'Ammonia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
