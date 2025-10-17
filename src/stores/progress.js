// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';

export const useProgressStore = defineStore('progress', {
  state: () => ({
    dashboard: null,
    planShareableLink: null, // <-- THÊM DÒNG NÀY
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchDashboard(shareableLink) {
      this.isLoading = true;
      this.planShareableLink = shareableLink; // <-- THÊM DÒNG NÀY
      this.error = null;
      try {
        const response = await progressService.getDashboard(shareableLink);
        this.dashboard = response.data;
      } catch (error) {
        console.error('Lỗi khi tải dashboard:', error);
        this.error = 'Không thể tải dữ liệu tiến độ.';
      } finally {
        this.isLoading = false;
      }
    },

    async logDailyProgress(shareableLink, progressData) {
      try {
        await progressService.logProgress(shareableLink, progressData);
        // Sau khi log thành công, tải lại dashboard để cập nhật giao diện
        await this.fetchDashboard(shareableLink);
      } catch (error) {
        console.error('Lỗi khi ghi nhận tiến độ:', error);
        throw error; // Ném lỗi để component có thể hiển thị
      }
    },
  },
});