export const extension = {
  title: 'एक्सटेंशन कार्यकर्ता मोड',

  // Toast messages
  messages: {
    userAssigned: 'उपयोगकर्ता जिले को सौंपा गया',
    selectBothFields: 'कृपया उपयोगकर्ता और जिला दोनों चुनें',
    userRemoved: 'उपयोगकर्ता को जिले से हटा दिया गया',
    supervisorUpdated: 'पर्यवेक्षक स्थिति अपडेट की गई',
    accessApproved: 'पहुंच स्वीकृत',
    accessApprovedDesc:
      'एक्सटेंशन कार्यकर्ता अब आपके फार्म डेटा तक पहुंच सकता है।',
    accessDenied: 'पहुंच अस्वीकृत',
    accessDeniedDesc: 'पहुंच अनुरोध अस्वीकार कर दिया गया है।',
    accessRevoked: 'पहुंच रद्द',
    accessRevokedDesc:
      'एक्सटेंशन कार्यकर्ता के पास अब आपके फार्म तक पहुंच नहीं है।',
    approveAccessFailed: 'पहुंच अनुरोध स्वीकार करने में विफल',
    denyAccessFailed: 'पहुंच अनुरोध अस्वीकार करने में विफल',
    revokeAccessFailed: 'पहुंच रद्द करने में विफल',
    error: 'त्रुटि',
  },

  // UI labels
  totalFarms: 'कुल फार्म',
  lastVisit: 'अंतिम यात्रा:',
  noFarmsAffected: 'कोई फार्म प्रभावित नहीं हुआ',
  noAssignments: 'कोई असाइनमेंट नहीं मिला',
  cannotDeactivate: 'निष्क्रिय नहीं किया जा सकता',
  regionHasFarms: 'इस क्षेत्र में {{count}} फार्म असाइन किए गए हैं।',

  // Placeholders
  placeholders: {
    selectUser: 'उपयोगकर्ता चुनें',
    selectDistrict: 'जिला चुनें',
    selectCountry: 'देश चुनें',
    selectParentRegion: 'पैरेंट क्षेत्र चुनें',
    globalDefault: 'वैश्विक डिफॉल्ट (कोई क्षेत्र नहीं)',
    alertNotes: 'इस अलर्ट के बारे में नोट्स जोड़ें...',
    denyReason: 'उदहारण: फार्म प्रबंधन द्वारा अधिकृत नहीं',
    revokeReason: 'उदहारण: पहुंच की अब आवश्यकता नहीं है',
  },
  toggleSupervisor: 'पर्यवेक्षक स्थिति टॉगल करें',
  removeFromDistrict: 'जिले से निकालें',
}
