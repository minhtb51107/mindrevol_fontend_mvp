// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';
import userService from '@/api/userService'; // Vẫn giữ nếu cần cho stats/chart (dù đã deprecated)
import { useAuthStore } from './auth';
import dayjs from 'dayjs'; // Import dayjs
import { usePlanStore } from './plan'; // <-- IMPORT PLAN STORE

// Helper debounce (có thể đưa ra utils)
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

export const useProgressStore = defineStore('progress', {
  state: () => ({
    // (State gốc của bạn giữ nguyên)
    currentPlanShareableLink: null,
    userStats: {
        checkedInTodayComplete: false,
        currentStreak: 0,
        totalTasksToday: 0,
        completedTasksToday: 0,
    },
    isLoadingStats: false,
    errorStats: null,
    chartData: [],
    isChartLoading: false,
    errorChart: null,
    currentTimeline: null, 
    isLoadingTimeline: false,
    timelineError: null,
    selectedDate: dayjs().format('YYYY-MM-DD'),
  }),

  getters: {
     // (Getters gốc của bạn giữ nguyên)
     timelineSwimlanes: (state) => state.currentTimeline,
     getSelectedDate: (state) => state.selectedDate,
  },

  actions: {
    // (Hàm gốc giữ nguyên)
    setSelectedDate(date) {
        const newDate = dayjs(date).format('YYYY-MM-DD');
        if (newDate !== this.selectedDate) {
            console.log(`ProgressStore: Selected date changed to ${newDate}`);
            this.selectedDate = newDate;
            if (this.currentPlanShareableLink) {
              this.fetchTimeline(this.currentPlanShareableLink, newDate);
            }
        }
    },
    
    // (Hàm gốc giữ nguyên)
    getCompletedTaskIdsForCurrentUser(currentUserId) {
        if (!this.currentTimeline || !currentUserId) {
            return new Set(); 
        }
        const currentUserTimeline = this.currentTimeline.find(
            timeline => timeline.userId === currentUserId
        );
        if (!currentUserTimeline || !Array.isArray(currentUserTimeline.checkInEvents)) {
            return new Set(); 
        }
        const completedIds = new Set();
        currentUserTimeline.checkInEvents.forEach(event => {
            if (Array.isArray(event.completedTaskIds)) {
                event.completedTaskIds.forEach(taskId => {
                    completedIds.add(taskId);
                });
            }
        });
        return completedIds;
    },


    // (Hàm gốc giữ nguyên - với Hotfix 2)
    async fetchTimeline(shareableLink, date = this.selectedDate) {
        if (!shareableLink) {
            this.timelineError = "Không thể tải timeline (thiếu mã kế hoạch).";
            this.currentTimeline = null;
            return;
        }
        console.log(`ProgressStore: Fetching timeline for ${shareableLink} on ${date}...`);
        this.isLoadingTimeline = true;
        this.timelineError = null;
        this.currentPlanShareableLink = shareableLink; 
        
        const planStore = usePlanStore();
        const authStore = useAuthStore();

        try {
            // Dòng này bây giờ sẽ gọi hàm getDailyTimeline với đường dẫn ĐÚNG
            const response = await progressService.getDailyTimeline(shareableLink, date); 
            this.currentTimeline = response.data || [];
             console.log("ProgressStore: Timeline data fetched:", this.currentTimeline);
             
            const completedIds = this.getCompletedTaskIdsForCurrentUser(authStore.currentUser?.id);
            
            // --- HOTFIX 2 (TỪ FILE GỐC CỦA BẠN - GIỮ NGUYÊN) ---
            const today = dayjs().format('YYYY-MM-DD');
            if (date === today && completedIds.size === 0 && planStore.clientSideCompletedTaskIds.size > 0) {
                 console.warn(`ProgressStore: fetchTimeline for TODAY returned 0 completed tasks, but planStore has ${planStore.clientSideCompletedTaskIds.size} (from optimistic update). Skipping sync to preserve state.`);
            } else {
                 console.log(`ProgressStore: Syncing timeline completed IDs to planStore (Size: ${completedIds.size})`);
                 planStore.syncCompletedTaskIds(completedIds);
            }
            // --- KẾT THÚC HOTFIX 2 ---
             
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu timeline:', error);
            this.timelineError = error.response?.data?.message || 'Không thể tải dữ liệu timeline.';
            this.currentTimeline = null; 
            
            planStore.syncCompletedTaskIds(new Set());
        } finally {
            this.isLoadingTimeline = false;
        }
    },

    // (Hàm gốc giữ nguyên - với Hotfix 1)
    async submitCheckIn(shareableLink, checkInData) {
        if (!shareableLink) {
            throw new Error("Không tìm thấy mã kế hoạch để check-in.");
        }
        console.log("ProgressStore: Submitting check-in...", checkInData);
        
        const planStore = usePlanStore(); 
        try {
            // Dòng này bây giờ sẽ gọi hàm createCheckIn với đường dẫn ĐÚNG
            const response = await progressService.createCheckIn(shareableLink, checkInData);
            console.log("ProgressStore: Check-in successful:", response.data);

            // --- HOTFIX 1 (TỪ FILE GỐC CỦA BẠN - GIỮ NGUYÊN) ---
            const checkInDate = dayjs().format('YYYY-MM-DD');
            if (checkInDate === this.selectedDate && 
                checkInData.completedTaskIds && 
                checkInData.completedTaskIds.length > 0) 
            {
                console.log(`ProgressStore: (Inside submitCheckIn) Pushing new completed IDs to planStore (optimistic):`, checkInData.completedTaskIds);
                planStore.addCompletedTaskIds(checkInData.completedTaskIds); 
            }
            // --- KẾT THÚC HOTFIX 1 ---

            await this.fetchUserStats();
            return response.data;
        } catch (error) {
            console.error('Lỗi khi thực hiện check-in:', error);
            throw error.response?.data?.message || error.message || 'Có lỗi xảy ra khi check-in.';
        }
    },

    // --- (MỚI) ACTION: Cập nhật Check-in ---
    async updateCheckInAction(checkInEventId, updateData) {
        if (!this.currentPlanShareableLink) {
             throw new Error("Không tìm thấy mã kế hoạch (shareableLink) để cập nhật.");
        }
        console.log(`ProgressStore: Submitting update for check-in ${checkInEventId}...`);
        try {
            // Dòng này sẽ gọi hàm updateCheckIn MỚI với đường dẫn ĐÚNG
            await progressService.updateCheckIn(this.currentPlanShareableLink, checkInEventId, updateData);
            console.log(`ProgressStore: Update for ${checkInEventId} successful.`);
        } catch (error) {
            console.error('Lỗi khi cập nhật check-in:', error);
            throw error.response?.data?.message || 'Không thể cập nhật check-in.';
        }
    },

    // --- (MỚI) ACTION: Xóa Check-in ---
    async deleteCheckInAction(checkInEventId) {
        if (!this.currentPlanShareableLink) {
             throw new Error("Không tìm thấy mã kế hoạch (shareableLink) để xóa.");
        }
        console.log(`ProgressStore: Submitting delete for check-in ${checkInEventId}...`);
         try {
            // Dòng này sẽ gọi hàm deleteCheckIn MỚI với đường dẫn ĐÚNG
            await progressService.deleteCheckIn(this.currentPlanShareableLink, checkInEventId);
            console.log(`ProgressStore: Delete for ${checkInEventId} successful.`);
        } catch (error) {
            console.error('Lỗi khi xóa check-in:', error);
            throw error.response?.data?.message || 'Không thể xóa check-in.';
        }
    },


    // --- (CẬP NHẬT) Xử lý WebSocket cho Timeline ---
    handleWebSocketUpdate(updateData) {
        // (Logic gốc cho NEW_CHECK_IN giữ nguyên)
        if (updateData.type === 'NEW_CHECK_IN' && updateData.checkInEvent) {
             console.log("ProgressStore: WebSocket received NEW_CHECK_IN", updateData.checkInEvent);
            const { checkInTimestamp, completedTaskIds, userId } = updateData.checkInEvent;
            const checkInDate = dayjs(checkInTimestamp).format('YYYY-MM-DD');
            
            const authStore = useAuthStore();
            const planStore = usePlanStore();

            if (this.currentPlanShareableLink && checkInDate === this.selectedDate) {
                 console.log(`ProgressStore: New check-in matches selected date (${this.selectedDate}). Refetching timeline using debounce...`);
                 this.debouncedRefetchTimeline();
            } else {
                 console.log(`ProgressStore: New check-in date (${checkInDate}) does not match selected date (${this.selectedDate}). Ignoring immediate refetch.`);
            }
            
            if (userId === authStore.currentUser?.id && 
                checkInDate === this.selectedDate &&
                completedTaskIds && completedTaskIds.length > 0) 
            {
                console.log(`ProgressStore: Pushing new completed IDs to planStore (optimistic):`, completedTaskIds);
                planStore.addCompletedTaskIds(completedTaskIds); 
            }
        }
        
        // --- LOGIC MỚI ---
        
        else if (updateData.type === 'UPDATE_CHECK_IN') {
             console.log("ProgressStore: WebSocket received UPDATE_CHECK_IN. Refetching timeline...");
             if (this.currentPlanShareableLink) {
                 this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
             }
        }
        
        else if (updateData.type === 'DELETE_CHECK_IN') {
             console.log("ProgressStore: WebSocket received DELETE_CHECK_IN. Refetching timeline...");
             if (this.currentPlanShareableLink) {
                 this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
            }
        }
        
        else if (updateData.type === 'NEW_CHECKIN_COMMENT') {
            console.log("ProgressStore: WebSocket received NEW_CHECKIN_COMMENT.");
             if (this.currentPlanShareableLink) {
                this.debouncedRefetchTimeline();
             }
        }
        // --- KẾT THÚC LOGIC MỚI ---
        
        else {
             console.log("ProgressStore: Received unhandled WebSocket update type or invalid data:", updateData.type);
        }
    },

    // (Các hàm gốc còn lại giữ nguyên)
    debouncedRefetchTimeline() {
        if (!this._refetchTimelineDebounce) {
            this._refetchTimelineDebounce = debounce(() => {
                if (this.currentPlanShareableLink) {
                    console.log(`ProgressStore: Debounced fetchTimeline executing for ${this.selectedDate}`);
                    this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
                }
            }, 600); 
        }
        this._refetchTimelineDebounce();
    },

    clearPlanProgressData() {
        console.log("ProgressStore: Clearing current plan progress data (timeline)...");
        this.currentPlanShareableLink = null; 
        this.currentTimeline = null;
        this.isLoadingTimeline = false;
        this.timelineError = null;
        
        try {
           const planStore = usePlanStore();
           if(planStore) {
                planStore.syncCompletedTaskIds(new Set());
           }
        } catch (e) { 
            console.warn("Error clearing planStore completed tasks (store might be disposed)", e);
        }
    },

    async fetchUserStats() {
      console.warn("ProgressStore: fetchUserStats() uses deprecated logic based on DailyProgress. Backend API might not work correctly.");
      const authStore = useAuthStore();
      if (this.isLoadingStats || !authStore.isAuthenticated) return;
      this.isLoadingStats = true;
      this.errorStats = null;
      try {
        const response = await userService.getMyStats();
        this.userStats = {
            checkedInTodayComplete: response.data?.checkedInTodayComplete ?? false,
            currentStreak: response.data?.currentStreak ?? 0,
            totalTasksToday: response.data?.totalTasksToday ?? 0,
            completedTasksToday: response.data?.completedTasksToday ?? 0,
        };
      } catch (error) {
          console.error('Lỗi khi tải user stats (logic cũ):', error);
          this.errorStats = error.response?.data?.message || 'Không thể tải thông tin thống kê (logic cũ).';
          this.userStats = { checkedInTodayComplete: false, currentStreak: 0, totalTasksToday: 0, completedTasksToday: 0 };
       } finally {
           this.isLoadingStats = false;
       }
    },
    async fetchChartData() {
       console.warn("ProgressStore: fetchChartData() uses deprecated logic based on DailyProgress. Backend API might not work correctly.");
      const authStore = useAuthStore();
      if (this.isChartLoading || !authStore.isAuthenticated) return;
      this.isChartLoading = true;
      this.errorChart = null;
      try {
        const response = await userService.getMyProgressChartData();
        if (response.data && Array.isArray(response.data)) {
          this.chartData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            console.warn("Chart data response is not an array (logic cũ):", response.data);
            this.chartData = [];
        }
      } catch (error) {
          console.error('Lỗi khi tải dữ liệu biểu đồ (logic cũ):', error);
          this.errorChart = error.response?.data?.message || 'Không thể tải dữ liệu biểu đồ (logic cũ).';
          this.chartData = [];
      } finally {
          this.isChartLoading = false;
      }
    },

    clearUserSessionData() {
        console.log("ProgressStore: Clearing user session data (stats, chart, timeline, selected date)...");
        this.userStats = { checkedInTodayComplete: false, currentStreak: 0, totalTasksToday: 0, completedTasksToday: 0 };
        this.isLoadingStats = false;
        this.errorStats = null;
        this.chartData = [];
        this.isChartLoading = false;
        this.errorChart = null;
        this.clearPlanProgressData();
        this.selectedDate = dayjs().format('YYYY-MM-DD');
    }
  },
});