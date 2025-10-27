// File: src/stores/plan.js
import { defineStore } from 'pinia';
import planService from '@/api/planService';
import router from '@/router';
import { useAuthStore } from './auth';
import dayjs from 'dayjs'; // Import dayjs
// Giả sử progress store có thể import được để lấy selectedDate
// import { useProgressStore } from './progress'; // Tạm thời comment vì có thể gây cyclic dependency

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
    currentPlan: null, // Chỉ chứa thông tin plan (title, description, members, etc.), KHÔNG chứa task list nữa
    userPlans: [], // Danh sách các plan của user (PlanSummaryResponse)
    isLoading: false, // Loading cho plan info (currentPlan)
    isUserPlansLoading: false, // Loading riêng cho danh sách userPlans
    error: null, // Error cho plan info
    userPlansError: null, // Error cho danh sách userPlans

    // --- STATE MỚI CHO TASK THEO NGÀY (CỘT PHẢI) ---
    currentDailyTasks: [], // Danh sách task cho ngày đang chọn (TaskResponse[])
    isLoadingDailyTasks: false,
    dailyTasksError: null,

    // Task CRUD loading/error (vẫn dùng chung cho add/update/delete/reorder)
    isTaskLoading: false,
    taskError: null,

    // Search (cho danh sách userPlans)
    searchTerm: '',
    debouncedFetchUserPlans: null,
  }),

  getters: {
    // Kiểm tra thành viên dựa trên currentPlan.members
    isCurrentUserMember: (state) => {
        if (!state.currentPlan || !Array.isArray(state.currentPlan.members)) return false;
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated || !authStore.currentUser?.email) return false;
        const currentUserEmailLower = authStore.currentUser.email.toLowerCase();
        return state.currentPlan.members.some(
            member => member.userEmail?.toLowerCase() === currentUserEmailLower
        );
    },
    // Kiểm tra chủ sở hữu dựa trên currentPlan.members
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

    // --- GETTER MỚI ---
    // Trả về danh sách task của ngày hiện tại, đã sắp xếp theo 'order'
    getCurrentDailyTasksSorted: (state) => {
        // Tạo bản sao và sắp xếp, đảm bảo không thay đổi state gốc
        return [...state.currentDailyTasks].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    },

    getSearchTerm: (state) => state.searchTerm,
  },

  actions: {
    // Khởi tạo hàm debounce cho việc fetch user plans
    initDebouncedFetch() {
        if (!this.debouncedFetchUserPlans) {
            this.debouncedFetchUserPlans = debounce(this.fetchUserPlans, 500); // 500ms delay
        }
    },
    // Fetch danh sách plan của user, có hỗ trợ tìm kiếm
    async fetchUserPlans(searchTerm = this.searchTerm) {
        this.isUserPlansLoading = true;
        this.userPlansError = null;
        // Cập nhật searchTerm trong state nếu nó khác
        if (searchTerm !== this.searchTerm) {
             this.searchTerm = searchTerm;
        }
        console.log(`PlanStore: Fetching user plans with search term: "${searchTerm}"`);
        try {
            const response = await planService.getMyPlans(searchTerm);
            this.userPlans = response.data || []; // Đảm bảo là array
            console.log("PlanStore: User plans fetched:", this.userPlans.length);
        } catch (error) {
            console.error("Lỗi khi tải danh sách kế hoạch:", error);
            this.userPlansError = error.response?.data?.message || "Không thể tải danh sách kế hoạch của bạn.";
            this.userPlans = []; // Reset list khi có lỗi
        } finally {
            this.isUserPlansLoading = false;
        }
    },
    // Trigger hàm fetchUserPlans đã được debounce khi user nhập vào ô tìm kiếm
    triggerDebouncedFetch(term) {
        if (!this.debouncedFetchUserPlans) {
            this.initDebouncedFetch(); // Khởi tạo nếu chưa có
        }
        // Cập nhật searchTerm ngay lập tức để input phản hồi
        this.searchTerm = term;
        // Gọi hàm đã được debounce
        this.debouncedFetchUserPlans(term);
    },

    // Tạo plan mới
    async createNewPlan(planData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await planService.createPlan(planData);
        const newPlanDetail = response.data; // API trả về PlanDetailResponse
        const shareableLink = newPlanDetail?.shareableLink;
        if (shareableLink) {
            // Không cần fetchPlan nữa vì đã có detail
            this.currentPlan = newPlanDetail;
            // Chuyển đến trang chi tiết
            router.push({ name: 'plan-details', params: { shareableLink } });
            // Fetch lại danh sách plan của user để cập nhật
            await this.fetchUserPlans();
        } else {
            console.error("Create plan response missing shareableLink:", newPlanDetail);
            this.error = "Tạo kế hoạch thành công nhưng có lỗi xảy ra khi nhận link chia sẻ.";
        }
      } catch (error) {
          console.error("Lỗi khi tạo kế hoạch:", error);
          this.error = error.response?.data?.message || 'Không thể tạo kế hoạch.';
          throw error; // Ném lỗi ra để component xử lý
      } finally {
          this.isLoading = false;
      }
    },

    // --- CẬP NHẬT: fetchPlan chỉ lấy thông tin plan, không lấy task ---
    async fetchPlan(shareableLink) {
        console.log(`PlanStore: Fetching plan details for ${shareableLink}...`);
        this.isLoading = true;
        this.error = null;
        this.currentPlan = null;
        // Reset cả task của ngày cũ khi fetch plan mới
        this.clearDailyTasks();
        try {
            const response = await planService.getPlanByShareableLink(shareableLink);
            // API chỉ trả về thông tin plan (PlanDetailResponse hoặc PlanPublicResponse)
            // Không còn trường `dailyTasks` ở đây nữa
            this.currentPlan = response.data;
            // Kiểm tra và đảm bảo members là array
            if (!Array.isArray(this.currentPlan?.members)) {
                if (this.currentPlan) this.currentPlan.members = [];
                console.warn("Plan details response missing or invalid 'members' array.");
            }
            console.log("PlanStore: Fetched plan details (without tasks)", this.currentPlan);
        } catch (error) {
            console.error("Lỗi khi tải kế hoạch:", error);
            this.error = error.response?.data?.message || "Không tìm thấy kế hoạch hoặc bạn không có quyền truy cập.";
            this.currentPlan = null; // Reset plan khi lỗi
        } finally {
            this.isLoading = false;
        }
    },

    // --- ACTION MỚI: Fetch task cho ngày cụ thể ---
    async fetchDailyTasks(shareableLink, date) {
        // Kiểm tra đầu vào
        if (!shareableLink || !date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
            this.dailyTasksError = "Không thể tải công việc (thiếu mã kế hoạch hoặc ngày không hợp lệ).";
            this.currentDailyTasks = [];
            console.error("fetchDailyTasks called with invalid arguments:", { shareableLink, date });
            return;
        }
        const formattedDate = dayjs(date).format('YYYY-MM-DD'); // Đảm bảo format đúng
        console.log(`PlanStore: Fetching tasks for ${shareableLink} on ${formattedDate}...`);
        this.isLoadingDailyTasks = true;
        this.dailyTasksError = null;
        try {
            const response = await planService.getTasksByDate(shareableLink, formattedDate);
            this.currentDailyTasks = response.data || []; // Gán kết quả, đảm bảo là array
             // Sắp xếp lại lần nữa để chắc chắn đúng thứ tự 'order'
             this.currentDailyTasks.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
            console.log(`PlanStore: Daily tasks fetched for ${formattedDate}:`, this.currentDailyTasks.length);
        } catch (error) {
            console.error(`Lỗi khi tải công việc ngày ${formattedDate}:`, error);
            this.dailyTasksError = error.response?.data?.message || `Không thể tải công việc cho ngày ${formattedDate}.`;
            this.currentDailyTasks = []; // Reset về rỗng khi lỗi
        } finally {
            this.isLoadingDailyTasks = false;
        }
    },
    // Action để xóa task list hiện tại (ví dụ khi đổi ngày hoặc rời plan)
    clearDailyTasks() {
        this.currentDailyTasks = [];
        this.isLoadingDailyTasks = false;
        this.dailyTasksError = null;
    },

    // Tham gia plan
    async joinCurrentPlan(shareableLink) {
        if (!shareableLink) {
            console.error("joinCurrentPlan được gọi nhưng thiếu shareableLink");
            throw new Error("Không tìm thấy mã kế hoạch.");
        }
        this.isLoading = true;
        this.error = null;
        try {
            const response = await planService.joinPlan(shareableLink);
            // API trả về PlanDetailResponse mới sau khi join
            this.currentPlan = response.data;
            // Đảm bảo members là array
            if (!Array.isArray(this.currentPlan?.members)) {
                 if (this.currentPlan) this.currentPlan.members = [];
            }
            console.log("PlanStore: Joined plan successfully.", this.currentPlan);
            await this.fetchUserPlans(); // Cập nhật danh sách plan của user
        } catch (error) {
            console.error("Lỗi khi tham gia kế hoạch:", error);
            this.error = error.response?.data?.message || 'Không thể tham gia kế hoạch.';
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    // Xóa plan khỏi danh sách user (UI helper)
    removePlanFromUserList(planId) {
        this.userPlans = this.userPlans.filter(p => p.id !== planId);
    },
    // Xóa danh sách plan của user (khi logout)
    clearUserPlans() {
        this.userPlans = [];
        this.userPlansError = null;
        this.isUserPlansLoading = false;
        this.searchTerm = ''; // Reset cả search term
        console.log("PlanStore: Cleared user plans list.");
    },

    // --- CẬP NHẬT CÁC ACTION CRUD TASK ---
    async addTaskToCurrentPlan(taskData) { // taskData phải có taskDate dạng 'YYYY-MM-DD'
        if (!this.currentPlan?.shareableLink) {
             this.taskError = "Không tìm thấy kế hoạch hiện tại.";
             throw new Error("Missing current plan link");
        }
        if (!taskData.taskDate || !dayjs(taskData.taskDate, 'YYYY-MM-DD', true).isValid()) {
             this.taskError = "Ngày thực hiện công việc không hợp lệ hoặc bị thiếu.";
             throw new Error("Invalid or missing taskDate");
        }
        const targetDate = taskData.taskDate; // Ngày sẽ thêm task vào
        console.log(`PlanStore: Adding task to ${targetDate}...`, taskData);
        this.isTaskLoading = true;
        this.taskError = null;
        try {
            // Gọi API để thêm task
            await planService.addTask(this.currentPlan.shareableLink, taskData);
            console.log(`PlanStore: Task added successfully on ${targetDate}.`);
            // Sau khi thêm thành công, fetch lại task list của ngày đó để cập nhật UI
            await this.fetchDailyTasks(this.currentPlan.shareableLink, targetDate);
        } catch (error) {
            console.error("Lỗi khi thêm công việc:", error);
            this.taskError = error.response?.data?.message || "Thêm công việc thất bại.";
            throw error; // Ném lỗi ra
        } finally {
            this.isTaskLoading = false;
        }
    },

    async updateTaskInCurrentPlan(taskId, taskData, originalTaskDate) { // Cần biết ngày gốc của task
        if (!this.currentPlan?.shareableLink) { /* lỗi */ throw new Error("Missing current plan link"); }
        if (!originalTaskDate || !dayjs(originalTaskDate, 'YYYY-MM-DD', true).isValid()) {
             this.taskError = "Không xác định được ngày gốc của công việc.";
             throw new Error("Invalid or missing originalTaskDate");
        }
        console.log(`PlanStore: Updating task ${taskId} on ${originalTaskDate}...`, taskData);
        this.isTaskLoading = true;
        this.taskError = null;

        try {
            // Gọi API để cập nhật task
            await planService.updateTask(this.currentPlan.shareableLink, taskId, taskData);
            console.log(`PlanStore: Task ${taskId} updated successfully.`);

            // Xác định ngày cần fetch lại
            const targetDate = taskData.taskDate || originalTaskDate; // Ngày mới nếu có, nếu không thì ngày cũ
            const dateChanged = taskData.taskDate && taskData.taskDate !== originalTaskDate;

            // Fetch lại danh sách task cho ngày target (ngày mới hoặc ngày cũ)
            await this.fetchDailyTasks(this.currentPlan.shareableLink, targetDate);

            // Nếu ngày bị thay đổi, fetch lại cả ngày cũ để xóa task khỏi danh sách đó
            if (dateChanged) {
                 console.log(`PlanStore: Task moved from ${originalTaskDate} to ${targetDate}. Refetching old date...`);
                 await this.fetchDailyTasks(this.currentPlan.shareableLink, originalTaskDate);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật công việc:", error);
            this.taskError = error.response?.data?.message || "Cập nhật công việc thất bại.";
            throw error;
        } finally {
            this.isTaskLoading = false;
        }
    },

    async deleteTaskFromCurrentPlan(taskId, taskDate) { // Cần biết ngày của task bị xóa
        if (!this.currentPlan?.shareableLink) { /* lỗi */ throw new Error("Missing current plan link"); }
         if (!taskDate || !dayjs(taskDate, 'YYYY-MM-DD', true).isValid()) {
             this.taskError = "Không xác định được ngày của công việc cần xóa.";
             throw new Error("Invalid or missing taskDate for delete");
         }
        console.log(`PlanStore: Deleting task ${taskId} from ${taskDate}...`);
        this.isTaskLoading = true;
        this.taskError = null;

        try {
            // Gọi API để xóa task
            await planService.deleteTask(this.currentPlan.shareableLink, taskId);
            console.log(`PlanStore: Task ${taskId} deleted successfully from ${taskDate}.`);
            // Fetch lại danh sách task của ngày đó để cập nhật UI
            await this.fetchDailyTasks(this.currentPlan.shareableLink, taskDate);
        } catch (error) {
            console.error("Lỗi khi xóa công việc:", error);
            this.taskError = error.response?.data?.message || "Xóa công việc thất bại.";
            throw error;
        } finally {
            this.isTaskLoading = false;
        }
    },

    async reorderTasksInCurrentPlan(taskDate, orderedTasks) { // orderedTasks là mảng task đã sắp xếp trên UI
        if (!this.currentPlan?.shareableLink) { /* lỗi */ throw new Error("Missing current plan link"); }
        if (!this.isCurrentUserOwner) { /* lỗi */ throw new Error("Permission denied"); }
        if (!taskDate || !dayjs(taskDate, 'YYYY-MM-DD', true).isValid()) { /* lỗi */ throw new Error("Invalid taskDate for reorder"); }

        console.log(`PlanStore: Reordering tasks for ${taskDate}...`);
        const originalTasks = JSON.parse(JSON.stringify(this.currentDailyTasks)); // Lưu trạng thái cũ để rollback
        const orderedTaskIds = orderedTasks.map(task => task.id); // Lấy danh sách ID theo thứ tự mới

        // Optimistic Update: Cập nhật state ngay lập tức để UI phản hồi nhanh
        this.currentDailyTasks = orderedTasks.map((task, index) => ({ ...task, order: index }));
        console.log("PlanStore: Optimistic UI update for reorder completed.");

        this.isTaskLoading = true; // Sử dụng loading task chung
        this.taskError = null;
        try {
            // Gọi API với taskDate và danh sách ID đã sắp xếp
            await planService.reorderTasks(this.currentPlan.shareableLink, taskDate, orderedTaskIds);
            console.log(`PlanStore: API call for reorder on ${taskDate} successful.`);
            // API thành công, không cần làm gì thêm vì UI đã cập nhật
            // WebSocket (nếu có) sẽ xử lý cho các user khác
        } catch (error) {
            console.error("Lỗi khi sắp xếp công việc:", error);
            this.taskError = error.response?.data?.message || "Sắp xếp công việc thất bại.";
            // Rollback: Khôi phục lại thứ tự ban đầu trong state nếu API lỗi
            this.currentDailyTasks = originalTasks;
            console.log("PlanStore: Rollback UI after reorder error.");
            throw error; // Ném lỗi để component xử lý (ví dụ: hiển thị snackbar lỗi)
        } finally {
            this.isTaskLoading = false;
        }
    },
    // --- KẾT THÚC CẬP NHẬT CRUD TASK ---

    // --- CẬP NHẬT: Xử lý WebSocket cho Task List ---
    // Action này cần được gọi từ component PlanDetailView khi nhận WebSocket message
    handleTaskWebSocketUpdate(updateData, currentlySelectedDate) {
        const { type, taskDate } = updateData;

        // Chỉ xử lý các type liên quan đến task list
        const relevantTypes = ['NEW_TASK', 'UPDATE_TASK', 'MOVE_TASK', 'DELETE_TASK', 'REORDER_TASKS'];
        if (!relevantTypes.includes(type)) {
            // console.log("PlanStore: Ignoring irrelevant WebSocket update type:", type);
            return;
        }

        if (!taskDate || !dayjs(taskDate, 'YYYY-MM-DD', true).isValid()) {
            console.warn("PlanStore: Received task WebSocket update without valid taskDate. Ignoring.", updateData);
            return;
        }
         if (!currentlySelectedDate || !dayjs(currentlySelectedDate, 'YYYY-MM-DD', true).isValid()) {
            console.warn("PlanStore: handleTaskWebSocketUpdate called without valid currentlySelectedDate. Ignoring.", currentlySelectedDate);
            return;
         }

        console.log(`PlanStore: Received WebSocket task update (${type}) for date ${taskDate}. Currently viewing ${currentlySelectedDate}.`);

        // Chỉ fetch lại danh sách task nếu ngày của sự kiện trùng với ngày đang xem
        if (this.currentPlan?.shareableLink && taskDate === currentlySelectedDate) {
             console.log(`PlanStore: Task update matches selected date. Refetching tasks for ${currentlySelectedDate}...`);
             // Có thể thêm debounce nhỏ ở đây nếu muốn
             this.fetchDailyTasks(this.currentPlan.shareableLink, currentlySelectedDate);
        }
        // Đặc biệt xử lý MOVE_TASK: Nếu task bị *chuyển đi* từ ngày đang xem
        else if (type === 'MOVE_TASK' && this.currentPlan?.shareableLink && updateData.originalTaskDate === currentlySelectedDate) {
             console.log(`PlanStore: Task moved away from selected date (${currentlySelectedDate}). Refetching tasks...`);
             this.fetchDailyTasks(this.currentPlan.shareableLink, currentlySelectedDate);
        }
         else {
            console.log(`PlanStore: Task update date (${taskDate}) does not match selected date (${currentlySelectedDate}). Ignoring refetch.`);
            // (Optional) Có thể thêm logic đánh dấu ngày 'taskDate' có cập nhật mới
        }
    },

    // --- Các action quản lý Member/Status/Ownership (Giữ nguyên logic gọi API) ---
    async removeMemberFromCurrentPlan(userId) {
        if (!this.currentPlan?.shareableLink) { throw new Error("Missing current plan link"); }
        if (!this.isCurrentUserOwner) { throw new Error("Permission denied"); }
        this.isLoading = true; this.error = null;
        try {
            await planService.removeMember(this.currentPlan.shareableLink, userId);
            // Cập nhật UI ngay lập tức (Optimistic Update)
            if (Array.isArray(this.currentPlan.members)) {
                const memberIndex = this.currentPlan.members.findIndex(member => member.userId === userId);
                if (memberIndex > -1) {
                    this.currentPlan.members.splice(memberIndex, 1);
                }
            }
             if (typeof this.currentPlan.memberCount === 'number' && this.currentPlan.memberCount > 0) {
                 this.currentPlan.memberCount -= 1;
             }
            console.log(`PlanStore: Member ${userId} removed locally.`);
            // WebSocket sẽ xử lý cho các user khác
        } catch (error) {
            console.error("Lỗi khi xóa thành viên:", error);
            this.error = error.response?.data?.message || "Xóa thành viên thất bại.";
            // Cần rollback optimistic update nếu API lỗi (ví dụ fetch lại plan)
            if (this.currentPlan?.shareableLink) await this.fetchPlan(this.currentPlan.shareableLink);
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
    async archiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) { throw new Error("Missing current plan link"); }
        if (!this.isCurrentUserOwner) { throw new Error("Permission denied"); }
        this.isLoading = true; this.error = null;
        try {
            const response = await planService.archivePlan(this.currentPlan.shareableLink);
            // Cập nhật currentPlan với data mới từ response
            this.currentPlan = response.data;
            // Cập nhật plan tương ứng trong danh sách userPlans
            this.updatePlanInUserList(this.currentPlan);
            console.log("PlanStore: Plan archived.", this.currentPlan.status);
        } catch (error) {
            console.error("Lỗi khi lưu trữ kế hoạch:", error);
            this.error = error.response?.data?.message || "Lưu trữ kế hoạch thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
    async unarchiveCurrentPlan() {
        if (!this.currentPlan?.shareableLink) { throw new Error("Missing current plan link"); }
        if (!this.isCurrentUserOwner) { throw new Error("Permission denied"); }
        this.isLoading = true; this.error = null;
        try {
            const response = await planService.unarchivePlan(this.currentPlan.shareableLink);
            // Cập nhật currentPlan
            this.currentPlan = response.data;
            // Cập nhật userPlans
            this.updatePlanInUserList(this.currentPlan);
             console.log("PlanStore: Plan unarchived.", this.currentPlan.status);
        } catch (error) {
            console.error("Lỗi khi khôi phục kế hoạch:", error);
            this.error = error.response?.data?.message || "Khôi phục kế hoạch thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
    async transferPlanOwnership(newOwnerUserId) {
        if (!this.currentPlan?.shareableLink) { throw new Error("Missing current plan link"); }
        if (!this.isCurrentUserOwner) { throw new Error("Permission denied"); }
        if (!newOwnerUserId || typeof newOwnerUserId !== 'number') { throw new Error("New owner ID is required and must be a number"); }
        this.isLoading = true; this.error = null;
        try {
            await planService.transferOwnership(this.currentPlan.shareableLink, newOwnerUserId);
            console.log("PlanStore: Transfer ownership request sent successfully.");
            // UI sẽ được cập nhật thông qua WebSocket message 'OWNERSHIP_TRANSFERRED'
            // Không cần optimistic update ở đây, chờ WebSocket để đảm bảo đồng bộ
        } catch (error) {
            console.error("Lỗi khi chuyển quyền sở hữu:", error);
            this.error = error.response?.data?.message || "Chuyển quyền sở hữu thất bại.";
            throw error; // Ném lỗi để component xử lý
        } finally {
            this.isLoading = false;
        }
    },

    // Helper để cập nhật một plan trong danh sách userPlans
    updatePlanInUserList(updatedPlanData) {
        if (!updatedPlanData || !updatedPlanData.id) return;
        const index = this.userPlans.findIndex(p => p.id === updatedPlanData.id);
        if (index !== -1) {
            // Lấy role hiện tại từ userPlans
            const currentRole = this.userPlans[index].role;
            // Map dữ liệu mới sang dạng PlanSummaryResponse, giữ lại role
            const updatedSummary = this.mapToPlanSummary(updatedPlanData, currentRole);
            if (updatedSummary) {
                // Thay thế plan cũ bằng plan mới trong mảng
                 this.userPlans.splice(index, 1, updatedSummary);
                 console.log(`PlanStore: Updated plan ${updatedPlanData.id} in userPlans list.`);
            }
        }
    },
    // Helper mapper (tương tự backend PlanMapper.toPlanSummaryResponse)
    mapToPlanSummary(plan, role) {
          if (!plan) return null;
          try {
              const startDate = plan.startDate ? dayjs(plan.startDate).format('YYYY-MM-DD') : null;
              const endDate = startDate && plan.durationInDays ? dayjs(startDate).add(plan.durationInDays - 1, 'day').format('YYYY-MM-DD') : null;

              // Logic tính displayStatus (cần đồng bộ với backend)
              let displayStatus = plan.status; // ACTIVE, ARCHIVED, etc.
              const today = dayjs().format('YYYY-MM-DD');
              if (displayStatus === 'ACTIVE' && endDate && dayjs(today).isAfter(endDate)) {
                  displayStatus = 'COMPLETED'; // Hoặc dùng status từ backend nếu có
              }

              return {
                  id: plan.id,
                  title: plan.title,
                  description: plan.description, // Có thể cắt ngắn nếu cần
                  durationInDays: plan.durationInDays,
                  startDate: startDate,
                  endDate: endDate,
                  displayStatus: displayStatus, // COMPLETED, ACTIVE, ARCHIVED
                  status: plan.status, // Trạng thái gốc từ backend
                  shareableLink: plan.shareableLink,
                  memberCount: Array.isArray(plan.members) ? plan.members.length : (plan.memberCount ?? 0),
                  role: role // Giữ lại role từ dữ liệu cũ trong userPlans
              };
          } catch (e) {
              console.error("Error mapping plan to summary:", e, plan);
              return null;
          }
    },

     // --- Action để clear plan hiện tại và task list (khi rời trang) ---
     clearCurrentPlanData() {
        console.log("PlanStore: Clearing current plan details and daily tasks...");
        this.currentPlan = null;
        this.isLoading = false;
        this.error = null;
        this.clearDailyTasks(); // Gọi action xóa task list
        this.isTaskLoading = false; // Reset cả task loading/error
        this.taskError = null;
     }
  },

  // Setup (chỉ gọi initDebouncedFetch)
  setup() {
      this.initDebouncedFetch();
  }
});