// File: src/api/authService.js

import apiClient from './axios';

// Các hàm này tương ứng với các endpoint trong AuthController.java
export default {
    register(data) {
        return apiClient.post('/auth/register', data);
    },
    activate(token) {
        return apiClient.get(`/auth/activate?token=${token}`);
    },
    login(credentials) {
        return apiClient.post('/auth/login', credentials);
    },
    getCurrentUser() {
        return apiClient.get('/auth/me');
    },
    logout(refreshToken) {
        return apiClient.post('/auth/logout', { refreshToken });
    },
    forgotPassword(email) {
      // Dữ liệu khớp với ForgotPasswordRequest.java
      return apiClient.post('/auth/forgot-password', { email });
    },
    
    // --- (PHẦN THÊM MỚI) ---
    // Thêm hàm resetPassword bị thiếu
    resetPassword(data) {
      // 'data' khớp với ResetPasswordRequest.java { token, newPassword }
      return apiClient.post('/auth/reset-password', data);
    },
    // --- (KẾT THÚC THÊM MỚI) ---
  
    changePassword(passwords) {
      // 'passwords' khớp với ChangePasswordRequest.java { oldPassword, newPassword }
      return apiClient.post('/auth/change-password', passwords);
    },

    loginWithGoogle(idToken) {
      // Dữ liệu khớp với GoogleLoginRequest.java
      return apiClient.post('/auth/google', { idToken });
    },

    refreshToken(token) {
      // Gửi refresh token trong header theo cách backend yêu cầu
      return apiClient.post('/auth/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
};