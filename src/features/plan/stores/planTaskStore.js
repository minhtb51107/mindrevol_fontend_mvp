// File: src/stores/planTaskStore.js
import { defineStore } from 'pinia';
// [CẬP NHẬT] Service nội bộ feature
import taskService from '@/features/plan/services/taskService';
// [CẬP NHẬT] Store từ feature khác
import { useAuthStore } from '@/features/auth/stores/authStore';
import dayjs from 'dayjs';

export const usePlanTaskStore = defineStore('planTask', {
  state: () => ({
    currentDailyTasks: [], // Danh sách task của ngày đang chọn
    isLoading: false,      // Loading khi fetch danh sách
    error: null,           // Lỗi khi fetch danh sách

    isTaskActionLoading: false, // Loading cho CRUD (thêm/sửa/xóa/sắp xếp)
    taskActionError: null,      // Lỗi cho CRUD

    // Set chứa các ID task đã hoàn thành (được sync từ progressStore)
    completedTaskIds: new Set(),
  }),

  getters: {
    // Trả về danh sách task đã sắp xếp và kèm trạng thái hoàn thành
    sortedDailyTasks: (state) => {
        return [...state.currentDailyTasks]
            .map(task => ({
                ...task,
                isCompleted: state.completedTaskIds.has(task.id) 
            }))
            .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    },
  },

  actions: {
    // --- FETCH TASKS ---
    async fetchDailyTasks(shareableLink, date) {
        if (!shareableLink || !date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
            this.error = "Thông tin không hợp lệ để tải công việc.";
            this.currentDailyTasks = [];
            return;
        }
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        
        // Reset trạng thái completed khi chuyển ngày (sẽ được sync lại sau bởi progressStore)
        this.completedTaskIds.clear();

        this.isLoading = true;
        this.error = null;
        try {
            const response = await taskService.getTasksByDate(shareableLink, formattedDate);
            this.currentDailyTasks = response.data || [];
        } catch (err) {
            console.error(`Lỗi tải công việc ngày ${formattedDate}:`, err);
            this.error = err.response?.data?.message || "Không thể tải danh sách công việc.";
            this.currentDailyTasks = [];
        } finally {
            this.isLoading = false;
        }
    },

    clearDailyTasks() {
        this.currentDailyTasks = [];
        this.error = null;
        this.completedTaskIds.clear();
    },

    // --- TASK CRUD ACTIONS ---
    async addTask(shareableLink, taskData) {
        this.isTaskActionLoading = true;
        this.taskActionError = null;
        try {
            await taskService.createTask(shareableLink, taskData);
            // Sau khi thêm thành công, fetch lại task list của ngày đó
            if (taskData.taskDate) {
                await this.fetchDailyTasks(shareableLink, taskData.taskDate);
            }
        } catch (error) {
            this.taskActionError = error.response?.data?.message || "Thêm công việc thất bại.";
            throw error;
        } finally {
            this.isTaskActionLoading = false;
        }
    },

    async updateTask(shareableLink, taskId, taskData, originalTaskDate) {
        this.isTaskActionLoading = true;
        this.taskActionError = null;
        try {
            await taskService.updateTask(shareableLink, taskId, taskData);
            
            // Logic fetch lại dữ liệu khi update
            const targetDate = taskData.taskDate || originalTaskDate;
            await this.fetchDailyTasks(shareableLink, targetDate);

            // Nếu đổi ngày, fetch lại cả ngày cũ để cập nhật UI
            if (taskData.taskDate && taskData.taskDate !== originalTaskDate) {
                 await this.fetchDailyTasks(shareableLink, originalTaskDate);
            }
        } catch (error) {
            this.taskActionError = error.response?.data?.message || "Cập nhật công việc thất bại.";
            throw error;
        } finally {
            this.isTaskActionLoading = false;
        }
    },

    async deleteTask(shareableLink, taskId, taskDate) {
        this.isTaskActionLoading = true;
        this.taskActionError = null;
        try {
            await taskService.deleteTask(shareableLink, taskId);
            await this.fetchDailyTasks(shareableLink, taskDate);
        } catch (error) {
            this.taskActionError = error.response?.data?.message || "Xóa công việc thất bại.";
            throw error;
        } finally {
            this.isTaskActionLoading = false;
        }
    },

    async reorderTasks(shareableLink, taskDate, orderedTasks) {
        // Optimistic update: Cập nhật UI trước khi gọi API
        const originalTasks = JSON.parse(JSON.stringify(this.currentDailyTasks));
        this.currentDailyTasks = orderedTasks.map((task, index) => ({ ...task, order: index }));

        this.isTaskActionLoading = true;
        this.taskActionError = null;
        try {
            const orderedTaskIds = orderedTasks.map(task => task.id);
            await taskService.reorderTasks(shareableLink, taskDate, orderedTaskIds);
        } catch (error) {
            console.error("Reorder failed, rolling back UI:", error);
            this.currentDailyTasks = originalTasks; // Rollback nếu lỗi
            this.taskActionError = error.response?.data?.message || "Sắp xếp thất bại.";
            throw error;
        } finally {
            this.isTaskActionLoading = false;
        }
    },

    // --- SYNC COMPLETED STATUS (Từ ProgressStore) ---
    syncCompletedTaskIds(idsSet) {
        if (idsSet instanceof Set) {
            this.completedTaskIds = new Set(idsSet);
        }
    },

    addCompletedTaskIds(taskIdsArray) {
        if (Array.isArray(taskIdsArray)) {
            taskIdsArray.forEach(id => this.completedTaskIds.add(id));
        }
    },

    // --- WEBSOCKET HANDLER ---
    handleWebSocketUpdate(updateData, currentlySelectedDate, shareableLink) {
        const { type, taskDate, userId } = updateData;
        const authStore = useAuthStore();

        // Bỏ qua nếu chính user này là người tạo ra thay đổi
        if (userId && authStore.currentUser?.id === userId) return;

        const relevantTypes = ['NEW_TASK', 'UPDATE_TASK', 'MOVE_TASK', 'DELETE_TASK', 'REORDER_TASKS'];
        if (!relevantTypes.includes(type)) return;

        // Logic fetch lại dữ liệu khi có sự kiện từ WebSocket
        if (taskDate === currentlySelectedDate) {
             this.fetchDailyTasks(shareableLink, currentlySelectedDate);
        } else if (type === 'MOVE_TASK' && updateData.originalTaskDate === currentlySelectedDate) {
             // Nếu task bị chuyển ĐI khỏi ngày đang xem
             this.fetchDailyTasks(shareableLink, currentlySelectedDate);
        }
    }
  }
});