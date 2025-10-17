// File: src/stores/auth.js

import { defineStore } from 'pinia';
import authService from '@/api/authService';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
    // State: Dữ liệu của store, lấy từ localStorage để giữ trạng thái sau khi tải lại trang
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
        returnUrl: null
    }),

    // Getters: Các hàm tính toán dựa trên state
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        currentUser: (state) => state.user,
    },

    // Actions: Các hàm để thay đổi state (tương tác với API)
    actions: {
        async login(credentials) {
      try {
        const response = await authService.login(credentials);
        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken; // <-- LẤY REFRESH TOKEN
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken); // <-- LƯU REFRESH TOKEN

        await this.fetchCurrentUser();
        router.push(this.returnUrl || '/');
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },

        async fetchCurrentUser() {
            if (!this.accessToken) return;
            try {
                const response = await authService.getCurrentUser();
                this.user = response.data; // Dữ liệu từ UserDetailsResponse
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                console.error("Failed to fetch user:", error);
                // Nếu token hết hạn hoặc không hợp lệ, đăng xuất người dùng
                this.logout();
            }
        },

        async register(userInfo) {
            // userInfo tương ứng với RegisterRequest.java
            return authService.register(userInfo);
        },

        async activateAccount(token) {
            return authService.activate(token);
        },

        async handleForgotPassword(email) {
      return authService.forgotPassword(email);
    },
    async handleResetPassword(data) {
    return authService.resetPassword(data);
  },
  async handleChangePassword(passwords) {
      return authService.changePassword(passwords);
    },
async handleGoogleLogin(googleToken) {
      try {
        const response = await authService.loginWithGoogle(googleToken);
        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken; // <-- LẤY REFRESH TOKEN
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken); // <-- LƯU REFRESH TOKEN

        await this.fetchCurrentUser();
        router.push(this.returnUrl || '/');
      } catch (error) {
        console.error("Google Login failed:", error);
        throw error;
      }
    },
        logout() {
      this.accessToken = null;
      this.refreshToken = null; // <-- XÓA REFRESH TOKEN
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken'); // <-- XÓA REFRESH TOKEN
      localStorage.removeItem('user');
      router.push('/login');
    },
    // HÀM MỚI ĐỂ LÀM MỚI TOKEN
    async refreshAccessToken() {
      try {
        const response = await authService.refreshToken(this.refreshToken);
        this.accessToken = response.data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        return this.accessToken;
      } catch (error) {
        // Nếu refresh token cũng hết hạn -> logout
        this.logout();
        return Promise.reject(error);
      }
    },
    }
});