// File: src/api/progressService.js
import apiClient from '@/services/axios';
import dayjs from 'dayjs';

export default {
  // --- HÀM GỐC: Tạo Check-in Event ---
  createCheckIn(shareableLink, checkInData) {
    return apiClient.post(`/plans/${shareableLink}/progress/check-in`, checkInData);
  },

  // --- HÀM GỐC: Lấy dữ liệu Timeline theo ngày ---
  getDailyTimeline(shareableLink, date) {
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return apiClient.get(`/plans/${shareableLink}/progress/timeline`, {
      params: { date: formattedDate }
    });
  },

  getTodayCompletedTasks(shareableLink) {
        // Lỗi ReferenceError xảy ra ở dòng dưới nếu thiếu import axiosClient bên trên
        return apiClient.get(`/plans/${shareableLink}/progress/check-in/today`);
    },

  // --- (HÀM GỐC) SỬA CHECK-IN ---
  updateCheckIn(shareableLink, checkInEventId, updateData) {
    return apiClient.put(`/plans/${shareableLink}/progress/check-in/${checkInEventId}`, updateData);
  },

  // --- (HÀM GỐC) HÀM XÓA CHECK-IN ---
  deleteCheckIn(shareableLink, checkInEventId) {
    return apiClient.delete(`/plans/${shareableLink}/progress/check-in/${checkInEventId}`);
  },

  // --- HÀM UPLOAD FILE (Giữ nguyên từ file gốc) ---
  uploadEvidenceFile(file) {
    // ... (giữ nguyên)
  },

  // === THÊM CÁC HÀM MỚI CHO COMMENT VÀ REACTION ===

  /**
   * Thêm bình luận vào một CheckInEvent cụ thể
   * @param {string} shareableLink 
   * @param {number} checkInId 
   * @param {object} commentData - { content: "Nội dung" }
   * @returns {Promise}
   */
  addCommentToCheckIn(shareableLink, checkInId, commentData) {
    return apiClient.post(`/plans/${shareableLink}/progress/check-in/${checkInId}/comments`, commentData);
  },

  /**
   * Cập nhật bình luận
   * @param {string} shareableLink 
   * @param {number} checkInId 
   * @param {number} commentId 
   * @param {object} commentData - { content: "Nội dung mới" }
   * @returns {Promise}
   */
  updateCheckInComment(shareableLink, checkInId, commentId, commentData) {
    return apiClient.put(`/plans/${shareableLink}/progress/check-in/${checkInId}/comments/${commentId}`, commentData);
  },

  /**
   * Xóa bình luận
   * @param {string} shareableLink 
   * @param {number} checkInId 
   * @param {number} commentId 
   * @returns {Promise}
   */
  deleteCheckInComment(shareableLink, checkInId, commentId) {
    return apiClient.delete(`/plans/${shareableLink}/progress/check-in/${checkInId}/comments/${commentId}`);
  },

  /**
   * Bật/tắt reaction
   * @param {string} shareableLink 
   * @param {number} checkInId 
   * @param {object} reactionData - { type: "THUMBS_UP" }
   * @returns {Promise}
   */
  toggleReactionOnCheckIn(shareableLink, checkInId, reactionData) {
    return apiClient.post(`/plans/${shareableLink}/progress/check-in/${checkInId}/reactions`, reactionData);
  }
};