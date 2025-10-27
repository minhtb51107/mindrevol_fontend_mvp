// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';
import userService from '@/api/userService'; // Vẫn giữ nếu cần cho stats/chart (dù đã deprecated)
import { useAuthStore } from './auth';
import dayjs from 'dayjs'; // Import dayjs

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
    // --- STATE CŨ (marked as deprecated or removed) ---
    // dashboard: null, // Không dùng nữa
    // isLoading: false, // Không dùng nữa
    // error: null, // Không dùng nữa
    currentPlanShareableLink: null, // Vẫn cần để biết đang xem plan nào

    // Stats & Chart (logic cũ dựa trên DailyProgress, cần viết lại nếu muốn dùng)
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

    // --- STATE MỚI CHO TIMELINE DASHBOARD ---
    currentTimeline: null, // Dữ liệu TimelineResponse từ API GET /timeline (List<MemberTimeline>)
    isLoadingTimeline: false,
    timelineError: null,
    selectedDate: dayjs().format('YYYY-MM-DD'), // Ngày đang được chọn, mặc định là hôm nay
  }),

  getters: {
     // Getter để lấy timeline theo cấu trúc swimlane (API đã trả về đúng cấu trúc này)
     timelineSwimlanes: (state) => state.currentTimeline,
     // Getter lấy ngày đang chọn
     getSelectedDate: (state) => state.selectedDate,
  },

  actions: {
    // --- ACTION MỚI: Cập nhật ngày đang xem ---
    setSelectedDate(date) {
        const newDate = dayjs(date).format('YYYY-MM-DD');
        if (newDate !== this.selectedDate) {
            console.log(`ProgressStore: Selected date changed to ${newDate}`);
            this.selectedDate = newDate;
            // Tự động fetch timeline cho ngày mới nếu đang xem plan
            if (this.currentPlanShareableLink) {
              this.fetchTimeline(this.currentPlanShareableLink, newDate);
            }
        }
    },

    // --- ACTION MỚI: Fetch dữ liệu Timeline cho ngày đã chọn ---
    async fetchTimeline(shareableLink, date = this.selectedDate) {
        if (!shareableLink) {
            this.timelineError = "Không thể tải timeline (thiếu mã kế hoạch).";
            this.currentTimeline = null;
            return;
        }
        console.log(`ProgressStore: Fetching timeline for ${shareableLink} on ${date}...`);
        this.isLoadingTimeline = true;
        this.timelineError = null;
        this.currentPlanShareableLink = shareableLink; // Cập nhật link plan đang xem

        try {
            const response = await progressService.getDailyTimeline(shareableLink, date);
            // API trả về List<MemberTimeline>, gán trực tiếp hoặc đảm bảo là array rỗng nếu không có data
            this.currentTimeline = response.data || [];
             console.log("ProgressStore: Timeline data fetched:", this.currentTimeline);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu timeline:', error);
            this.timelineError = error.response?.data?.message || 'Không thể tải dữ liệu timeline.';
            this.currentTimeline = null; // Reset về null khi lỗi
        } finally {
            this.isLoadingTimeline = false;
        }
    },

    // --- ACTION MỚI: Gửi Check-in ---
    async submitCheckIn(shareableLink, checkInData) {
        if (!shareableLink) {
            throw new Error("Không tìm thấy mã kế hoạch để check-in.");
        }
        console.log("ProgressStore: Submitting check-in...", checkInData);
        // Có thể thêm isLoadingCheckIn nếu muốn component hiển thị loading khi submit
        // this.isLoadingCheckIn = true;
        try {
            // Gọi API mới để tạo CheckInEvent
            const response = await progressService.createCheckIn(shareableLink, checkInData);
            console.log("ProgressStore: Check-in successful:", response.data);

            // Xử lý sau khi check-in thành công:
            // 1. Không cần fetch lại timeline ngay lập tức, vì WebSocket sẽ làm điều đó (xem handleWebSocketUpdate).
            // 2. Fetch lại stats (dù logic stats cũ đã hỏng, nhưng giữ lại luồng gọi)
            await this.fetchUserStats();
            // await this.fetchChartData(); // Chart cũng hỏng logic

            return response.data; // Trả về checkInEvent vừa tạo nếu component cần
        } catch (error) {
            console.error('Lỗi khi thực hiện check-in:', error);
            // Ném lỗi ra để component bắt và hiển thị thông báo
            throw error.response?.data?.message || error.message || 'Có lỗi xảy ra khi check-in.';
        } finally {
            // this.isLoadingCheckIn = false;
        }
    },

    // --- CẬP NHẬT: Xử lý WebSocket cho Timeline ---
    handleWebSocketUpdate(updateData) {
        // Chỉ xử lý message type 'NEW_CHECK_IN'
        if (updateData.type === 'NEW_CHECK_IN' && updateData.checkInEvent) {
             console.log("ProgressStore: WebSocket received NEW_CHECK_IN", updateData.checkInEvent);
            const checkInTimestamp = updateData.checkInEvent.checkInTimestamp;
            // Lấy ngày của sự kiện check-in (YYYY-MM-DD)
            const checkInDate = dayjs(checkInTimestamp).format('YYYY-MM-DD');

            // Kiểm tra xem sự kiện check-in này có thuộc về ngày đang được chọn không
            if (this.currentPlanShareableLink && checkInDate === this.selectedDate) {
                 console.log(`ProgressStore: New check-in matches selected date (${this.selectedDate}). Refetching timeline using debounce...`);
                 // Dùng debounce để tránh fetch liên tục nếu nhiều event đến gần nhau
                 this.debouncedRefetchTimeline();
            } else {
                 console.log(`ProgressStore: New check-in date (${checkInDate}) does not match selected date (${this.selectedDate}). Ignoring immediate refetch.`);
                 // (Optional) Có thể hiển thị một chỉ báo nhỏ trên DateSelector
                 // cho biết có hoạt động mới ở ngày 'checkInDate'
            }
        }
        // Thêm xử lý cho các loại WebSocket khác nếu cần (ví dụ: comment, reaction trên CheckInEvent)
        // else if (updateData.type === 'NEW_CHECKIN_COMMENT') { ... }
        else {
             console.log("ProgressStore: Received unhandled WebSocket update type or invalid data:", updateData.type);
        }
    },

    // Hàm debounce để tránh gọi fetchTimeline liên tục từ WebSocket
    debouncedRefetchTimeline() {
        if (!this._refetchTimelineDebounce) {
            // Sử dụng helper debounce đã định nghĩa ở đầu file
            this._refetchTimelineDebounce = debounce(() => {
                if (this.currentPlanShareableLink) {
                    console.log(`ProgressStore: Debounced fetchTimeline executing for ${this.selectedDate}`);
                    this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
                }
            }, 600); // Tăng debounce time lên một chút (600ms)
        }
        this._refetchTimelineDebounce();
    },

    // --- Action để xóa dữ liệu progress của plan hiện tại (khi rời trang) ---
    clearPlanProgressData() {
        console.log("ProgressStore: Clearing current plan progress data (timeline)...");
        this.currentPlanShareableLink = null; // Xóa link plan đang xem
        this.currentTimeline = null;
        this.isLoadingTimeline = false;
        this.timelineError = null;
        // Không reset selectedDate ở đây, để khi quay lại vẫn giữ ngày user đã chọn
    },

    // --- ACTIONS Stats/Chart (giữ nguyên nhưng đánh dấu là logic cũ/hỏng) ---
    async fetchUserStats() {
      console.warn("ProgressStore: fetchUserStats() uses deprecated logic based on DailyProgress. Backend API might not work correctly.");
      const authStore = useAuthStore();
      if (this.isLoadingStats || !authStore.isAuthenticated) return;
      this.isLoadingStats = true;
      this.errorStats = null;
      try {
        // Gọi API cũ, có thể backend chưa cập nhật API này để hoạt động với CheckInEvent
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
        // Gọi API cũ, có thể backend chưa cập nhật API này
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

    // --- CẬP NHẬT: clearUserSessionData (khi logout) ---
    clearUserSessionData() {
        console.log("ProgressStore: Clearing user session data (stats, chart, timeline, selected date)...");
        // Clear stats
        this.userStats = { checkedInTodayComplete: false, currentStreak: 0, totalTasksToday: 0, completedTasksToday: 0 };
        this.isLoadingStats = false;
        this.errorStats = null;
        // Clear chart
        this.chartData = [];
        this.isChartLoading = false;
        this.errorChart = null;
        // Clear cả timeline và link plan
        this.clearPlanProgressData();
        // Reset cả selectedDate về hôm nay
        this.selectedDate = dayjs().format('YYYY-MM-DD');
    }
  },
});