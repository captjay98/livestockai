export const farms = {
  // Page headings
  title: 'मेरे खेत',
  description: 'अपने पशुधन खेतों और सुविधाओं का प्रबंधन करें',
  add: 'खेत जोड़ें',
  create: 'खेत बनाएं',
  createFirst: 'अपना पहला खेत बनाएं',
  createFarm: 'खेत बनाएं',
  createNewFarm: 'नया खेत बनाएं',
  editFarm: 'खेत संपादित करें',
  updateFarm: 'खेत अपडेट करें',
  updated: 'खेत अपडेट किया गया',
  created: 'खेत बनाया गया',

  // Form fields
  farmName: 'खेत का नाम',
  location: 'स्थान',
  farmType: 'मुख्य फोकस',
  namePlaceholder: 'खेत का नाम दर्ज करें',
  locationPlaceholder: 'स्थान दर्ज करें',
  createDescription: 'अपने खाते में नया खेत जोड़ें',
  editDescription: 'अपने खेत का विवरण अपडेट करें',

  // Placeholders
  placeholders: {
    name: 'खेत का नाम दर्ज करें',
    location: 'स्थान, शहर या क्षेत्र दर्ज करें',
  },

  // Error messages
  error: {
    create: 'खेत बनाने में विफल',
    update: 'खेत अपडेट करने में विफल',
    delete: 'खेत हटाने में विफल',
  },

  // Empty state
  empty: {
    title: 'आपके पास अभी तक कोई खेत नहीं है',
    description:
      'पशुधन, खर्चों और अधिक को ट्रैक करना शुरू करने के लिए अपना पहला खेत बनाएं।',
  },

  // Detail page
  detail: {
    info: 'खेत की जानकारी',
    name: 'नाम',
    type: 'प्रकार',
    location: 'स्थान',
    created: 'बनाया गया',
    notFound: 'खेत नहीं मिला',
    notFoundDesc:
      'जिस खेत की आप तलाश कर रहे हैं वह मौजूद नहीं है या आपके पास इसकी पहुंच नहीं है।',
    back: 'खेतों पर वापस जाएं',
    tabs: {
      overview: 'अवलोकन',
      facilities: 'सुविधाएं',
      activity: 'गतिविधि',
      settings: 'सेटिंग्स',
    },
  },

  // Dashboard stats
  dashboard: {
    livestock: 'पशुधन',
    activeBatches: '{{count}} सक्रिय बैच',
    revenue: 'राजस्व',
    salesTransactions: '{{count}} बिक्री',
    expenses: 'खर्च',
    expenseRecords: '{{count}} खर्च रिकॉर्ड',
  },

  // Active batches
  activeBatches: {
    title: 'सक्रिय बैच',
  },

  // Structures
  structures: {
    title: 'संरचनाएं',
    description: 'खेत की संरचनाएं और सुविधाएं',
    types: {
      pond: 'तालाब',
      tarpaulin: 'तिरपाल',
      cage: 'पिंजरा',
      house: 'घर',
      coop: 'मुर्गी घर',
      pen: 'बाड़ा',
      barn: 'गोदाम',
      shed: 'शेड',
      hive: 'छत्ता',
    },
    statuses: {
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      maintenance: 'रखरखाव',
    },
  },

  // Recent activity
  recentActivity: {
    title: 'हाल की गतिविधि',
    sales: 'बिक्री',
    expenses: 'खर्च',
  },

  // Quick actions
  quickActions: {
    manageBatches: 'बैच प्रबंधित करें',
    recordExpense: 'खर्च रिकॉर्ड करें',
    viewReports: 'रिपोर्ट देखें',
    tip: {
      title: 'त्वरित सुझाव',
      text: 'अपने खेत के दैनिक कार्यों को कुशलता से प्रबंधित करने के लिए त्वरित क्रियाओं का उपयोग करें।',
    },
  },

  // Geofence
  geofenceConfig: 'जियोफेंस कॉन्फ़िगरेशन',
  geofenceDescription: 'अपने खेत के लिए भौगोलिक सीमाएं सेट करें',

  // Farm types
  types: {
    poultry: 'मुर्गी पालन',
    aquaculture: 'जलीय कृषि',
    cattle: 'गाय-भैंस',
    goats: 'बकरी',
    sheep: 'भेड़',
    apiary: 'मधुमक्खी पालन',
    mixed: 'मिश्रित',
  },
}
