export const farms = {
  // Page headings
  title: 'ฟาร์มของฉัน',
  description: 'จัดการฟาร์มปศุสัตว์และสิ่งอำนวยความสะดวกของคุณ',
  add: 'เพิ่มฟาร์ม',
  create: 'สร้างฟาร์ม',
  createFirst: 'สร้างฟาร์มแรกของคุณ',
  createFarm: 'สร้างฟาร์ม',
  createNewFarm: 'สร้างฟาร์มใหม่',
  editFarm: 'แก้ไขฟาร์ม',
  updateFarm: 'อัปเดตฟาร์ม',
  updated: 'อัปเดตฟาร์มแล้ว',
  created: 'สร้างฟาร์มแล้ว',

  // Form fields
  farmName: 'ชื่อฟาร์ม',
  location: 'ที่ตั้ง',
  farmType: 'จุดเน้นหลัก',
  namePlaceholder: 'กรอกชื่อฟาร์ม',
  locationPlaceholder: 'กรอกที่ตั้ง',
  createDescription: 'เพิ่มฟาร์มใหม่ในบัญชีของคุณ',
  editDescription: 'อัปเดตรายละเอียดฟาร์มของคุณ',

  // Placeholders
  placeholders: {
    name: 'กรอกชื่อฟาร์ม',
    location: 'กรอกที่ตั้ง เมือง หรือภูมิภาค',
  },

  // Error messages
  error: {
    create: 'ไม่สามารถสร้างฟาร์มได้',
    update: 'ไม่สามารถอัปเดตฟาร์มได้',
    delete: 'ไม่สามารถลบฟาร์มได้',
  },

  // Empty state
  empty: {
    title: 'คุณยังไม่มีฟาร์ม',
    description:
      'สร้างฟาร์มแรกของคุณเพื่อเริ่มติดตามปศุสัตว์ ค่าใช้จ่าย และอื่นๆ',
  },

  // Detail page
  detail: {
    notFound: 'ไม่พบฟาร์ม',
    notFoundDesc: 'ฟาร์มที่คุณกำลังค้นหาไม่มีอยู่หรือคุณไม่มีสิทธิ์เข้าถึง',
    back: 'กลับไปยังฟาร์ม',
    tabs: {
      overview: 'ภาพรวม',
      facilities: 'สิ่งอำนวยความสะดวก',
      activity: 'กิจกรรม',
      settings: 'การตั้งค่า',
    },
  },

  // Dashboard stats
  dashboard: {
    livestock: 'ปศุสัตว์',
    activeBatches: '{{count}} แบทช์ที่ใช้งานอยู่',
    revenue: 'รายได้',
    salesTransactions: '{{count}} การขาย',
    expenses: 'ค่าใช้จ่าย',
    expenseRecords: '{{count}} บันทึกค่าใช้จ่าย',
  },

  // Quick actions
  quickActions: {
    tip: {
      title: 'เคล็ดลับด่วน',
      text: 'ใช้การดำเนินการด่วนเพื่อจัดการการดำเนินงานประจำวันของฟาร์มอย่างมีประสิทธิภาพ',
    },
  },

  // Geofence
  geofenceConfig: 'การกำหนดค่า Geofence',
  geofenceDescription: 'ตั้งค่าขอบเขตทางภูมิศาสตร์สำหรับฟาร์มของคุณ',

  // Farm types
  types: {
    poultry: 'สัตว์ปีก',
    aquaculture: 'การเพาะเลี้ยงสัตว์น้ำ',
    cattle: 'โค',
    goats: 'แพะ',
    sheep: 'แกะ',
    apiary: 'การเลี้ยงผึ้ง',
    mixed: 'ผสม',
  },
}
