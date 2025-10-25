// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';
import userService from '@/api/userService';
import { useAuthStore } from './auth';

export const useProgressStore = defineStore('progress', {
  state: () => ({
    dashboard: null,
    currentPlanShareableLink: null,
    isLoading: false,
    error: null,
    userStats: {
      checkedInTodayComplete: false,
      currentStreak: 0,
      totalTasksToday: 0,
      completedTasksToday: 0,
    },
    isLoadingStats: false,
    errorStats: null,
    // --- STATE MỚI CHO CHART ---
    chartData: [], // Dữ liệu gốc từ API [{ date: '...', completionRate: ... }]
    isChartLoading: false,
    errorChart: null,
    // --- KẾT THÚC STATE CHART ---
  }),
  actions: {
    // ... (fetchDashboard, logDailyProgress, clearDashboard, updateDashboardFromWebSocket giữ nguyên) ...
     async fetchDashboard(shareableLink) {
        if (!shareableLink) { this.error = "Không thể tải dữ liệu tiến độ (thiếu mã kế hoạch)."; return; }
        if (!this.dashboard || this.currentPlanShareableLink !== shareableLink || this.error) { this.isLoading = true; }
        this.currentPlanShareableLink = shareableLink; this.error = null;
        try {
            const response = await progressService.getDashboard(shareableLink);
            if (response.data && Array.isArray(response.data.membersProgress)) {
                 response.data.membersProgress.forEach(member => {
                    if (member && member.dailyStatus) {
                        Object.keys(member.dailyStatus).forEach(date => {
                            const progress = member.dailyStatus[date];
                            if (progress) {
                                progress.completedTaskIds = new Set(Array.isArray(progress.completedTaskIds) ? progress.completedTaskIds : []);
                                if (!Array.isArray(progress.attachments)) progress.attachments = []; if (!Array.isArray(progress.comments)) progress.comments = []; if (!Array.isArray(progress.reactions)) progress.reactions = [];
                            } else { member.dailyStatus[date] = { id: null, completed: false, notes: null, attachments: [], comments: [], reactions: [], completedTaskIds: new Set() }; }
                        });
                    } else if (member) { member.dailyStatus = {}; }
                });
            }
            this.dashboard = response.data;
        } catch (error) { console.error('Lỗi khi tải dashboard:', error); this.error = 'Không thể tải dữ liệu tiến độ.'; this.dashboard = null; }
        finally { this.isLoading = false; }
    },
    async logDailyProgress(shareableLink, progressData) {
       if (!shareableLink) { throw new Error("Không tìm thấy mã kế hoạch."); }
       try { const response = await progressService.logProgress(shareableLink, progressData); await this.fetchUserStats(); await this.fetchChartData(); /* Fetch lại chart data sau check-in */ }
       catch (error) { console.error('Lỗi khi ghi nhận tiến độ:', error); throw error; }
     },
    clearDashboard() { this.dashboard = null; this.currentPlanShareableLink = null; this.isLoading = false; this.error = null; },
    updateDashboardFromWebSocket(updateData) {
        const { date, memberEmail, progressSummary } = updateData; if (this.dashboard && this.dashboard.membersProgress) { const memberIndex = this.dashboard.membersProgress.findIndex(m => m.userEmail === memberEmail); if (memberIndex !== -1 && this.dashboard.membersProgress[memberIndex]?.dailyStatus) { const completedTaskIdsSet = new Set(Array.isArray(progressSummary.completedTaskIds) ? progressSummary.completedTaskIds : []); const newProgressForDate = { ...progressSummary, completedTaskIds: completedTaskIdsSet, attachments: Array.isArray(progressSummary.attachments) ? progressSummary.attachments : [], comments: Array.isArray(progressSummary.comments) ? progressSummary.comments : [], reactions: Array.isArray(progressSummary.reactions) ? progressSummary.reactions : [] }; const updatedDailyStatus = { ...this.dashboard.membersProgress[memberIndex].dailyStatus, [date]: newProgressForDate }; this.dashboard.membersProgress[memberIndex].dailyStatus = updatedDailyStatus; const memberStatuses = Object.values(updatedDailyStatus); this.dashboard.membersProgress[memberIndex].completedDays = memberStatuses.filter(s => s && s.id && s.completed).length; const planDuration = Object.keys(updatedDailyStatus).length || 1; this.dashboard.membersProgress[memberIndex].completionPercentage = planDuration > 0 ? (this.dashboard.membersProgress[memberIndex].completedDays / planDuration) * 100 : 0; } }
    },

    // Action fetch stats (không đổi)
    async fetchUserStats() {
      const authStore = useAuthStore(); if (this.isLoadingStats || !authStore.isAuthenticated) return; this.isLoadingStats = true; this.errorStats = null; console.log("Fetching user stats..."); try { const response = await userService.getMyStats(); this.userStats = response.data; console.log("User stats fetched:", this.userStats); } catch (error) { console.error('Lỗi khi tải user stats:', error); this.errorStats = 'Không thể tải thông tin thống kê.'; } finally { this.isLoadingStats = false; }
    },

    // --- ACTION MỚI ĐỂ FETCH CHART DATA ---
    async fetchChartData() {
      const authStore = useAuthStore();
      if (this.isChartLoading || !authStore.isAuthenticated) return;

      this.isChartLoading = true;
      this.errorChart = null;
      console.log("Fetching progress chart data...");

      try {
        const response = await userService.getMyProgressChartData();
        // Sắp xếp dữ liệu theo ngày tăng dần nếu API chưa đảm bảo
        this.chartData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log("Chart data fetched:", this.chartData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu biểu đồ:', error);
        this.errorChart = 'Không thể tải dữ liệu biểu đồ.';
        this.chartData = []; // Reset về mảng rỗng nếu lỗi
      } finally {
        this.isChartLoading = false;
      }
    },
    // --- KẾT THÚC ACTION CHART ---

    clearUserStats() { // Cập nhật để clear cả chart data
        this.userStats = {
             checkedInTodayComplete: false,
             currentStreak: 0,
             totalTasksToday: 0,
             completedTasksToday: 0
        };
        this.isLoadingStats = false;
        this.errorStats = null;
        // Clear chart data khi logout
        this.chartData = [];
        this.isChartLoading = false;
        this.errorChart = null;
    }
  },
});