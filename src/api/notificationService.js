import apiClient from './axios';

export default {
  // Lấy danh sách thông báo (có phân trang)
  getNotifications(page = 0, size = 10) {
    return apiClient.get('/notifications', {
      params: {
        page: page,
        size: size,
        // sort: 'createdAt,desc' // Tùy chọn: Sắp xếp theo thời gian mới nhất
      }
    });
  },

  // Đánh dấu thông báo đã đọc
  markAsRead(notificationId) {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  },

//   (Tùy chọn) Đánh dấu tất cả đã đọc (Cần API backend)
  markAllAsRead() {
    return apiClient.patch('/notifications/read-all');
  }
};