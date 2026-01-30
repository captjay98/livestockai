export const mortality = {
  title: 'Ölüm Kayıtları',
  description:
    'Sağlığı izlemek ve sorunları erken tespit etmek için ölümleri kaydedin.',
  recordLoss: 'Kayıp Kaydet',
  recordLossTitle: 'Ölüm Kaydet',
  allCauses: 'Tüm Sebepler',
  emptyTitle: 'Ölüm kaydı yok',
  emptyDescription: 'Umarız yakında eklemenize gerek kalmaz.',
  recorded: 'Ölüm kaydedildi',
  cause: 'Sebep',
  selectCause: 'Sebep seç',
  totalDeaths: 'Toplam Ölümler',
  healthAlerts: 'Sağlık Uyarıları',
  totalAlerts: 'Toplam {{count}} uyarı',
  recordedIncidents: 'Kaydedilen olaylar',
  causes: {
    disease: 'Hastalık',
    predator: 'Yırtıcı',
    weather: 'Hava/Çevre',
    unknown: 'Bilinmeyen',
    other: 'Diğer',
  },
  error: {
    record: 'Ölüm kaydı başarısız',
  },
  notesPlaceholder: 'Belirtileri veya olayı tanımlayın...',
  records: 'Ölüm Kayıtları',
}

export const vaccinations = {
  title: 'Sağlık Kayıtları',
  description: 'Hayvanlarınız için aşıları ve tedavileri takip edin.',
  actions: {
    vaccinate: 'Aşı Kaydet',
    treat: 'Tedavi Kaydet',
  },
  tabs: {
    all: 'Tüm Kayıtlar',
    vaccinations: 'Aşılar',
    treatments: 'Tedaviler',
  },
  labels: {
    batch: 'Parti',
    vaccineName: 'Aşı Adı',
    medicationName: 'İlaç Adı',
    date: 'Tarih',
    dosage: 'Dozaj',
    reason: 'Sebep',
    withdrawal: 'Arınma Süresi (gün)',
    nextDueDate: 'Sonraki Tarih',
    notes: 'Notlar',
  },
  placeholders: {
    search: 'İsim veya parti ile ara...',
    dosage: 'örn. 10ml',
    reason: 'örn. Koksidiyoz',
  },
  columns: {
    date: 'Tarih',
    type: 'Tür',
    name: 'İsim',
    batch: 'Parti',
    details: 'Detaylar',
  },
  types: {
    prevention: 'Önleme',
    treatment: 'Tedavi',
  },
  details: {
    next: 'Sonraki',
    for: 'İçin',
    withdrawalSuffix: ' gün arınma',
  },
  alerts: {
    overdue: 'Gecikmiş Aşılar',
    upcoming: 'Yaklaşan Aşılar',
  },
  dialog: {
    vaccinationTitle: 'Aşı Kaydet',
    treatmentTitle: 'Tedavi Kaydet',
  },
  messages: {
    vaccinationRecorded: 'Aşı kaydedildi',
    treatmentRecorded: 'Tedavi kaydedildi',
    updated: 'Sağlık kaydı güncellendi',
    deleted: 'Sağlık kaydı silindi',
  },
  empty: {
    title: 'Sağlık kaydı yok',
    description: 'Aşıları ve tedavileri takip etmeye başlayın.',
  },
}

export const weight = {
  title: 'Ağırlık Örneklemesi',
  description: 'Periyodik ağırlık örnekleri kaydederek büyümeyi takip edin.',
  addSample: 'Örnek Ekle',
  addSampleTitle: 'Ağırlık Örneği Kaydet',
  editSampleTitle: 'Ağırlık Örneğini Düzenle',
  deleteSampleTitle: 'Ağırlık Örneğini Sil',
  deleteConfirmation: 'Bu ağırlık örneğini silmek istediğinizden emin misiniz?',
  saveSample: 'Örneği Kaydet',
  growthAlerts: 'Büyüme Uyarıları',
  animalsCount: '{{count}} hayvan',
  avgWeight: 'Ortalama Ağırlık',
  sampleSize: 'Örnek Boyutu',
  recorded: 'Ağırlık örneği kaydedildi',
  emptyTitle: 'Ağırlık örneği yok',
  emptyDescription: 'Hayvanlarınızın büyümesini düzenli olarak takip edin.',
  error: {
    record: 'Örnek kaydı başarısız',
  },
}

export const waterQuality = {
  title: 'Su Kalitesi',
  description:
    'Optimum balık sağlığı için havuz koşullarını (pH, sıcaklık, oksijen) izleyin.',
  addRecord: 'Kayıt Ekle',
  addRecordTitle: 'Su Kalitesi Kaydet',
  editRecordTitle: 'Su Kalitesi Kaydını Düzenle',
  deleteRecordTitle: 'Su Kalitesi Kaydını Sil',
  deleteConfirmation:
    'Bu su kalitesi kaydını silmek istediğinizden emin misiniz?',
  saveRecord: 'Kaydı Kaydet',
  qualityAlerts: 'Kalite Uyarıları',
  selectFishBatch: 'Balık partisi seç',
  recorded: 'Su kalitesi kaydedildi',
  temp: 'Sıcaklık ({{label}})',
  do: 'Çözünmüş Oksijen (mg/L)',
  ammonia: 'Amonyak',
  emptyTitle: 'Su kalitesi kaydı yok',
  emptyDescription: 'Su parametrelerinizi düzenli olarak izleyin.',
  error: {
    record: 'Kayıt başarısız',
  },
  labels: {
    ph: 'pH',
    temperature: 'Sıcaklık',
    dissolvedOxygen: 'Çözünmüş Oksijen (mg/L)',
    ammonia: 'Amonyak (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
