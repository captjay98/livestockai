export const mortality = {
  title: 'บันทึกการตาย',
  description: 'บันทึกการตายเพื่อติดตามสุขภาพฝูงสัตว์และระบุปัญหาได้ทันท่วงที',
  recordLoss: 'บันทึกการสูญเสีย',
  recordLossTitle: 'บันทึกการตาย',
  allCauses: 'สาเหตุทั้งหมด',
  emptyTitle: 'ไม่มีบันทึกการตาย',
  emptyDescription: 'หวังว่าคุณจะไม่ต้องเพิ่มบันทึกเร็วๆ นี้',
  recorded: 'บันทึกการตายเรียบร้อย',
  cause: 'สาเหตุ',
  selectCause: 'เลือกสาเหตุ',
  totalDeaths: 'ตายทั้งหมด',
  healthAlerts: 'แจ้งเตือนสุขภาพ',
  totalAlerts: '{{count}} การแจ้งเตือน',
  recordedIncidents: 'เหตุการณ์ที่บันทึก',
  causes: {
    disease: 'โรค',
    predator: 'สัตว์นักล่า',
    weather: 'สภาพอากาศ/สิ่งแวดล้อม',
    unknown: 'ไม่ระบุ',
    other: 'อื่นๆ',
  },
  error: {
    record: 'ไม่สามารถบันทึกการตายได้',
  },
  notesPlaceholder: 'อธิบายอาการหรือเหตุการณ์...',
  records: 'บันทึกการตาย',
}

export const vaccinations = {
  title: 'บันทึกสุขภาพ',
  description: 'ติดตามการฉีดวัคซีนและการรักษาสัตว์',
  actions: {
    vaccinate: 'บันทึกวัคซีน',
    treat: 'บันทึกการรักษา',
  },
  tabs: {
    all: 'บันทึกทั้งหมด',
    vaccinations: 'วัคซีน',
    treatments: 'การรักษา',
  },
  labels: {
    batch: 'ชุดการผลิต',
    vaccineName: 'ชื่อวัคซีน',
    medicationName: 'ชื่อยา',
    date: 'วันที่',
    dosage: 'ปริมาณยา',
    reason: 'สาเหตุการรักษา',
    withdrawal: 'ระยะหยุดยา (วัน)',
    nextDueDate: 'วันครบกำหนดถัดไป',
    notes: 'หมายเหตุ',
  },
  placeholders: {
    search: 'ค้นหาตามชื่อหรือชุดการผลิต...',
    dosage: 'เช่น 10ml',
    reason: 'เช่น โรคบิด',
  },
  columns: {
    date: 'วันที่',
    type: 'ประเภท',
    name: 'ชื่อ',
    batch: 'ชุดการผลิต',
    details: 'รายละเอียด',
  },
  types: {
    prevention: 'การป้องกัน',
    treatment: 'การรักษา',
  },
  details: {
    next: 'ครั้งถัดไป',
    for: 'สำหรับ',
    withdrawalSuffix: ' วันหยุดยา',
  },
  alerts: {
    overdue: 'วัคซีนเกินกำหนด',
    upcoming: 'วัคซีนเร็วๆ นี้',
  },
  dialog: {
    vaccinationTitle: 'บันทึกวัคซีน',
    treatmentTitle: 'บันทึกการรักษา',
  },
  messages: {
    vaccinationRecorded: 'บันทึกวัคซีนเรียบร้อยแล้ว',
    treatmentRecorded: 'บันทึกการรักษาเรียบร้อยแล้ว',
    updated: 'อัปเดตข้อมูลสุขภาพเรียบร้อยแล้ว',
    deleted: 'ลบข้อมูลสุขภาพเรียบร้อยแล้ว',
  },
  empty: {
    title: 'ไม่มีบันทึกสุขภาพ',
    description: 'เริ่มติดตามการฉีดวัคซีนและการรักษา',
  },
}

export const weight = {
  title: 'สุ่มชั่งน้ำหนัก',
  description: 'ติดตามการเจริญเติบโตโดยการบันทึกน้ำหนักเป็นระยะ',
  addSample: 'เพิ่มตัวอย่าง',
  addSampleTitle: 'บันทึกตัวอย่างน้ำหนัก',
  editSampleTitle: 'แก้ไขตัวอย่างน้ำหนัก',
  deleteSampleTitle: 'ลบตัวอย่างน้ำหนัก',
  deleteConfirmation: 'คุณแน่ใจหรือไม่ว่าต้องการลบตัวอย่างน้ำหนักนี้?',
  saveSample: 'บันทึกตัวอย่าง',
  growthAlerts: 'แจ้งเตือนการเติบโต',
  animalsCount: '{{count}} ตัว',
  avgWeight: 'น้ำหนักเฉลี่ย',
  sampleSize: 'ขนาดตัวอย่าง',
  recorded: 'บันทึกน้ำหนักเรียบร้อย',
  emptyTitle: 'ไม่มีตัวอย่างน้ำหนัก',
  emptyDescription: 'ติดตามน้ำหนักสัตว์เลี้ยงของคุณอย่างสม่ำเสมอ',
  error: {
    record: 'บันทึกไม่สำเร็จ',
  },
}

export const waterQuality = {
  title: 'คุณภาพน้ำ',
  description:
    'ตรวจสอบสภาพบ่อ (pH, อุณหภูมิ, ออกซิเจน) เพื่อสุขภาพปลาที่ดีที่สุด',
  addRecord: 'เพิ่มบันทึก',
  addRecordTitle: 'บันทึกคุณภาพน้ำ',
  editRecordTitle: 'แก้ไขคุณภาพน้ำ',
  deleteRecordTitle: 'ลบคุณภาพน้ำ',
  deleteConfirmation: 'คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกคุณภาพน้ำนี้?',
  saveRecord: 'บันทึก',
  qualityAlerts: 'แจ้งเตือนคุณภาพ',
  selectFishBatch: 'เลือกชุดปลา',
  recorded: 'บันทึกคุณภาพน้ำเรียบร้อย',
  temp: 'อุณหภูมิ ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'แอมโมเนีย',
  emptyTitle: 'ไม่มีบันทึกคุณภาพน้ำ',
  emptyDescription: 'ตรวจสอบค่าคุณภาพน้ำอย่างสม่ำเสมอ',
  error: {
    record: 'บันทึกไม่สำเร็จ',
  },
  labels: {
    ph: 'pH',
    temperature: 'อุณหภูมิ',
    dissolvedOxygen: 'ออกซิเจนละลาย (mg/L)',
    ammonia: 'แอมโมเนีย (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
