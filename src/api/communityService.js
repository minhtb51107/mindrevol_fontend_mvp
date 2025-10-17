// File: src/api/communityService.js
import apiClient from './axios';

export default {
  // Lấy chi tiết một ngày check-in (cần API này ở backend)
  // Giả sử chúng ta có API GET /api/v1/progress/{progressId}
  getProgressDetail(progressId) {
    // Tạm thời chúng ta chưa có API này, sẽ xử lý logic ở store
    // Đây là API cần thêm ở backend để tối ưu:
    // return apiClient.get(`/progress/${progressId}`);
    // Hiện tại, chúng ta sẽ dựa vào dữ liệu đã có và bổ sung
    return Promise.resolve(null); // Placeholder
  },

  postComment(progressId, content) {
    return apiClient.post(`/progress/${progressId}/comments`, { content });
  },

  addOrUpdateReaction(progressId, reactionType) {
    return apiClient.post(`/progress/${progressId}/reactions`, { reactionType });
  },

  removeReaction(progressId) {
      return apiClient.delete(`/progress/${progressId}/reactions`);
  }
};