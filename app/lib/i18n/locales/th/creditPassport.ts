export const creditPassport = {
  title: 'พาสปอร์ตเครดิต',
  fullTitle: 'พาสปอร์ตเครดิต LivestockAI',

  // Toast messages
  messages: {
    csvDownloaded: 'ดาวน์โหลดรายงาน CSV สำเร็จ',
    generationFailed: 'ไม่สามารถสร้างรายงานได้',
  },

  // Verification page
  verification: {
    failed: 'การยืนยันล้มเหลว',
    freshnessLevel: 'ระดับความสด',
    reportType: 'ประเภทรายงาน:',
    verificationCount: 'จำนวนการยืนยัน:',
  },

  // Steps
  steps: {
    selectReportType: 'เลือกประเภทรายงาน',
    selectDateRange: 'เลือกช่วงวันที่',
    selectBatches: 'เลือกชุด',
  },

  // Filters
  filters: {
    filterByType: 'กรองตามประเภท',
    filterByStatus: 'กรองตามสถานะ',
    allTypes: 'ทุกประเภท',
    allStatus: 'ทุกสถานะ',
  },

  // Placeholders
  placeholders: {
    reportNotes: 'เพิ่มบริบทเพิ่มเติมหรือข้อกำหนดเฉพาะสำหรับรายงานนี้...',
  },

  // Dialogs
  dialogs: {
    deleteReport: 'ลบรายงาน',
    deleteReportDesc:
      'คุณแน่ใจหรือไม่ว่าต้องการลบรายงานนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้ รายงานจะไม่สามารถเข้าถึงได้อีกต่อไปสำหรับการยืนยัน',
  },

  // Empty states
  empty: {
    total: 'ไม่พบรายงาน',
    desc: 'สร้างรายงานพาสปอร์ตเครดิตแรกของคุณเพื่อเริ่มต้น',
  },
}
