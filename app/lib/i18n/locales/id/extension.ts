export const extension = {
  title: 'Mode Pekerja Penyuluhan',

  // Toast messages
  messages: {
    userAssigned: 'Pengguna ditugaskan ke distrik',
    selectBothFields: 'Silakan pilih pengguna dan distrik',
    userRemoved: 'Pengguna dihapus dari distrik',
    supervisorUpdated: 'Status supervisor diperbarui',
    accessApproved: 'Akses Disetujui',
    accessApprovedDesc:
      'Pekerja penyuluhan sekarang dapat mengakses data peternakan Anda.',
    accessDenied: 'Akses Ditolak',
    accessDeniedDesc: 'Permintaan akses telah ditolak.',
    accessRevoked: 'Akses Dicabut',
    accessRevokedDesc:
      'Pekerja penyuluhan tidak lagi memiliki akses ke peternakan Anda.',
    approveAccessFailed: 'Gagal menyetujui permintaan akses',
    denyAccessFailed: 'Gagal menolak permintaan akses',
    revokeAccessFailed: 'Gagal mencabut akses',
    error: 'Kesalahan',
  },

  // UI labels
  totalFarms: 'Total Peternakan',
  lastVisit: 'Kunjungan Terakhir:',
  noFarmsAffected: 'Tidak ada peternakan yang terpengaruh',
  noAssignments: 'Tidak ada penugasan ditemukan',
  cannotDeactivate: 'Tidak dapat menonaktifkan',
  regionHasFarms: 'Wilayah ini memiliki {{count}} peternakan yang ditugaskan.',

  // Placeholders
  placeholders: {
    selectUser: 'Pilih pengguna',
    selectDistrict: 'Pilih distrik',
    selectCountry: 'Pilih negara',
    selectParentRegion: 'Pilih wilayah induk',
    globalDefault: 'Default global (tanpa wilayah)',
    alertNotes: 'Tambahkan catatan tentang peringatan ini...',
    denyReason: 'misalnya, Tidak diotorisasi oleh manajemen peternakan',
    revokeReason: 'misalnya, Akses tidak lagi diperlukan',
  },
  toggleSupervisor: 'Ubah status supervisor',
  removeFromDistrict: 'Hapus dari distrik',
}
