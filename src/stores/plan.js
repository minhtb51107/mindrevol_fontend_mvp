// File: src/stores/plan.js (Đã có đủ hàm)

import { defineStore } from 'pinia';
import planService from '@/api/planService';
import router from '@/router';
import { useAuthStore } from './auth';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isCurrentUserMember: (state) => {
      if (!state.currentPlan || !state.currentPlan.members) return false;
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return false;
      return state.currentPlan.members.some(
        member => member.userEmail === authStore.currentUser.email
      );
    },
  },

  actions: {
    async createNewPlan(planData) {
      try {
        const response = await planService.createPlan(planData);
        this.currentPlan = response.data;
        const shareableLink = response.data.shareableLink;
        if (shareableLink) {
          router.push({ name: 'plan-details', params: { shareableLink } });
        }
      } catch (error) {
        console.error("Lỗi khi tạo kế hoạch:", error);
        throw error;
      }
    },

    async fetchPlan(shareableLink) {
      this.isLoading = true;
      this.error = null;
      this.currentPlan = null;
      try {
        const response = await planService.getPlanByShareableLink(shareableLink);
        this.currentPlan = response.data;
      } catch (error) {
        console.error("Lỗi khi tải kế hoạch:", error);
        this.error = "Không tìm thấy kế hoạch hoặc bạn không có quyền truy cập.";
      } finally {
        this.isLoading = false;
      }
    },

    async joinCurrentPlan() {
      if (!this.currentPlan) return;
      this.isLoading = true;
      try {
        const response = await planService.joinPlan(this.currentPlan.shareableLink);
        this.currentPlan = response.data;
      } catch (error) {
        console.error("Lỗi khi tham gia kế hoạch:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  },
});