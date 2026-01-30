export const mortality = {
  title: 'Ndekọ Ọnwụ',
  description: "Dekọọ ọnwụ iji sorogide ahụike igwe na ịchọpụta nsogbu n'oge.",
  recordLoss: 'Dekọọ Mfu',
  recordLossTitle: 'Dekọọ Ọnwụ',
  allCauses: 'Ihe Niile Na-akpata',
  emptyTitle: 'Enweghị ndekọ ọnwụ',
  emptyDescription:
    "Anyị na-atụ anya na ị gaghị achọ ịgbakwunye ọ bụla n'oge na-adịghị anya.",
  recorded: 'E dekọrọ ọnwụ',
  cause: 'Ihe kpatara',
  selectCause: 'Họrọ ihe kpatara',
  totalDeaths: 'Ngụkọta Ọnwụ',
  healthAlerts: 'Amụma Ahụike',
  totalAlerts: '{{count}} ngụkọta amụma',
  recordedIncidents: 'Ihe omume edere',
  causes: {
    disease: 'Ọrịa',
    predator: 'Anụ ọhịa',
    weather: 'Ihu igwe/Gburugburu',
    unknown: 'Amaghị',
    other: 'Ndị ọzọ',
  },
  error: {
    record: 'Kulee idekọ ọnwụ',
  },
  notesPlaceholder: 'Kọwaa mgbaàmà ma ọ bụ ihe merenụ...',
  records: 'Ndekọ Ọnwụ',
}

export const vaccinations = {
  title: 'Ndekọ Ahụike',
  description: 'Sorogide ịgba ọgwụ mgbochi na ọgwụgwọ maka ìgwè gị.',
  actions: {
    vaccinate: 'Dekọọ Ịgba Ọgwụ',
    treat: 'Dekọọ Ọgwụgwọ',
  },
  tabs: {
    all: 'Ndekọ Niile',
    vaccinations: 'Ịgba Ọgwụ',
    treatments: 'Ọgwụgwọ',
  },
  labels: {
    batch: 'Ìgwè',
    vaccineName: 'Aha Ọgwụ Mgbochi',
    medicationName: 'Aha Ọgwụ',
    date: 'Ụbọchị',
    dosage: 'Ọnụọgụ Ọgwụ',
    reason: 'Ihe kpatara Ọgwụgwọ',
    withdrawal: 'Oge Mwepụ (ụbọchị)',
    nextDueDate: 'Ụbọchị Ọzọ',
    notes: 'Ihe edeturu',
  },
  placeholders: {
    search: "Chọọ site n'aha ma ọ bụ ìgwè...",
    dosage: 'dịka 10ml',
    reason: 'dịka Coccidiosis',
  },
  columns: {
    date: 'Ụbọchị',
    type: 'Ụdị',
    name: 'Aha',
    batch: 'Ìgwè',
    details: 'Nkọwa',
  },
  types: {
    prevention: 'Mgbochi',
    treatment: 'Ọgwụgwọ',
  },
  details: {
    next: 'Ọzọ',
    for: 'Maka',
    withdrawalSuffix: ' ụbọchị mwepụ',
  },
  alerts: {
    overdue: 'Ọgwụ Mgbochi Oge Agara',
    upcoming: 'Ọgwụ Mgbochi Na-abịa',
  },
  dialog: {
    vaccinationTitle: 'Dekọọ Ịgba Ọgwụ',
    treatmentTitle: 'Dekọọ Ọgwụgwọ',
  },
  messages: {
    vaccinationRecorded: 'E dekọrọ ịgba ọgwụ',
    treatmentRecorded: 'E dekọrọ ọgwụgwọ',
    updated: 'Emelitere ndekọ ahụike',
    deleted: 'Ehichapụrụ ndekọ ahụike',
  },
  empty: {
    title: 'Enweghị ndekọ ahụike',
    description: 'Malite sorogide ịgba ọgwụ mgbochi na ọgwụgwọ.',
  },
}

export const weight = {
  title: 'Nlele Ibu',
  description:
    "Sorogide uto site n'idekọ nlele ibu oge ụfọdụ. Tụlee na ụkpụrụ ụlọ ọrụ.",
  addSample: 'Tinye Nlele',
  addSampleTitle: 'Dekọọ Nlele Ibu',
  editSampleTitle: 'Dezie Nlele Ibu',
  deleteSampleTitle: 'Hichapụ Nlele Ibu',
  deleteConfirmation: "Ì ji n'aka na ị chọrọ ihichapụ nlele ibu a?",
  saveSample: 'Chekwaa Nlele',
  growthAlerts: 'Amụma Uto',
  animalsCount: '{{count}} anụmanụ',
  avgWeight: 'Nkezi Ibu',
  sampleSize: 'Ogo Nlele',
  recorded: 'E dekọrọ nlele ibu',
  emptyTitle: 'Enweghị nlele ibu',
  emptyDescription: 'Sorogide ibu anụmanụ gị mgbe niile.',
  error: {
    record: 'Kulee ichekwa nlele',
  },
}

export const waterQuality = {
  title: 'Ogo Mmiri',
  description:
    'Nyochaa ọnọdụ ọdọ mmiri (pH, okpomọkụ, ikuku oxygen) iji hụ na ahụike azụ dị mma.',
  addRecord: 'Tinye Ndekọ',
  addRecordTitle: 'Dekọọ Ogo Mmiri',
  editRecordTitle: 'Dezie Ndekọ Ogo Mmiri',
  deleteRecordTitle: 'Hichapụ Ndekọ Ogo Mmiri',
  deleteConfirmation: "Ì ji n'aka na ị chọrọ ihichapụ ndekọ ogo mmiri a?",
  saveRecord: 'Chekwaa Ndekọ',
  qualityAlerts: 'Amụma Ogo',
  selectFishBatch: 'Họrọ ìgwè azụ',
  recorded: 'E dekọrọ ogo mmiri',
  temp: 'Okpomọkụ ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Ammonia',
  emptyTitle: 'Enweghị ndekọ ogo mmiri',
  emptyDescription: 'Nyochaa parampeta mmiri gị mgbe niile.',
  error: {
    record: 'Kulee ichekwa ndekọ',
  },
  labels: {
    ph: 'pH',
    temperature: 'Okpomọkụ',
    dissolvedOxygen: 'Ikuku Oxygen Gbazere (mg/L)',
    ammonia: 'Ammonia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
