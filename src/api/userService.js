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
};