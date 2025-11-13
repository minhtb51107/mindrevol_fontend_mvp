// File: src/stores/plan.js
import { defineStore } from 'pinia';

import router from '@/router';

import dayjs from 'dayjs';

// [CẬP NHẬT] Service nội bộ feature
import planService from '@/features/plan/services/planService';
// [CẬP NHẬT] Store từ feature khác
import { useAuthStore } from '@/features/auth/stores/authStore';

// Helper debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null, // Thông tin chi tiết của Plan hiện tại
    userPlans: [], // Danh sách các Plan của user (cho sidebar)
    isLoading: false, // Loading cho các thao tác trên currentPlan (fetch, update, archive...)
    isUserPlansLoading: false, // Loading riêng cho danh sách userPlans bên sidebar
    error: null, // Lỗi liên quan đến currentPlan
    userPlansError: null, // Lỗi liên quan đến userPlans

    // Search (cho danh sách userPlans)
    searchTerm: '',
    debouncedFetchUserPlans: null,

    router: router,
  }),

  getters: {
    // Kiểm tra xem user hiện tại có phải là thành viên của currentPlan không
    isCurrentUserMember: (state) => {
        if (!state.currentPlan || !Array.isArray(state.currentPlan.members)) return false;
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated || !authStore.currentUser?.email) return false;
        const currentUserEmailLower = authStore.currentUser.email.toLowerCase();
        return state.currentPlan.members.some(
            member => member.userEmail?.toLowerCase() === currentUserEmailLower
        );
    },
    // Kiểm tra xem user hiện tại có phải là OWNER của currentPlan không
    isCurrentUserOwner: (state) => {
        if (!state.currentPlan || !Array.isArray(state.currentPlan.members)) return false;
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated || !authStore.currentUser?.email) return false;
        const currentUserEmailLower = authStore.currentUser.email.toLowerCase();
        const currentUserMember = state.currentPlan.members.find(
            member => member.userEmail?.toLowerCase() === currentUserEmailLower
        );
        return currentUserMember?.role === 'OWNER';
    },

    getUserPlans: (state) => state.userPlans,
    getSearchTerm: (state) => state.searchTerm,
  },

  actions: {
    // --- SEARCH & LIST ACTIONS ---
    initDebouncedFetch() {
        if (!this.debouncedFetchUserPlans) {
            this.debouncedFetchUserPlans = debounce(this.fetchUserPlans, 500);
        }
    },
    async fetchUserPlans(searchTerm = this.searchTerm) {
        this.isUserPlansLoading = true;
        this.userPlansError = null;
        if (searchTerm !== this.searchTerm) {
             this.searchTerm = searchTerm;
        }
        try {
            const response = await planService.getMyPlans(searchTerm);
            this.userPlans = response.data || [];
        } catch (error) {
            console.error("Lỗi tải danh sách kế hoạch:", error);
            this.userPlansError = error.response?.data?.message || "Không thể tải danh sách kế hoạch.";
            this.userPlans = [];
        } finally {
            this.isUserPlansLoading = false;
        }
    },
    triggerDebouncedFetch(term) {
        if (!this.debouncedFetchUserPlans) {
            this.initDebouncedFetch();
        }
        this.searchTerm = term;
        this.debouncedFetchUserPlans(term);
    },

    async createNewJourney(journeyData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createJourney(journeyData);
        const newJourneySummary = response.data;
        if (newJourneySummary?.shareableLink) {
          // CHUYỂN HƯỚNG TỚI ROUTE MỚI (sẽ tạo ở router/index.js)
          router.push({ 
            name: 'plan-details', // <-- SỬA LẠI THÀNH 'plan-details'
            params: { shareableLink: newJourneySummary.shareableLink } 
          });
          // Tải lại danh sách (vẫn dùng chung API getMyPlans)
          await this.fetchUserPlans();
        }
      } catch (error) {
          console.error("Lỗi tạo hành trình:", error);
          this.error = error.response?.data?.message || 'Không thể tạo hành trình.';
          throw error;
      } finally {
          this.isLoading = false;
      }
    },

    // --- PLAN CRUD ACTIONS ---
    // Tạo Plan nhanh (Bước 1)
    async createNewPlan(planData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createPlan(planData);
        const newPlanDetail = response.data;
        if (newPlanDetail?.shareableLink) {
            this.currentPlan = newPlanDetail;
            router.push({ name: 'plan-details', params: { shareableLink: newPlanDetail.shareableLink } });
            await this.fetchUserPlans();
        }
      } catch (error) {
          console.error("Lỗi tạo kế hoạch:", error);
          this.error = error.response?.data?.message || 'Không thể tạo kế hoạch.';
          throw error;
      } finally {
          this.isLoading = false;
      }
    },

    // Tạo Plan chi tiết (Wizard)
    async createPlanWithSchedule(planData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createPlanWithSchedule(planData);
        const newPlanDetail = response.data;
        if (newPlanDetail?.shareableLink) {
          this.currentPlan = newPlanDetail;
          router.push({ name: 'plan-details', params: { shareableLink: newPlanDetail.shareableLink } });
          await this.fetchUserPlans();
        }
      } catch (error) {
        console.error("Lỗi tạo kế hoạch chi tiết:", error);
        this.error = error.response?.data?.message || 'Không thể tạo kế hoạch chi tiết.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Lấy thông tin chi tiết Plan
    async fetchPlan(shareableLink) {
        this.isLoading = true;
        this.error = null;
        this.currentPlan = null;
        try {
            const response = await planService.getPlanByShareableLink(shareableLink);
            this.currentPlan = response.data;
            if (!Array.isArray(this.currentPlan?.members)) {
                if (this.currentPlan) this.currentPlan.members = [];
            }
        } catch (error) {
            console.error("Lỗi tải kế hoạch:", error);
            this.error = error.response?.data?.message || "Không tìm thấy kế hoạch.";
            this.currentPlan = null;
        } finally {
            this.isLoading = false;
        }
    },

    // --- MEMBERSHIP & STATUS ACTIONS ---
    async joinCurrentPlan(shareableLink) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.joinPlan(shareableLink);
            this.currentPlan = response.data;
            await this.fetchUserPlans();
        } catch (error) {
            this.error = error.response?.data?.message || 'Không thể tham gia kế hoạch.';
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async leaveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
        this.isLoading = true;
        try {
            await planService.leavePlan(this.currentPlan.shareableLink);
            this.removePlanFromUserList(this.currentPlan.id);
            this.currentPlan = null;
            this.router.push('/dashboard');
        } catch (error) {
            this.error = error.response?.data?.message || 'Rời kế hoạch thất bại.';
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async archiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.archivePlan(this.currentPlan.shareableLink);
            this.currentPlan = response.data;
            this.updatePlanInUserList(this.currentPlan);
        } catch (error) {
             this.error = error.response?.data?.message || "Lưu trữ thất bại.";
             throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async unarchiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.unarchivePlan(this.currentPlan.shareableLink);
            this.currentPlan = response.data;
            this.updatePlanInUserList(this.currentPlan);
        } catch (error) {
             this.error = error.response?.data?.message || "Khôi phục thất bại.";
             throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async deletePlanPermanently() {
      if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
      this.isLoading = true;
      try {
        await planService.deletePlanPermanently(this.currentPlan.shareableLink);
        this.removePlanFromUserList(this.currentPlan.id);
        this.currentPlan = null;
        this.router.push('/dashboard');
      } catch (error) {
        this.error = error.response?.data?.message || "Xóa vĩnh viễn thất bại.";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- MANAGEMENT ACTIONS ---
    async updatePlanDetails(planDetails) {
        if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.updatePlanDetails(this.currentPlan.shareableLink, planDetails);
            Object.assign(this.currentPlan, response.data);
            this.updatePlanInUserList(this.currentPlan);
        } catch (error) {
            this.error = error.response?.data?.message || "Cập nhật thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async removeMemberFromCurrentPlan(userId) {
         if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
         this.isLoading = true;
         try {
             await planService.removeMember(this.currentPlan.shareableLink, userId);
             if (this.currentPlan.members) {
                 this.currentPlan.members = this.currentPlan.members.filter(m => m.userId !== userId);
             }
             this.currentPlan.memberCount = Math.max(0, (this.currentPlan.memberCount || 0) - 1);
         } catch (error) {
             this.error = error.response?.data?.message || "Xóa thành viên thất bại.";
             throw error;
         } finally {
             this.isLoading = false;
         }
    },

    async transferPlanOwnership(newOwnerUserId) {
        if (!this.currentPlan?.shareableLink) throw new Error("Missing link");
        this.isLoading = true;
        try {
            await planService.transferOwnership(this.currentPlan.shareableLink, newOwnerUserId);
        } catch (error) {
             this.error = error.response?.data?.message || "Chuyển quyền thất bại.";
             throw error;
        } finally {
            this.isLoading = false;
        }
    },

    // --- HELPERS ---
    removePlanFromUserList(planId) {
        this.userPlans = this.userPlans.filter(p => p.id !== planId);
    },

    updatePlanInUserList(updatedPlanData) {
        if (!updatedPlanData || !updatedPlanData.id) return;
        const index = this.userPlans.findIndex(p => p.id === updatedPlanData.id);
        if (index !== -1) {
            const currentRole = this.userPlans[index].role;
            const updatedSummary = this.mapToPlanSummary(updatedPlanData, currentRole);
            if (updatedSummary) {
                 this.userPlans.splice(index, 1, updatedSummary);
            }
        }
    },

    mapToPlanSummary(plan, role) {
          if (!plan) return null;
          try {
              const startDate = plan.startDate ? dayjs(plan.startDate).format('YYYY-MM-DD') : null;
              const endDate = startDate && plan.durationInDays ? dayjs(startDate).add(plan.durationInDays - 1, 'day').format('YYYY-MM-DD') : null;
              let displayStatus = plan.status;
              if (displayStatus === 'ACTIVE' && endDate && dayjs().isAfter(endDate)) {
                  displayStatus = 'COMPLETED';
              }
              return {
                  id: plan.id,
                  title: plan.title,
                  description: plan.description,
                  durationInDays: plan.durationInDays,
                  startDate: startDate,
                  endDate: endDate,
                  displayStatus: displayStatus,
                  status: plan.status,
                  shareableLink: plan.shareableLink,
                  memberCount: Array.isArray(plan.members) ? plan.members.length : (plan.memberCount ?? 0),
                  role: role
              };
          } catch (e) {
              console.error("Error mapping plan to summary:", e);
              return null;
          }
    },

    clearUserPlans() {
        this.userPlans = [];
        this.searchTerm = '';
        this.userPlansError = null;
    },

    clearCurrentPlanData() {
        this.currentPlan = null;
        this.error = null;
        this.isLoading = false;
    }
  },

  setup() {
      this.initDebouncedFetch();
  }
});