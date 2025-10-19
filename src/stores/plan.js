// File: src/stores/plan.js
import { defineStore } from 'pinia';
import planService from '@/api/planService';
import router from '@/router';
import { useAuthStore } from './auth';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null,
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
      // Ensure member emails are compared case-insensitively if needed
      const currentUserEmail = authStore.currentUser?.email?.toLowerCase();
      if (!currentUserEmail) return false;
      return state.currentPlan.members.some(
        member => member.userEmail?.toLowerCase() === currentUserEmail
      );
    },
     // Add getter for user plans if needed, though direct access is fine
     getUserPlans: (state) => state.userPlans,
  },

  actions: {
    async createNewPlan(planData) {
      this.isLoading = true; // Set loading state
      this.error = null;
      try {
        const response = await planService.createPlan(planData);
        this.currentPlan = response.data; // Optionally update current plan
        // Optionally add the new plan to userPlans list immediately
        // await this.fetchUserPlans(); // Or refetch the list
        const shareableLink = response.data.shareableLink;
        if (shareableLink) {
          router.push({ name: 'plan-details', params: { shareableLink } });
        }
      } catch (error) {
        console.error("Lỗi khi tạo kế hoạch:", error);
        this.error = error.response?.data?.message || 'Không thể tạo kế hoạch.'; // Set error state
        throw error; // Re-throw error for component handling
      } finally {
          this.isLoading = false; // Reset loading state
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
        // Handle specific error codes e.g., 404 vs 403
      } finally {
        this.isLoading = false;
      }
    },

    async joinCurrentPlan(shareableLink) {
      if (!shareableLink) {
        console.error("joinCurrentPlan được gọi nhưng thiếu shareableLink");
        throw new Error("Không tìm thấy mã kế hoạch.");
      }
      this.isLoading = true; // Consider a specific joining state?
      try {
        const response = await planService.joinPlan(shareableLink);
        this.currentPlan = response.data;
        // After joining, also update the user's plan list
        await this.fetchUserPlans();
      } catch (error) {
        console.error("Lỗi khi tham gia kế hoạch:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- VERIFY THIS ACTION ---
    async fetchUserPlans() {
        this.isUserPlansLoading = true;
        this.userPlansError = null;
        // Do not clear userPlans here if you want incremental loading or cache
        try {
            const response = await planService.getMyPlans();
            this.userPlans = response.data;
        } catch (error) {
            console.error("Lỗi khi tải danh sách kế hoạch:", error);
            this.userPlansError = "Không thể tải danh sách kế hoạch của bạn.";
            this.userPlans = []; // Clear plans on error
        } finally {
            this.isUserPlansLoading = false;
        }
    },
    // --- END VERIFICATION ---

    removePlanFromUserList(planId) {
        this.userPlans = this.userPlans.filter(p => p.id !== planId);
    },
    
    // --- THÊM ACTION NÀY ---
    clearUserPlans() {
        this.userPlans = [];
        this.userPlansError = null;
        this.isUserPlansLoading = false; // Reset cả trạng thái loading/error
        console.log("Cleared user plans."); // Log để debug
    }
    // --- KẾT THÚC THÊM ---
  },
});