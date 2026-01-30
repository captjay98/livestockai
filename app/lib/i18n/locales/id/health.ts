export const mortality = {
  title: 'Catatan Mortalitas',
  description:
    'Catat kematian untuk memantau kesehatan kawanan dan identifikasi masalah sejak dini.',
  recordLoss: 'Catat Kematian',
  recordLossTitle: 'Catat Mortalitas',
  allCauses: 'Semua Penyebab',
  emptyTitle: 'Tidak ada catatan mortalitas',
  emptyDescription: 'Semoga Anda tidak perlu menambahkannya segera.',
  recorded: 'Mortalitas tercatat',
  cause: 'Penyebab',
  selectCause: 'Pilih penyebab',
  totalDeaths: 'Total Kematian',
  healthAlerts: 'Peringatan Kesehatan',
  totalAlerts: '{{count}} total peringatan',
  recordedIncidents: 'Insiden tercatat',
  causes: {
    disease: 'Penyakit',
    predator: 'Serangan Predator',
    weather: 'Cuaca/Lingkungan',
    unknown: 'Tidak Diketahui',
    other: 'Lainnya',
  },
  error: {
    record: 'Gagal mencatat mortalitas',
  },
  notesPlaceholder: 'Jelaskan gejala atau insiden...',
  records: 'Catatan Mortalitas',
}

export const vaccinations = {
  title: 'Catatan Kesehatan',
  description: 'Lacak vaksinasi dan perawatan untuk kumpulan ternak Anda.',
  actions: {
    vaccinate: 'Catat Vaksinasi',
    treat: 'Catat Pengobatan',
  },
  tabs: {
    all: 'Semua Catatan',
    vaccinations: 'Vaksinasi',
    treatments: 'Pengobatan',
  },
  labels: {
    batch: 'Kumpulan',
    vaccineName: 'Nama Vaksin',
    medicationName: 'Nama Obat',
    date: 'Tanggal',
    dosage: 'Dosis',
    reason: 'Alasan Pengobatan',
    withdrawal: 'Periode Henti Obat (hari)',
    nextDueDate: 'Tanggal Jatuh Tempo Berikutnya',
    notes: 'Catatan',
  },
  placeholders: {
    search: 'Cari berdasarkan nama atau kumpulan...',
    dosage: 'mis. 10ml',
    reason: 'mis. Koksidiosis',
  },
  columns: {
    date: 'Tanggal',
    type: 'Jenis',
    name: 'Nama',
    batch: 'Kumpulan',
    details: 'Detail',
  },
  types: {
    prevention: 'Pencegahan',
    treatment: 'Pengobatan',
  },
  details: {
    next: 'Jadwal berikutnya',
    for: 'Untuk',
    withdrawalSuffix: ' hari henti obat',
  },
  alerts: {
    overdue: 'Vaksinasi Terlewat',
    upcoming: 'Vaksinasi Mendatang',
  },
  dialog: {
    vaccinationTitle: 'Catat Vaksinasi',
    treatmentTitle: 'Catat Pengobatan Medis',
  },
  messages: {
    vaccinationRecorded: 'Vaksinasi berhasil dicatat',
    treatmentRecorded: 'Pengobatan berhasil dicatat',
    updated: 'Catatan kesehatan berhasil diperbarui',
    deleted: 'Catatan kesehatan berhasil dihapus',
  },
  empty: {
    title: 'Tidak ada catatan kesehatan',
    description: 'Mulai lacak vaksinasi dan pengobatan untuk kawanan Anda.',
  },
}

export const weight = {
  title: 'Sampel Berat',
  description: 'Lacak pertumbuhan dengan mencatat sampel berat secara berkala.',
  addSample: 'Tambah Sampel',
  addSampleTitle: 'Catat Sampel Berat',
  editSampleTitle: 'Edit Sampel Berat',
  deleteSampleTitle: 'Hapus Sampel Berat',
  deleteConfirmation: 'Apakah Anda yakin ingin menghapus sampel berat ini?',
  saveSample: 'Simpan Sampel',
  growthAlerts: 'Peringatan Pertumbuhan',
  animalsCount: '{{count}} hewan',
  avgWeight: 'Berat Rata-rata',
  sampleSize: 'Ukuran Sampel',
  recorded: 'Sampel berat dicatat',
  emptyTitle: 'Tidak ada sampel berat',
  emptyDescription: 'Lacak berat ternak Anda secara teratur.',
  error: {
    record: 'Gagal menyimpan sampel',
  },
}

export const waterQuality = {
  title: 'Kualitas Air',
  description:
    'Pantau kondisi kolam (pH, suhu, oksigen) untuk kesehatan ikan yang optimal.',
  addRecord: 'Tambah Catatan',
  addRecordTitle: 'Catat Kualitas Air',
  editRecordTitle: 'Edit Catatan Kualitas Air',
  deleteRecordTitle: 'Hapus Catatan Kualitas Air',
  deleteConfirmation:
    'Apakah Anda yakin ingin menghapus catatan kualitas air ini?',
  saveRecord: 'Simpan Catatan',
  qualityAlerts: 'Peringatan Kualitas',
  selectFishBatch: 'Pilih kumpulan ikan',
  recorded: 'Kualitas air dicatat',
  temp: 'Suhu ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Amonia',
  emptyTitle: 'Tidak ada catatan kualitas air',
  emptyDescription: 'Pantau parameter air Anda secara teratur.',
  error: {
    record: 'Gagal menyimpan catatan',
  },
  labels: {
    ph: 'pH',
    temperature: 'Suhu',
    dissolvedOxygen: 'Oksigen Terlarut (mg/L)',
    ammonia: 'Amonia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
