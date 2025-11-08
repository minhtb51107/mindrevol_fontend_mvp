// File: src/stores/planTaskStore.js
import { defineStore } from 'pinia';
import taskService from '@/api/taskService';
import dayjs from 'dayjs';
import { useAuthStore } from './auth';

export const usePlanTaskStore = defineStore('planTask', {
  state: () => ({
    dailyTasks: [], // Danh sách task cho ngày đang chọn
    isLoading: false,
    error: null,
    // Set chứa ID các task đã hoàn thành (để UI hiển thị gạch ngang)
    completedTaskIds: new Set(),
  }),

  getters: {
    // Trả về danh sách task đã sắp xếp và kèm trạng thái isCompleted
    sortedDailyTasks: (state) => {
      return [...state.dailyTasks]
        .map(task => ({
          ...task,
          isCompleted: state.completedTaskIds.has(task.id)
        }))
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    }
  },

  actions: {
    // --- FETCH & CLEAR ---
    async fetchDailyTasks(shareableLink, date) {
      if (!shareableLink || !date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
        this.error = "Thông tin không hợp lệ để tải công việc.";
        return;
      }
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      
      // Reset completed IDs khi chuyển ngày (sẽ được progressStore sync lại sau)
      this.completedTaskIds.clear();

      this.isLoading = true;
      this.error = null;
      try {
        const response = await taskService.getTasksByDate(shareableLink, formattedDate);
        this.dailyTasks = response.data || [];
        // Sắp xếp ngay sau khi fetch
        this.dailyTasks.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
      } catch (err) {
        console.error(`Lỗi tải công việc ngày ${formattedDate}:`, err);
        this.error = err.response?.data?.message || "Không thể tải danh sách công việc.";
        this.dailyTasks = [];
      } finally {
        this.isLoading = false;
      }
    },

    clearDailyTasks() {
      this.dailyTasks = [];
      this.completedTaskIds.clear();
      this.error = null;
      this.isLoading = false;
    },

    // --- SYNC COMPLETED STATUS (Gọi từ progressStore) ---
    syncCompletedTaskIds(idsSet) {
      if (idsSet instanceof Set) {
        this.completedTaskIds = new Set(idsSet);
      }
    },
    addCompletedTaskIds(idsArray) {
      if (Array.isArray(idsArray)) {
        idsArray.forEach(id => this.completedTaskIds.add(id));
        // Trigger reactivity
        this.completedTaskIds = new Set(this.completedTaskIds);
      }
    },

    // --- CRUD ACTIONS ---
    async createTask(shareableLink, taskData) {
        this.isLoading = true;
        this.error = null;
        try {
            await taskService.createTask(shareableLink, taskData);
            // Fetch lại để đồng bộ chuẩn xác nhất (hoặc có thể push vào array nếu muốn optimistic)
            await this.fetchDailyTasks(shareableLink, taskData.taskDate);
        } catch (err) {
            this.error = err.response?.data?.message || "Thêm công việc thất bại.";
            throw err;
        } finally {
            this.isLoading = false;
        }
    },

    async updateTask(shareableLink, taskId, taskData, originalDate) {
        this.isLoading = true;
        this.error = null;
        try {
            await taskService.updateTask(shareableLink, taskId, taskData);
            // Nếu đổi ngày, cần fetch lại ngày cũ để loại bỏ task vừa chuyển đi
            if (taskData.taskDate && taskData.taskDate !== originalDate) {
                 await this.fetchDailyTasks(shareableLink, originalDate);
            } else {
                 // Nếu cùng ngày, fetch lại ngày hiện tại
                 await this.fetchDailyTasks(shareableLink, originalDate);
            }
        } catch (err) {
            this.error = err.response?.data?.message || "Cập nhật thất bại.";
            throw err;
        } finally {
            this.isLoading = false;
        }
    },

    async deleteTask(shareableLink, taskId, taskDate) {
        this.isLoading = true;
        this.error = null;
        try {
            await taskService.deleteTask(shareableLink, taskId);
            await this.fetchDailyTasks(shareableLink, taskDate);
        } catch (err) {
            this.error = err.response?.data?.message || "Xóa thất bại.";
            throw err;
        } finally {
             this.isLoading = false;
        }
    },

    async reorderTasks(shareableLink, taskDate, orderedTasks) {
        // Optimistic update
        const originalTasks = [...this.dailyTasks];
        this.dailyTasks = orderedTasks.map((t, i) => ({ ...t, order: i }));

        this.isLoading = true;
        try {
            const orderedIds = orderedTasks.map(t => t.id);
            await taskService.reorderTasks(shareableLink, taskDate, orderedIds);
        } catch (err) {
            // Rollback nếu lỗi
            this.dailyTasks = originalTasks;
            this.error = err.response?.data?.message || "Sắp xếp thất bại.";
            throw err;
        } finally {
            this.isLoading = false;
        }
    },

    // --- WEBSOCKET HANDLER ---
    handleTaskWebSocketUpdate(updateData, currentlySelectedDate) {
        const { type, taskDate, userId } = updateData;
        const authStore = useAuthStore();

        // Bỏ qua nếu chính user này là người tạo ra sự kiện
        if (userId && authStore.currentUser?.id === userId) return;

        const relevantTypes = ['NEW_TASK', 'UPDATE_TASK', 'MOVE_TASK', 'DELETE_TASK', 'REORDER_TASKS'];
        if (!relevantTypes.includes(type)) return;

        // Logic refetch thông minh
        if (taskDate === currentlySelectedDate) {
             // Nếu sự kiện xảy ra ở ngày đang xem -> Refetch
             // (Có thể thêm debounce nếu cần thiết)
             // Lấy shareableLink từ đâu? Tạm thời chúng ta cần truyền nó vào hoặc lấy từ planStore.
             // Để đơn giản, giả định caller sẽ lo việc refetch hoặc store này cần biết shareableLink.
             // Tạm thời để caller (usePlanWebSocket) xử lý việc truyền link, hoặc tốt hơn:
             // Store này nên lưu `currentShareableLink` nếu nó chuyên trách 1 plan tại 1 thời điểm.
             // Nhưng để giữ đơn giản theo hướng dẫn, ta sẽ emit hoặc để view gọi fetch.
             
             // FIX: Để action này tự refetch, nó cần shareableLink. 
             // Chúng ta sẽ sửa signature của handleTaskWebSocketUpdate để nhận link.
        }
    },
     // SỬA LẠI HÀM TRÊN ĐỂ NHẬN SHAREABLE LINK
    handleWebSocketTaskUpdate(shareableLink, updateData, currentlySelectedDate) {
        const { type, taskDate, userId, originalTaskDate } = updateData;
        const authStore = useAuthStore();
        if (userId && authStore.currentUser?.id === userId) return;

         if (taskDate === currentlySelectedDate || (type === 'MOVE_TASK' && originalTaskDate === currentlySelectedDate)) {
             console.log(`PlanTaskStore: WS update relevant to ${currentlySelectedDate}. Refetching...`);
             this.fetchDailyTasks(shareableLink, currentlySelectedDate);
         }
    }
  }
});