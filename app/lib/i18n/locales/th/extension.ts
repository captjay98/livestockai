export const extension = {
  title: 'โหมดเจ้าหน้าที่ส่งเสริม',

  // Toast messages
  messages: {
    userAssigned: 'มอบหมายผู้ใช้ให้กับเขตแล้ว',
    selectBothFields: 'กรุณาเลือกทั้งผู้ใช้และเขต',
    userRemoved: 'ลบผู้ใช้ออกจากเขตแล้ว',
    supervisorUpdated: 'อัปเดตสถานะผู้ดูแลแล้ว',
    accessApproved: 'อนุมัติการเข้าถึง',
    accessApprovedDesc:
      'เจ้าหน้าที่ส่งเสริมสามารถเข้าถึงข้อมูลฟาร์มของคุณได้แล้ว',
    accessDenied: 'ปฏิเสธการเข้าถึง',
    accessDeniedDesc: 'คำขอเข้าถึงถูกปฏิเสธแล้ว',
    accessRevoked: 'เพิกถอนการเข้าถึง',
    accessRevokedDesc:
      'เจ้าหน้าที่ส่งเสริมไม่สามารถเข้าถึงฟาร์มของคุณได้อีกต่อไป',
    approveAccessFailed: 'ไม่สามารถอนุมัติคำขอเข้าถึงได้',
    denyAccessFailed: 'ไม่สามารถปฏิเสธคำขอเข้าถึงได้',
    revokeAccessFailed: 'ไม่สามารถเพิกถอนการเข้าถึงได้',
    error: 'ข้อผิดพลาด',
  },

  // UI labels
  totalFarms: 'ฟาร์มทั้งหมด',
  lastVisit: 'การเยี่ยมชมล่าสุด:',
  noFarmsAffected: 'ไม่มีฟาร์มที่ได้รับผลกระทบ',
  noAssignments: 'ไม่พบการมอบหมาย',
  cannotDeactivate: 'ไม่สามารถปิดใช้งานได้',
  regionHasFarms: 'ภูมิภาคนี้มีฟาร์ม {{count}} แห่งที่ได้รับมอบหมาย',

  // Placeholders
  placeholders: {
    selectUser: 'เลือกผู้ใช้',
    selectDistrict: 'เลือกเขต',
    selectCountry: 'เลือกประเทศ',
    selectParentRegion: 'เลือกภูมิภาคหลัก',
    globalDefault: 'ค่าเริ่มต้นทั่วโลก (ไม่มีภูมิภาค)',
    alertNotes: 'เพิ่มหมายเหตุเกี่ยวกับการแจ้งเตือนนี้...',
    denyReason: 'เช่น ไม่ได้รับอนุญาตจากฝ่ายบริหารฟาร์ม',
    revokeReason: 'เช่น ไม่จำเป็นต้องเข้าถึงอีกต่อไป',
  },
  toggleSupervisor: 'สลับสถานะผู้ดูแล',
  removeFromDistrict: 'ลบออกจากเขต',
}
