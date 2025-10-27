// File: src/api/progressService.js
import apiClient from './axios';
import dayjs from 'dayjs'; // Cần thư viện dayjs để format ngày

export default {
  // --- HÀM MỚI: Tạo Check-in Event ---
  createCheckIn(shareableLink, checkInData) {
    // checkInData sẽ có dạng { notes: '...', attachments: [{storedFilename, fileUrl,...}], completedTaskIds: [1, 2] }
    return apiClient.post(`/plans/${shareableLink}/progress/check-in`, checkInData);
  },

  // --- HÀM MỚI: Lấy dữ liệu Timeline theo ngày ---
  getDailyTimeline(shareableLink, date) {
    // Format date sang YYYY-MM-DD
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return apiClient.get(`/plans/${shareableLink}/progress/timeline`, {
      params: { date: formattedDate }
    });
  },

  // --- HÀM UPLOAD FILE (Giữ nguyên) ---
  // Vẫn cần thiết để upload ảnh/file trước khi gọi createCheckIn
  uploadEvidenceFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
      // Ví dụ theo dõi tiến trình upload:
      // onUploadProgress: progressEvent => {
      //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      //   console.log(`Upload progress: ${percentCompleted}%`);
      // }
    });
  }
};