export const mortality = {
  title: 'Rekodi za Vifo',
  description: 'Rekodi vifo ili kufuatilia afya na kugundua matatizo mapema.',
  recordLoss: 'Rekodi Hasara',
  recordLossTitle: 'Rekodi Vifo',
  allCauses: 'Sababu Zote',
  emptyTitle: 'Hakuna rekodi za vifo',
  emptyDescription: 'Tunatumai hautahitaji kuongeza yoyote hivi karibuni.',
  recorded: 'Vifo vimerekodiwa',
  cause: 'Sababu',
  selectCause: 'Chagua sababu',
  totalDeaths: 'Jumla ya Vifo',
  healthAlerts: 'Arifa za Afya',
  totalAlerts: 'Arifa {{count}} jumla',
  recordedIncidents: 'Matukio yaliyorekodiwa',
  causes: {
    disease: 'Ugonjwa',
    predator: 'Mnyama hatari',
    weather: 'Hali ya hewa/Mazingira',
    unknown: 'Haijulikani',
    other: 'Nyingine',
  },
  error: {
    record: 'Imeshindwa kurekodi vifo',
  },
  notesPlaceholder: 'Elezea dalili au tukio...',
  records: 'Rekodi za Vifo',
}

export const vaccinations = {
  title: 'Rekodi za Afya',
  description: 'Fuatilia chanjo na dawa kwa mifugo yako.',
  actions: {
    vaccinate: 'Rekodi Chanjo',
    treat: 'Rekodi Matibabu',
  },
  tabs: {
    all: 'Rekodi Zote',
    vaccinations: 'Chanjo',
    treatments: 'Matibabu',
  },
  labels: {
    batch: 'Kundi',
    vaccineName: 'Jina la Chanjo',
    medicationName: 'Jina la Dawa',
    date: 'Tarehe',
    dosage: 'Kipimo',
    reason: 'Sababu ya Matibabu',
    withdrawal: 'Muda wa Kuacha (siku)',
    nextDueDate: 'Tarehe Ijayo',
    notes: 'Maelezo',
  },
  placeholders: {
    search: 'Tafuta kwa jina au kundi...',
    dosage: 'k.m 10ml',
    reason: 'k.m Coccidiosis',
  },
  columns: {
    date: 'Tarehe',
    type: 'Aina',
    name: 'Jina',
    batch: 'Kundi',
    details: 'Maelezo',
  },
  types: {
    prevention: 'Kinga',
    treatment: 'Matibabu',
  },
  details: {
    next: 'Ijayo',
    for: 'Kwa',
    withdrawalSuffix: ' siku za kuacha',
  },
  alerts: {
    overdue: 'Chanjo Zilizochelewa',
    upcoming: 'Chanjo Zijazo',
  },
  dialog: {
    vaccinationTitle: 'Rekodi Chanjo',
    treatmentTitle: 'Rekodi Matibabu',
  },
  messages: {
    vaccinationRecorded: 'Chanjo imerekodiwa',
    treatmentRecorded: 'Matibabu yamerekodiwa',
    updated: 'Rekodi ya afya imesasishwa',
    deleted: 'Rekodi ya afya imefutwa',
  },
  empty: {
    title: 'Hakuna rekodi za afya',
    description: 'Anza kufuatilia chanjo na dawa.',
  },
}

export const weight = {
  title: 'Sampuli za Uzito',
  description:
    'Fuatilia ukuaji kwa kurekodi sampuli za uzito mara kwa mara. Linganisha na viwango vya tasnia.',
  addSample: 'Ongeza Sampuli',
  addSampleTitle: 'Rekodi Sampuli ya Uzito',
  editSampleTitle: 'Hariri Sampuli ya Uzito',
  deleteSampleTitle: 'Futa Sampuli ya Uzito',
  deleteConfirmation: 'Je, una uhakika unataka kufuta sampuli hii ya uzito?',
  saveSample: 'Hifadhi Sampuli',
  growthAlerts: 'Arifa za Ukuaji',
  animalsCount: 'wanyama {{count}}',
  avgWeight: 'Wastani wa Uzito',
  sampleSize: 'Ukubwa wa Sampuli',
  recorded: 'Sampuli ya uzito imerekodiwa',
  emptyTitle: 'Hakuna sampuli za uzito',
  emptyDescription: 'Fuatilia ukuaji wa mifugo yako mara kwa mara.',
  error: {
    record: 'Imeshindwa kuhifadhi sampuli',
  },
}

export const waterQuality = {
  title: 'Ubora wa Maji',
  description:
    'Fuatilia hali ya bwawa (pH, joto, oksijeni) ili kuhakikisha afya bora ya samaki.',
  addRecord: 'Ongeza Rekodi',
  addRecordTitle: 'Rekodi Ubora wa Maji',
  editRecordTitle: 'Hariri Rekodi ya Ubora wa Maji',
  deleteRecordTitle: 'Futa Rekodi ya Ubora wa Maji',
  deleteConfirmation:
    'Je, una uhakika unataka kufuta rekodi hii ya ubora wa maji?',
  saveRecord: 'Hifadhi Rekodi',
  qualityAlerts: 'Arifa za Ubora',
  selectFishBatch: 'Chagua kundi la samaki',
  recorded: 'Ubora wa maji umerekodiwa',
  temp: 'Joto ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Amonia',
  emptyTitle: 'Hakuna rekodi za ubora wa maji',
  emptyDescription: 'Fuatilia vigezo vya maji yako mara kwa mara.',
  error: {
    record: 'Imeshindwa kuhifadhi rekodi',
  },
  labels: {
    ph: 'pH',
    temperature: 'Joto',
    dissolvedOxygen: 'Oksijeni Iliyoyeyuka (mg/L)',
    ammonia: 'Amonia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
