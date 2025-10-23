// File: src/stores/plan.js
import { defineStore } from 'pinia';
import planService from '@/api/planService';
import router from '@/router';
import { useAuthStore } from './auth';

// *** HELPER CHO DEBOUNCE ***
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
// *** KẾT THÚC HELPER ***


export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null,
    userPlans: [],
    isLoading: false,
    isUserPlansLoading: false, // Loading riêng cho danh sách plan
    error: null,
    userPlansError: null,
    isTaskLoading: false,
    taskError: null,
    searchTerm: '', // *** THÊM STATE SEARCH TERM ***
    // Biến lưu trữ hàm debounce
    debouncedFetchUserPlans: null,
  }),

  getters: {
    isCurrentUserMember: (state) => {
      // ... (Giữ nguyên)
      if (!state.currentPlan || !state.currentPlan.members) return false;
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return false;
      const currentUserEmail = authStore.currentUser?.email?.toLowerCase();
      if (!currentUserEmail) return false;
      return state.currentPlan.members.some(
        member => member.userEmail?.toLowerCase() === currentUserEmail
      );
    },
    isCurrentUserOwner: (state) => {
      // ... (Giữ nguyên)
      if (!state.currentPlan || !state.currentPlan.members) return false;
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return false;
      const currentUserEmail = authStore.currentUser?.email?.toLowerCase();
      if (!currentUserEmail) return false;
      const currentUserMember = state.currentPlan.members.find(
          member => member.userEmail?.toLowerCase() === currentUserEmail
      );
      return currentUserMember?.role === 'OWNER';
    },
     getUserPlans: (state) => state.userPlans,
     currentPlanTasks: (state) => state.currentPlan?.dailyTasks || [],
     // *** GETTER CHO SEARCH TERM ***
     getSearchTerm: (state) => state.searchTerm,
  },

  actions: {
    // *** KHỞI TẠO DEBOUNCE KHI STORE ĐƯỢC TẠO ***
    initDebouncedFetch() {
        if (!this.debouncedFetchUserPlans) {
            this.debouncedFetchUserPlans = debounce(this.fetchUserPlans, 500); // 500ms delay
        }
    },
    // *** CẬP NHẬT ACTION NÀY ***
    async fetchUserPlans(searchTerm = this.searchTerm) { // Nhận searchTerm hoặc lấy từ state
        this.isUserPlansLoading = true;
        this.userPlansError = null;
        // Cập nhật searchTerm trong state nếu nó được truyền vào
        if (searchTerm !== this.searchTerm) {
             this.searchTerm = searchTerm;
        }
        try {
            // Truyền searchTerm vào service
            const response = await planService.getMyPlans(searchTerm);
            this.userPlans = response.data;
        } catch (error) {
            console.error("Lỗi khi tải danh sách kế hoạch:", error);
            this.userPlansError = "Không thể tải danh sách kế hoạch của bạn.";
            this.userPlans = []; // Reset list khi có lỗi
        } finally {
            this.isUserPlansLoading = false;
        }
    },
    // *** ACTION MỚI ĐỂ TRIGGER DEBOUNCED FETCH ***
    triggerDebouncedFetch(term) {
        if (!this.debouncedFetchUserPlans) {
            this.initDebouncedFetch(); // Khởi tạo nếu chưa có
        }
        // Cập nhật searchTerm ngay lập tức để input phản hồi
        this.searchTerm = term;
        // Gọi hàm đã được debounce
        this.debouncedFetchUserPlans(term);
    },

    // ... (Các actions khác: createNewPlan, fetchPlan, joinCurrentPlan, etc. giữ nguyên) ...
    async createNewPlan(planData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createPlan(planData);
        const shareableLink = response.data.shareableLink;
        if (shareableLink) {
           await this.fetchPlan(shareableLink);
           router.push({ name: 'plan-details', params: { shareableLink } });
           await this.fetchUserPlans(); // Fetch lại danh sách sau khi tạo mới
        } else {
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
        if (!Array.isArray(this.currentPlan.dailyTasks)) {
            this.currentPlan.dailyTasks = [];
        } else {
            this.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      this.error = null; // Clear previous error on new attempt
      try {
        const response = await planService.joinPlan(shareableLink);
        this.currentPlan = response.data;
        if (!Array.isArray(this.currentPlan.dailyTasks)) {
            this.currentPlan.dailyTasks = [];
        } else {
             this.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        await this.fetchUserPlans(); // Cập nhật danh sách plan của user
      } catch (error) {
        console.error("Lỗi khi tham gia kế hoạch:", error);
        this.error = error.response?.data?.message || 'Không thể tham gia kế hoạch.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    removePlanFromUserList(planId) {
        this.userPlans = this.userPlans.filter(p => p.id !== planId);
    },

    clearUserPlans() {
        this.userPlans = [];
        this.userPlansError = null;
        this.isUserPlansLoading = false;
        this.searchTerm = ''; // Reset cả search term
        console.log("Cleared user plans.");
    },

    async addTaskToCurrentPlan(taskData) {
        if (!this.currentPlan?.shareableLink) {
            this.taskError = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        this.isTaskLoading = true;
        this.taskError = null;
        try {
            const response = await planService.addTask(this.currentPlan.shareableLink, taskData);
            const newTask = response.data;
            if (this.currentPlan.dailyTasks) {
                this.currentPlan.dailyTasks.push(newTask);
            } else {
                this.currentPlan.dailyTasks = [newTask];
            }
        } catch (error) {
            console.error("Lỗi khi thêm công việc:", error);
            this.taskError = error.response?.data?.message || "Thêm công việc thất bại.";
            throw error;
        } finally {
            this.isTaskLoading = false;
        }
    },

    async updateTaskInCurrentPlan(taskId, taskData) {
        if (!this.currentPlan?.shareableLink) {
            this.taskError = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        this.isTaskLoading = true;
        this.taskError = null;
        try {
            const response = await planService.updateTask(this.currentPlan.shareableLink, taskId, taskData);
            const updatedTask = response.data;
            const taskIndex = this.currentPlan.dailyTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                this.currentPlan.dailyTasks[taskIndex] = {
                    ...this.currentPlan.dailyTasks[taskIndex],
                    ...updatedTask
                };
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật công việc:", error);
            this.taskError = error.response?.data?.message || "Cập nhật công việc thất bại.";
            throw error;
        } finally {
            this.isTaskLoading = false;
        }
    },

    async deleteTaskFromCurrentPlan(taskId) {
        if (!this.currentPlan?.shareableLink) {
            this.taskError = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        this.isTaskLoading = true;
        this.taskError = null;
        try {
            await planService.deleteTask(this.currentPlan.shareableLink, taskId);
            const taskIndex = this.currentPlan.dailyTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const removedOrder = this.currentPlan.dailyTasks[taskIndex].order;
                this.currentPlan.dailyTasks.splice(taskIndex, 1);
                this.currentPlan.dailyTasks.forEach(task => {
                    if (task.order > removedOrder) {
                        task.order -= 1;
                    }
                });
                this.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            }
        } catch (error) {
            console.error("Lỗi khi xóa công việc:", error);
            this.taskError = error.response?.data?.message || "Xóa công việc thất bại.";
            throw error;
        } finally {
            this.isTaskLoading = false;
        }
    },

    async removeMemberFromCurrentPlan(userId) {
        if (!this.currentPlan?.shareableLink) {
            this.error = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        if (!this.isCurrentUserOwner) {
            this.error = "Bạn không có quyền xóa thành viên.";
            throw new Error("Permission denied");
        }

        this.isLoading = true;
        this.error = null;
        try {
            await planService.removeMember(this.currentPlan.shareableLink, userId);
            if (this.currentPlan.members) {
                 const memberIndex = this.currentPlan.members.findIndex(member => member.userId === userId);
                 if (memberIndex > -1) {
                     this.currentPlan.members.splice(memberIndex, 1);
                 }
            }
             if (this.currentPlan.memberCount && this.currentPlan.memberCount > 0) {
                 this.currentPlan.memberCount -= 1;
            }

        } catch (error) {
            console.error("Lỗi khi xóa thành viên:", error);
            this.error = error.response?.data?.message || "Xóa thành viên thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async archiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) {
            this.error = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        if (!this.isCurrentUserOwner) {
            this.error = "Bạn không có quyền lưu trữ kế hoạch này.";
            throw new Error("Permission denied");
        }

        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.archivePlan(this.currentPlan.shareableLink);
            this.currentPlan = response.data;
            const index = this.userPlans.findIndex(p => p.id === this.currentPlan.id);
            if (index !== -1) {
                // Cập nhật plan trong danh sách userPlans với dữ liệu mới từ response
                 this.userPlans[index] = {
                    ...this.userPlans[index], // Giữ lại các trường cũ như `role`
                    ...this.planMapper.toPlanSummaryResponse({ // Giả sử có mapper này hoặc map thủ công
                        plan: this.currentPlan,
                        role: this.userPlans[index].role // Giữ lại role cũ
                    })
                 };
                 // Hoặc đơn giản chỉ cập nhật status:
                 // this.userPlans[index].displayStatus = this.currentPlan.displayStatus;
            }

        } catch (error) {
            console.error("Lỗi khi lưu trữ kế hoạch:", error);
            this.error = error.response?.data?.message || "Lưu trữ kế hoạch thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async unarchiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) {
            this.error = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        if (!this.isCurrentUserOwner) {
            this.error = "Bạn không có quyền khôi phục kế hoạch này.";
            throw new Error("Permission denied");
        }

        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.unarchivePlan(this.currentPlan.shareableLink);
            this.currentPlan = response.data;
             const index = this.userPlans.findIndex(p => p.id === this.currentPlan.id);
             if (index !== -1) {
                 // Cập nhật tương tự như archive
                  this.userPlans[index] = {
                    ...this.userPlans[index],
                     ...this.planMapper.toPlanSummaryResponse({
                        plan: this.currentPlan,
                        role: this.userPlans[index].role
                    })
                 };
                // Hoặc: this.userPlans[index].displayStatus = this.currentPlan.displayStatus;
             }
        } catch (error) {
            console.error("Lỗi khi khôi phục kế hoạch:", error);
            this.error = error.response?.data?.message || "Khôi phục kế hoạch thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
     // *** Giả định planMapper có sẵn hoặc bạn tạo helper tương tự ***
     planMapper: {
         toPlanSummaryResponse({ plan, role }) {
             if (!plan) return null;
             const startDate = plan.startDate;
             const endDate = startDate ? new Date(new Date(startDate).setDate(new Date(startDate).getDate() + plan.durationInDays - 1)).toISOString().split('T')[0] : null; // Tính endDate
             // Logic tính displayStatus (cần đồng bộ với backend)
             let displayStatus = plan.status;
             if (plan.status === 'ACTIVE' && endDate && new Date() > new Date(endDate)) {
                 displayStatus = 'COMPLETED';
             }
             return {
                 id: plan.id,
                 title: plan.title,
                 description: plan.description,
                 durationInDays: plan.durationInDays,
                 startDate: plan.startDate,
                 endDate: endDate,
                 displayStatus: displayStatus,
                 shareableLink: plan.shareableLink,
                 memberCount: plan.members?.length || 0, // Cập nhật memberCount
                 role: role // Giữ role từ dữ liệu cũ
             };
         }
     },

     // *** ACTION MỚI CHO REORDER TASK ***
    async reorderTasksInCurrentPlan(orderedTasks) { // Nhận mảng task đã sắp xếp từ vuedraggable
        if (!this.currentPlan?.shareableLink) {
            this.taskError = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        if (!this.isCurrentUserOwner) {
            this.taskError = "Bạn không có quyền sắp xếp công việc.";
            throw new Error("Permission denied");
        }

        const originalTasks = JSON.parse(JSON.stringify(this.currentPlan.dailyTasks)); // Lưu lại thứ tự cũ để rollback
        const orderedTaskIds = orderedTasks.map(task => task.id); // Lấy danh sách ID theo thứ tự mới

        // Optimistic Update: Cập nhật state ngay lập tức
        this.currentPlan.dailyTasks = orderedTasks.map((task, index) => ({ ...task, order: index })); // Cập nhật order trong state
        console.log("Optimistic UI update for reorder:", this.currentPlan.dailyTasks.map(t => t.description));


        this.isTaskLoading = true; // Sử dụng loading task
        this.taskError = null;
        try {
            // Gọi API với danh sách ID đã sắp xếp
            await planService.reorderTasks(this.currentPlan.shareableLink, orderedTaskIds);
            console.log("API call for reorder successful.");
            // Không cần làm gì thêm vì UI đã cập nhật và backend đã gửi WebSocket (nếu có user khác xem)
        } catch (error) {
            console.error("Lỗi khi sắp xếp công việc:", error);
            this.taskError = error.response?.data?.message || "Sắp xếp công việc thất bại.";

            // Rollback: Khôi phục lại thứ tự ban đầu trong state nếu API lỗi
            this.currentPlan.dailyTasks = originalTasks;
            console.log("Rollback UI after reorder error.");

            throw error; // Ném lỗi để component xử lý (ví dụ: hiển thị snackbar lỗi)
        } finally {
            this.isTaskLoading = false;
        }
    },
    // *** KẾT THÚC ACTION MỚI ***
    async transferPlanOwnership(newOwnerUserId) {
        if (!this.currentPlan?.shareableLink) {
            this.error = "Không tìm thấy kế hoạch hiện tại.";
            throw new Error("Missing current plan link");
        }
        if (!this.isCurrentUserOwner) {
            this.error = "Bạn không có quyền chuyển quyền sở hữu.";
            throw new Error("Permission denied");
        }
        if (!newOwnerUserId) {
             this.error = "Chưa chọn người nhận quyền sở hữu.";
             throw new Error("New owner ID is required");
        }

        this.isLoading = true; // Sử dụng loading chung
        this.error = null;
        try {
            await planService.transferOwnership(this.currentPlan.shareableLink, newOwnerUserId);
            // Không cần cập nhật UI ngay lập tức vì sẽ nhận qua WebSocket
            console.log("Transfer ownership request sent successfully.");
            // Có thể cập nhật UI ngay (optimistic) nếu muốn phản hồi nhanh hơn,
            // nhưng cần xử lý rollback nếu API lỗi. Ví dụ:
            /*
            const oldOwnerMember = this.currentPlan.members.find(m => m.role === 'OWNER');
            const newOwnerMember = this.currentPlan.members.find(m => m.userId === newOwnerUserId);
            if (oldOwnerMember) oldOwnerMember.role = 'MEMBER';
            if (newOwnerMember) newOwnerMember.role = 'OWNER';
            */
        } catch (error) {
            console.error("Lỗi khi chuyển quyền sở hữu:", error);
            this.error = error.response?.data?.message || "Chuyển quyền sở hữu thất bại.";
            // Rollback optimistic update nếu có
            throw error; // Ném lỗi để component xử lý
        } finally {
            this.isLoading = false;
        }
    },
  },

  // *** Gọi initDebouncedFetch khi store được tạo ***
  setup() {
      this.initDebouncedFetch();
  }
});