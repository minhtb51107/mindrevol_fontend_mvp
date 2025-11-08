// File: src/api/userService.js
import apiClient from './axios';

export default {
  /**
   * Lấy thông tin profile của người dùng hiện tại.
   * GET /api/v1/users/profile
   * @returns Promise<AxiosResponse<ProfileResponse>>
   */
  getMyProfile() {
    return apiClient.get('/users/profile');
  },

  /**
   * Cập nhật thông tin profile của người dùng hiện tại.
   * PUT /api/v1/users/profile
   * @param {object} profileData Dữ liệu cập nhật { fullname, photoUrl }
   * @returns Promise<AxiosResponse<ProfileResponse>>
   */
  updateMyProfile(profileData) {
    return apiClient.put('/users/profile', profileData);
  },

  /**
   * Lấy thông tin thống kê (check-in, streak) của người dùng hiện tại.
   * GET /api/v1/users/me/stats
   * @returns Promise<AxiosResponse<UserStatsResponse>>
   */
  getMyStats() {
    return apiClient.get('/users/me/stats');
  },

  // --- HÀM MỚI ĐỂ LẤY CHART DATA ---
  /**
   * Lấy dữ liệu biểu đồ tiến độ 7 ngày gần nhất.
   * GET /api/v1/users/me/progress-chart
   * @returns Promise<AxiosResponse<Array<{ date: string, completionRate: number }>>>
   */
  getMyProgressChartData() {
    return apiClient.get('/users/me/progress-chart');
  },
  // --- KẾT THÚC HÀM MỚI ---
};