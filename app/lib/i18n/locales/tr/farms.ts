export const farms = {
  // Page headings
  title: 'Çiftliklerim',
  description: 'Hayvancılık çiftliklerinizi ve tesislerinizi yönetin',
  add: 'Çiftlik Ekle',
  create: 'Çiftlik Oluştur',
  createFirst: 'İlk Çiftliğinizi Oluşturun',
  createFarm: 'Çiftlik Oluştur',
  createNewFarm: 'Yeni Çiftlik Oluştur',
  editFarm: 'Çiftliği Düzenle',
  updateFarm: 'Çiftliği Güncelle',
  updated: 'Çiftlik güncellendi',
  created: 'Çiftlik oluşturuldu',

  // Form fields
  farmName: 'Çiftlik Adı',
  location: 'Konum',
  farmType: 'Ana Odak',
  namePlaceholder: 'Çiftlik adını girin',
  locationPlaceholder: 'Konum girin',
  createDescription: 'Hesabınıza yeni bir çiftlik ekleyin',
  editDescription: 'Çiftlik detaylarınızı güncelleyin',

  // Placeholders
  placeholders: {
    name: 'Çiftlik adını girin',
    location: 'Konum, şehir veya bölge girin',
  },

  // Error messages
  error: {
    create: 'Çiftlik oluşturulamadı',
    update: 'Çiftlik güncellenemedi',
    delete: 'Çiftlik silinemedi',
  },

  // Empty state
  empty: {
    title: 'Henüz çiftliğiniz yok',
    description:
      'Hayvan, gider ve daha fazlasını takip etmeye başlamak için ilk çiftliğinizi oluşturun.',
  },

  // Detail page
  detail: {
    notFound: 'Çiftlik Bulunamadı',
    notFoundDesc: 'Aradığınız çiftlik mevcut değil veya erişim izniniz yok.',
    back: 'Çiftliklere Dön',
    tabs: {
      overview: 'Genel Bakış',
      facilities: 'Tesisler',
      activity: 'Aktivite',
      settings: 'Ayarlar',
    },
  },

  // Dashboard stats
  dashboard: {
    livestock: 'Hayvan',
    activeBatches: '{{count}} aktif grup',
    revenue: 'Gelir',
    salesTransactions: '{{count}} satış',
    expenses: 'Giderler',
    expenseRecords: '{{count}} gider kaydı',
  },

  // Quick actions
  quickActions: {
    tip: {
      title: 'Hızlı İpucu',
      text: 'Çiftliğinizdeki günlük işlemleri verimli bir şekilde yönetmek için hızlı eylemleri kullanın.',
    },
  },

  // Geofence
  geofenceConfig: 'Coğrafi Sınır Yapılandırması',
  geofenceDescription: 'Çiftliğiniz için coğrafi sınırları belirleyin',

  // Farm types
  types: {
    poultry: 'Kümes Hayvanları',
    aquaculture: 'Su Ürünleri',
    cattle: 'Sığır',
    goats: 'Keçi',
    sheep: 'Koyun',
    apiary: 'Arıcılık',
    mixed: 'Karma',
  },
}
