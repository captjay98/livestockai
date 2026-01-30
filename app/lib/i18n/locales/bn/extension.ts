export const extension = {
  title: 'সম্প্রসারণ কর্মী মোড',

  // Toast messages
  messages: {
    userAssigned: 'ব্যবহারকারী জেলায় নিয়োগ করা হয়েছে',
    selectBothFields: 'অনুগ্রহ করে ব্যবহারকারী এবং জেলা উভয়ই নির্বাচন করুন',
    userRemoved: 'ব্যবহারকারী জেলা থেকে সরানো হয়েছে',
    supervisorUpdated: 'সুপারভাইজার স্ট্যাটাস আপডেট করা হয়েছে',
    accessApproved: 'অ্যাক্সেস অনুমোদিত',
    accessApprovedDesc:
      'সম্প্রসারণ কর্মী এখন আপনার খামার ডেটা অ্যাক্সেস করতে পারবেন।',
    accessDenied: 'অ্যাক্সেস প্রত্যাখ্যাত',
    accessDeniedDesc: 'অ্যাক্সেস অনুরোধ প্রত্যাখ্যান করা হয়েছে।',
    accessRevoked: 'অ্যাক্সেস প্রত্যাহার',
    accessRevokedDesc: 'সম্প্রসারণ কর্মীর আর আপনার খামারে অ্যাক্সেস নেই।',
    approveAccessFailed: 'অ্যাক্সেস অনুরোধ অনুমোদন করতে ব্যর্থ',
    denyAccessFailed: 'অ্যাক্সেস অনুরোধ প্রত্যাখ্যান করতে ব্যর্থ',
    revokeAccessFailed: 'অ্যাক্সেস প্রত্যাহার করতে ব্যর্থ',
    error: 'ত্রুটি',
  },

  // UI labels
  totalFarms: 'মোট খামার',
  lastVisit: 'শেষ পরিদর্শন:',
  noFarmsAffected: 'কোনো খামার প্রভাবিত হয়নি',
  noAssignments: 'কোনো নিয়োগ পাওয়া যায়নি',
  cannotDeactivate: 'নিষ্ক্রিয় করা যাবে না',
  regionHasFarms: 'এই অঞ্চলে {{count}} টি খামার নিয়োগ করা হয়েছে।',

  // Placeholders
  placeholders: {
    selectUser: 'ব্যবহারকারী নির্বাচন করুন',
    selectDistrict: 'জেলা নির্বাচন করুন',
    selectCountry: 'দেশ নির্বাচন করুন',
    selectParentRegion: 'মূল অঞ্চল নির্বাচন করুন',
    globalDefault: 'বৈশ্বিক ডিফল্ট (কোনো অঞ্চল নেই)',
    alertNotes: 'এই সতর্কতা সম্পর্কে নোট যোগ করুন...',
    denyReason: 'যেমন, খামার ব্যবস্থাপনা দ্বারা অনুমোদিত নয়',
    revokeReason: 'যেমন, অ্যাক্সেস আর প্রয়োজন নেই',
  },
  toggleSupervisor: 'সুপারভাইজার স্ট্যাটাস টগল করুন',
  removeFromDistrict: 'জেলা থেকে সরান',
}
