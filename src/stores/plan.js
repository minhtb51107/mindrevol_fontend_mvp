// File: src/stores/plan.js
import { defineStore } from 'pinia';
import planService from '@/api/planService';
import router from '@/router';
import { useAuthStore } from './auth';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null, // currentPlan.dailyTasks sẽ là [{id: Long, description: String, order: Integer}, ...]
    userPlans: [],
    isLoading: false,
    isUserPlansLoading: false,
    error: null,
    userPlansError: null,
  }),

  getters: {
    isCurrentUserMember: (state) => {
      if (!state.currentPlan || !state.currentPlan.members) return false;
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return false;
      const currentUserEmail = authStore.currentUser?.email?.toLowerCase();
      if (!currentUserEmail) return false;
      return state.currentPlan.members.some(
        member => member.userEmail?.toLowerCase() === currentUserEmail
      );
    },
     getUserPlans: (state) => state.userPlans,
     // Getter mới để lấy danh sách tasks hiện tại (đảm bảo không null)
     currentPlanTasks: (state) => state.currentPlan?.dailyTasks || [],
  },

  actions: {
    async createNewPlan(planData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createPlan(planData);
        // Sau khi tạo, fetch lại plan để đảm bảo có ID task đầy đủ
        const shareableLink = response.data.shareableLink;
        if (shareableLink) {
           await this.fetchPlan(shareableLink); // Fetch lại để có ID tasks
           router.push({ name: 'plan-details', params: { shareableLink } });
        } else {
           // Xử lý lỗi nếu không có link trả về
           this.error = "Tạo kế hoạch thành công nhưng không nhận được link chia sẻ.";
        }
      } catch (error) {
        console.error("Lỗi khi tạo kế hoạch:", error);
        this.error = error.response?.data?.message || 'Không thể tạo kế hoạch.';
        throw error;
      } finally {
          this.isLoading = false;
      }
    },

    async fetchPlan(shareableLink) {
      this.isLoading = true;
      this.error = null;
      this.currentPlan = null;
      try {
        const response = await planService.getPlanByShareableLink(shareableLink);
        this.currentPlan = response.data;
        // Đảm bảo dailyTasks là một mảng
        if (!Array.isArray(this.currentPlan.dailyTasks)) {
            this.currentPlan.dailyTasks = [];
        }
      } catch (error) {
        console.error("Lỗi khi tải kế hoạch:", error);
        this.error = "Không tìm thấy kế hoạch hoặc bạn không có quyền truy cập.";
      } finally {
        this.isLoading = false;
      }
    },

    async joinCurrentPlan(shareableLink) {
      if (!shareableLink) {
        console.error("joinCurrentPlan được gọi nhưng thiếu shareableLink");
        throw new Error("Không tìm thấy mã kế hoạch.");
      }
      this.isLoading = true;
      try {
        const response = await planService.joinPlan(shareableLink);
        this.currentPlan = response.data;
        if (!Array.isArray(this.currentPlan.dailyTasks)) {
            this.currentPlan.dailyTasks = [];
        }
        await this.fetchUserPlans();
      } catch (error) {
        console.error("Lỗi khi tham gia kế hoạch:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUserPlans() {
        this.isUserPlansLoading = true;
        this.userPlansError = null;
        try {
            const response = await planService.getMyPlans();
            this.userPlans = response.data;
        } catch (error) {
            console.error("Lỗi khi tải danh sách kế hoạch:", error);
            this.userPlansError = "Không thể tải danh sách kế hoạch của bạn.";
            this.userPlans = [];
        } finally {
            this.isUserPlansLoading = false;
        }
    },

    removePlanFromUserList(planId) {
        this.userPlans = this.userPlans.filter(p => p.id !== planId);
    },

    clearUserPlans() {
        this.userPlans = [];
        this.userPlansError = null;
        this.isUserPlansLoading = false;
        console.log("Cleared user plans.");
    }
  },
});