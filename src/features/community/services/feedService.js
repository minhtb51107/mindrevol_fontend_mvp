// File: src/features/community/services/feedService.js
import apiClient from '@/services/axios';

// SỬA LỖI: Trỏ đến PROGRESS CONTROLLER (Đã xóa /api/v1 thừa)
const API_URL = '/progress/feed'; 

export default {
  /**
   * Lấy "Feed Tri Kỷ" (Logs từ bạn bè và chính mình)
   * (ĐÃ SỬA LỖI P4)
   */
  getFriendFeed(page = 0, size = 10) {
    return apiClient.get(`${API_URL}/friends`, { // Gọi GET /api/v1/progress/feed/friends
      params: { page, size }
    });
  },

  /**
   * Lấy "Bảo Tàng" (Feed cá nhân) của một user
   * (ĐÃ SỬA LỖI P4)
   */
  getUserFeed(userId, page = 0, size = 10) {
    return apiClient.get(`${API_URL}/user/${userId}`, { // Gọi GET /api/v1/progress/feed/user/{userId}
      params: { page, size }
    });
  },

  /**
   * (API Cũ - Giờ không dùng)
   * Lấy feed global (tất cả sự kiện)
   */
  getGlobalFeed(page = 0, size = 10) {
    // API này của FeedController cũ vẫn tồn tại, nhưng chúng ta không dùng nó cho feed chính
    return apiClient.get('/feed', { // API gốc của bạn
      params: { page, size }
    });
  }
};