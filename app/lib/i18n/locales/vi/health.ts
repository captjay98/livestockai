export const mortality = {
  title: 'Ghi chép Tỷ lệ chết',
  description:
    'Ghi nhận cái chết để theo dõi sức khỏe đàn và phát hiện vấn đề sớm.',
  recordLoss: 'Ghi Thất thoát',
  recordLossTitle: 'Ghi nhận Tỷ lệ chết',
  allCauses: 'Tất cả nguyên nhân',
  emptyTitle: 'Không có ghi chép tử vong',
  emptyDescription: 'Hy vọng bạn không cần phải thêm bất kỳ ghi chép nào sớm.',
  recorded: 'Đã ghi nhận tử vong',
  cause: 'Nguyên nhân',
  selectCause: 'Chọn nguyên nhân',
  totalDeaths: 'Tổng số chết',
  healthAlerts: 'Cảnh báo sức khỏe',
  totalAlerts: '{{count}} cảnh báo',
  recordedIncidents: 'Sự cố đã ghi',
  causes: {
    disease: 'Dịch bệnh',
    predator: 'Thú dữ tấn công',
    weather: 'Thời tiết/Môi trường',
    unknown: 'Không rõ',
    other: 'Khác',
  },
  error: {
    record: 'Không thể ghi nhận tỷ lệ chết',
  },
  notesPlaceholder: 'Mô tả triệu chứng hoặc sự cố...',
  records: 'Ghi chép Tử vong',
}

export const vaccinations = {
  title: 'Hồ sơ Sức khỏe',
  description: 'Theo dõi tiêm phòng và điều trị cho các lô vật nuôi.',
  actions: {
    vaccinate: 'Ghi Tiêm phòng',
    treat: 'Ghi Điều trị',
  },
  tabs: {
    all: 'Tất cả hồ sơ',
    vaccinations: 'Tiêm phòng',
    treatments: 'Điều trị',
  },
  labels: {
    batch: 'Lô',
    vaccineName: 'Tên vắc xin',
    medicationName: 'Tên thuốc',
    date: 'Ngày',
    dosage: 'Liều lượng',
    reason: 'Lý do điều trị',
    withdrawal: 'Thời gian ngưng thuốc (ngày)',
    nextDueDate: 'Ngày đến hạn tiếp theo',
    notes: 'Ghi chú',
  },
  placeholders: {
    search: 'Tìm theo tên hoặc lô...',
    dosage: 'vd: 10ml',
    reason: 'vd: Bệnh cầu trùng',
  },
  columns: {
    date: 'Ngày',
    type: 'Loại',
    name: 'Tên',
    batch: 'Lô',
    details: 'Chi tiết',
  },
  types: {
    prevention: 'Phòng ngừa',
    treatment: 'Điều trị',
  },
  details: {
    next: 'Tiếp theo',
    for: 'Cho',
    withdrawalSuffix: ' ngày ngưng thuốc',
  },
  alerts: {
    overdue: 'Quá hạn Tiêm phòng',
    upcoming: 'Sắp tới hạn Tiêm phòng',
  },
  dialog: {
    vaccinationTitle: 'Ghi Tiêm phòng',
    treatmentTitle: 'Ghi Điều trị Y tế',
  },
  messages: {
    vaccinationRecorded: 'Đã ghi nhận tiêm phòng thành công',
    treatmentRecorded: 'Đã ghi nhận điều trị thành công',
    updated: 'Đã cập nhật hồ sơ sức khỏe thành công',
    deleted: 'Đã xóa hồ sơ sức khỏe thành công',
  },
  empty: {
    title: 'Không có hồ sơ sức khỏe',
    description: 'Bắt đầu theo dõi tiêm phòng và điều trị cho đàn của bạn.',
  },
}

export const weight = {
  title: 'Mẫu Trọng lượng',
  description: 'Theo dõi tăng trưởng bằng cách ghi mẫu trọng lượng định kỳ.',
  addSample: 'Thêm Mẫu',
  addSampleTitle: 'Ghi Mẫu Trọng lượng',
  editSampleTitle: 'Sửa Mẫu Trọng lượng',
  deleteSampleTitle: 'Xóa Mẫu Trọng lượng',
  deleteConfirmation: 'Bạn có chắc chắn muốn xóa mẫu trọng lượng này không?',
  saveSample: 'Lưu Mẫu',
  growthAlerts: 'Cảnh báo Tăng trưởng',
  animalsCount: '{{count}} con',
  avgWeight: 'Trọng lượng TB',
  sampleSize: 'Kích thước mẫu',
  recorded: 'Đã ghi mẫu trọng lượng',
  emptyTitle: 'Không có mẫu trọng lượng',
  emptyDescription: 'Theo dõi trọng lượng vật nuôi của bạn thường xuyên.',
  error: {
    record: 'Không thể lưu mẫu',
  },
}

export const waterQuality = {
  title: 'Chất lượng Nước',
  description:
    'Giám sát điều kiện ao (pH, nhiệt độ, oxy) để đảm bảo sức khỏe cá tối ưu.',
  addRecord: 'Thêm Ghi chép',
  addRecordTitle: 'Ghi Chất lượng Nước',
  editRecordTitle: 'Sửa Ghi chép Chất lượng Nước',
  deleteRecordTitle: 'Xóa Ghi chép Chất lượng Nước',
  deleteConfirmation:
    'Bạn có chắc chắn muốn xóa ghi chép chất lượng nước này không?',
  saveRecord: 'Lưu Ghi chép',
  qualityAlerts: 'Cảnh báo Chất lượng',
  selectFishBatch: 'Chọn lô cá',
  recorded: 'Đã ghi chất lượng nước',
  temp: 'Nhiệt độ ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Amoniac',
  emptyTitle: 'Không có ghi chép chất lượng nước',
  emptyDescription: 'Giám sát các thông số nước thường xuyên.',
  error: {
    record: 'Không thể lưu ghi chép',
  },
  labels: {
    ph: 'pH',
    temperature: 'Nhiệt độ',
    dissolvedOxygen: 'Oxy hòa tan (mg/L)',
    ammonia: 'Amoniac (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}
