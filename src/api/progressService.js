// File: src/api/progressService.js
import apiClient from './axios';
import dayjs from 'dayjs'; // Cần thư viện dayjs để format ngày

export default {
  // --- HÀM GỐC: Tạo Check-in Event ---
  // (Giữ nguyên đường dẫn GỐC của bạn)
  createCheckIn(shareableLink, checkInData) {
    return apiClient.post(`/plans/${shareableLink}/progress/check-in`, checkInData);
  },

  // --- HÀM GỐC: Lấy dữ liệu Timeline theo ngày ---
  // (Giữ nguyên đường dẫn GỐC của bạn)
  getDailyTimeline(shareableLink, date) {
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return apiClient.get(`/plans/${shareableLink}/progress/timeline`, {
      params: { date: formattedDate }
    });
  },

  // --- (MỚI) HÀM SỬA CHECK-IN ---
  // (Thêm mới, sử dụng đường dẫn chính xác)
  updateCheckIn(shareableLink, checkInEventId, updateData) {
    return apiClient.put(`/plans/${shareableLink}/progress/check-in/${checkInEventId}`, updateData);
  },

  // --- (MỚI) HÀM XÓA CHECK-IN ---
  // (Thêm mới, sử dụng đường dẫn chính xác)
  deleteCheckIn(shareableLink, checkInEventId) {
    return apiClient.delete(`/plans/${shareableLink}/progress/check-in/${checkInEventId}`);
  },

  // --- HÀM UPLOAD FILE (Giữ nguyên từ file gốc) ---
  uploadEvidenceFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};