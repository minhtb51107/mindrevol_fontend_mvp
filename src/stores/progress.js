// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';

export const useProgressStore = defineStore('progress', {
  state: () => ({
    dashboard: null,
    // Đảm bảo state này được dùng nhất quán
    currentPlanShareableLink: null, // Đổi tên để rõ ràng hơn
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchDashboard(shareableLink) {
      // Luôn kiểm tra và cập nhật link hiện tại khi fetch
      if (!shareableLink) {
         console.error("fetchDashboard được gọi mà không có shareableLink!");
         this.error = "Không thể tải dữ liệu tiến độ (thiếu mã kế hoạch).";
         return; // Không gọi API nếu link không hợp lệ
      }
      this.isLoading = true;
      this.currentPlanShareableLink = shareableLink; // Cập nhật link hiện tại
      this.error = null;
      try {
        // Truyền link vào API call
        const response = await progressService.getDashboard(shareableLink);
        this.dashboard = response.data;
      } catch (error) {
        console.error('Lỗi khi tải dashboard:', error);
        this.error = 'Không thể tải dữ liệu tiến độ.';
         // Không reset currentPlanShareableLink ở đây
      } finally {
        this.isLoading = false;
      }
    },

    async logDailyProgress(shareableLink, progressData) {
       if (!shareableLink) {
           console.error("logDailyProgress thiếu shareableLink");
           throw new Error("Không tìm thấy mã kế hoạch.");
       }
      try {
        await progressService.logProgress(shareableLink, progressData);
        // Sau khi log thành công, tải lại dashboard DÙNG LINK ĐÃ LƯU
        if (this.currentPlanShareableLink) {
            await this.fetchDashboard(this.currentPlanShareableLink);
        } else {
             await this.fetchDashboard(shareableLink); // Hoặc dùng link từ tham số
        }
      } catch (error) {
        console.error('Lỗi khi ghi nhận tiến độ:', error);
        throw error;
      }
    },

    // Action để xóa dữ liệu khi cần (ví dụ khi rời plan)
    clearDashboard() {
        this.dashboard = null;
        this.currentPlanShareableLink = null;
        this.isLoading = false;
        this.error = null;
    }
  },
});