export const extension = {
  title: 'Chế Độ Nhân Viên Khuyến Nông',

  // Toast messages
  messages: {
    userAssigned: 'Người dùng đã được phân công cho quận',
    selectBothFields: 'Vui lòng chọn cả người dùng và quận',
    userRemoved: 'Người dùng đã bị xóa khỏi quận',
    supervisorUpdated: 'Trạng thái giám sát viên đã được cập nhật',
    accessApproved: 'Truy Cập Được Phê Duyệt',
    accessApprovedDesc:
      'Nhân viên khuyến nông hiện có thể truy cập dữ liệu trang trại của bạn.',
    accessDenied: 'Truy Cập Bị Từ Chối',
    accessDeniedDesc: 'Yêu cầu truy cập đã bị từ chối.',
    accessRevoked: 'Truy Cập Bị Thu Hồi',
    accessRevokedDesc:
      'Nhân viên khuyến nông không còn quyền truy cập vào trang trại của bạn.',
    approveAccessFailed: 'Không thể phê duyệt yêu cầu truy cập',
    denyAccessFailed: 'Không thể từ chối yêu cầu truy cập',
    revokeAccessFailed: 'Không thể thu hồi quyền truy cập',
    error: 'Lỗi',
  },

  // UI labels
  totalFarms: 'Tổng Số Trang Trại',
  lastVisit: 'Lần Thăm Cuối:',
  noFarmsAffected: 'Không có trang trại bị ảnh hưởng',
  noAssignments: 'Không tìm thấy phân công',
  cannotDeactivate: 'Không thể vô hiệu hóa',
  regionHasFarms: 'Khu vực này có {{count}} trang trại được phân công.',

  // Placeholders
  placeholders: {
    selectUser: 'Chọn người dùng',
    selectDistrict: 'Chọn quận',
    selectCountry: 'Chọn quốc gia',
    selectParentRegion: 'Chọn khu vực cha',
    globalDefault: 'Mặc định toàn cầu (không có khu vực)',
    alertNotes: 'Thêm ghi chú về cảnh báo này...',
    denyReason: 'ví dụ: Không được ủy quyền bởi ban quản lý trang trại',
    revokeReason: 'ví dụ: Không còn cần quyền truy cập',
  },
  toggleSupervisor: 'Chuyển đổi trạng thái giám sát viên',
  removeFromDistrict: 'Xóa khỏi quận',
}
