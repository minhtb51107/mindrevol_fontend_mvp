// File: src/api/feedService.js
// [CẬP NHẬT] Core Service
import apiClient from '@/services/axios';

export default {
  /**
   * Lấy danh sách feed hoạt động gần đây cho người dùng hiện tại.
   * GET /api/v1/feed
   * @param {number} page Số trang (0-based)
   * @param {number} size Kích thước trang
   * @returns Promise<AxiosResponse<Page<FeedEventDto>>> // Giả sử DTO là FeedEventDto
   */
  getFeed(page = 0, size = 10) {
    return apiClient.get('/feed', {
      params: {
        page: page,
        size: size,
        sort: 'timestamp,desc' // Sắp xếp theo thời gian mới nhất
      }
    });
  },
};