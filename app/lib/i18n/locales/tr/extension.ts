export const extension = {
  title: 'Yayım Çalışanı Modu',

  // Toast messages
  messages: {
    userAssigned: 'Kullanıcı bölgeye atandı',
    selectBothFields: 'Lütfen hem kullanıcıyı hem de bölgeyi seçin',
    userRemoved: 'Kullanıcı bölgeden çıkarıldı',
    supervisorUpdated: 'Süpervizör durumu güncellendi',
    accessApproved: 'Erişim Onaylandı',
    accessApprovedDesc: 'Yayım çalışanı artık çiftlik verilerinize erişebilir.',
    accessDenied: 'Erişim Reddedildi',
    accessDeniedDesc: 'Erişim isteği reddedildi.',
    accessRevoked: 'Erişim İptal Edildi',
    accessRevokedDesc: 'Yayım çalışanının artık çiftliğinize erişimi yok.',
    approveAccessFailed: 'Erişim isteği onaylanamadı',
    denyAccessFailed: 'Erişim isteği reddedilemedi',
    revokeAccessFailed: 'Erişim iptal edilemedi',
    error: 'Hata',
  },

  // UI labels
  totalFarms: 'Toplam Çiftlik',
  lastVisit: 'Son Ziyaret:',
  noFarmsAffected: 'Etkilenen çiftlik yok',
  noAssignments: 'Atama bulunamadı',
  cannotDeactivate: 'Devre dışı bırakılamaz',
  regionHasFarms: 'Bu bölgeye atanmış {{count}} çiftlik var.',

  // Placeholders
  placeholders: {
    selectUser: 'Kullanıcı seç',
    selectDistrict: 'Bölge seç',
    selectCountry: 'Ülke seç',
    selectParentRegion: 'Üst bölge seç',
    globalDefault: 'Küresel varsayılan (bölge yok)',
    alertNotes: 'Bu uyarı hakkında notlar ekleyin...',
    denyReason: 'örn. Çiftlik yönetimi tarafından yetkilendirilmedi',
    revokeReason: 'örn. Artık erişime gerek yok',
  },
  toggleSupervisor: 'Süpervizör durumunu değiştir',
  removeFromDistrict: 'Bölgeden çıkar',
}
