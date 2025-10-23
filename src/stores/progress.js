// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';
import { useAuthStore } from './auth'; // Import authStore để lấy thông tin user

export const useProgressStore = defineStore('progress', {
  state: () => ({
    dashboard: null,
    currentPlanShareableLink: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchDashboard(shareableLink) {
      if (!shareableLink) {
         console.error("fetchDashboard được gọi mà không có shareableLink!");
         this.error = "Không thể tải dữ liệu tiến độ (thiếu mã kế hoạch).";
         return;
      }
      if (!this.dashboard || this.currentPlanShareableLink !== shareableLink) {
        this.isLoading = true;
      }
      this.currentPlanShareableLink = shareableLink;
      this.error = null;
      try {
        const response = await progressService.getDashboard(shareableLink);
        // Xử lý completedTaskIds thành Set và đảm bảo các mảng tồn tại khi fetch
        if (response.data && Array.isArray(response.data.membersProgress)) {
            response.data.membersProgress.forEach(member => {
                if (member.dailyStatus) {
                    Object.keys(member.dailyStatus).forEach(date => {
                        const progress = member.dailyStatus[date];
                        if (progress) { // Chỉ xử lý nếu có progress data
                           // Chuyển completedTaskIds thành Set
                            if (Array.isArray(progress.completedTaskIds)) {
                                progress.completedTaskIds = new Set(progress.completedTaskIds);
                            } else if (!progress.completedTaskIds) {
                                progress.completedTaskIds = new Set();
                            }
                           // Đảm bảo các mảng khác tồn tại
                           if (!Array.isArray(progress.attachments)) progress.attachments = [];
                           // if (!Array.isArray(progress.evidenceLinks)) progress.evidenceLinks = []; // Bỏ nếu không dùng evidenceLinks nữa
                           if (!Array.isArray(progress.comments)) progress.comments = [];
                           if (!Array.isArray(progress.reactions)) progress.reactions = [];
                        } else {
                            // Nếu không có progress data cho ngày này (null/undefined),
                            // tạo một object rỗng để tránh lỗi khi truy cập sau này
                             member.dailyStatus[date] = {
                                 id: null,
                                 completed: false,
                                 notes: null,
                                 attachments: [],
                                 // evidenceLinks: [],
                                 comments: [],
                                 reactions: [],
                                 completedTaskIds: new Set()
                             };
                        }
                    });
                } else if (member) { // Ensure dailyStatus object exists even if empty
                    member.dailyStatus = {};
                }
            });
        }
        this.dashboard = response.data;
      } catch (error) {
        console.error('Lỗi khi tải dashboard:', error);
        this.error = 'Không thể tải dữ liệu tiến độ.';
      } finally {
        this.isLoading = false;
      }
    },

    async logDailyProgress(shareableLink, progressData) {
       if (!shareableLink) {
           console.error("logDailyProgress thiếu shareableLink");
           throw new Error("Không tìm thấy mã kế hoạch.");
       }
       try {
         const response = await progressService.logProgress(shareableLink, progressData);
         const savedProgress = response.data; // DailyProgressResponse

         if (this.dashboard && this.dashboard.membersProgress) {
             const authStore = useAuthStore();
             const currentUserEmail = authStore.currentUser?.email;
             const memberIndex = this.dashboard.membersProgress.findIndex(m => m.userEmail === currentUserEmail);

             if (memberIndex !== -1 && this.dashboard.membersProgress[memberIndex].dailyStatus) {
                 const date = savedProgress.date;
                 const completedTaskIdsSet = new Set(Array.isArray(savedProgress.completedTaskIds) ? savedProgress.completedTaskIds : []);

                 // Tạo đối tượng summary mới khớp DailyProgressSummaryResponse
                 const progressSummary = {
                     id: savedProgress.id,
                     completed: savedProgress.completed,
                     notes: savedProgress.notes,
                     attachments: Array.isArray(savedProgress.attachments) ? savedProgress.attachments : [],
                     // evidenceLinks: Array.isArray(savedProgress.evidence) ? savedProgress.evidence : [], // Nếu dùng evidence chung
                     comments: Array.isArray(savedProgress.comments) ? savedProgress.comments : [],
                     reactions: Array.isArray(savedProgress.reactions) ? savedProgress.reactions : [],
                     completedTaskIds: completedTaskIdsSet
                 };

                 // *** THAY ĐỔI CÁCH CẬP NHẬT ĐỂ ĐẢM BẢO REACTIVITY ***
                 // Tạo một bản sao của dailyStatus, cập nhật ngày cụ thể, rồi gán lại
                 const updatedDailyStatus = {
                      ...this.dashboard.membersProgress[memberIndex].dailyStatus,
                      [date]: progressSummary // Ghi đè hoặc thêm mới ngày này
                 };
                 this.dashboard.membersProgress[memberIndex].dailyStatus = updatedDailyStatus;
                 // *** KẾT THÚC THAY ĐỔI ***

                 console.log(`Updated dashboard state for ${currentUserEmail} on ${date} after check-in`);

                 // Tính toán lại stats
                 const memberStatuses = Object.values(updatedDailyStatus);
                 this.dashboard.membersProgress[memberIndex].completedDays = memberStatuses.filter(s => s && s.id && s.completed).length; // Chỉ đếm ngày có ID (đã check-in)
                 const planDuration = Object.keys(updatedDailyStatus).length;
                 this.dashboard.membersProgress[memberIndex].completionPercentage = planDuration > 0
                       ? (this.dashboard.membersProgress[memberIndex].completedDays / planDuration) * 100
                       : 0;
             } else {
                  console.warn("Could not find current user/dailyStatus in dashboard state after check-in. Fetching full dashboard.");
                  await this.fetchDashboard(shareableLink);
             }
         } else {
             console.warn("Dashboard state not available for direct update after check-in. Fetching full dashboard.");
              await this.fetchDashboard(shareableLink);
         }
       } catch (error) {
         console.error('Lỗi khi ghi nhận tiến độ:', error);
         throw error;
       }
     },

    clearDashboard() {
        this.dashboard = null;
        this.currentPlanShareableLink = null;
        this.isLoading = false;
        this.error = null;
    },

    updateDashboardFromWebSocket(updateData) {
        const { date, memberEmail, progressSummary } = updateData;
        if (this.dashboard && this.dashboard.membersProgress) {
             const memberIndex = this.dashboard.membersProgress.findIndex(m => m.userEmail === memberEmail);
             if (memberIndex !== -1 && this.dashboard.membersProgress[memberIndex].dailyStatus) {
                 const completedTaskIdsSet = new Set(Array.isArray(progressSummary.completedTaskIds) ? progressSummary.completedTaskIds : []);
                 const attachments = Array.isArray(progressSummary.attachments) ? progressSummary.attachments : [];
                 // const evidenceLinks = Array.isArray(progressSummary.evidenceLinks) ? progressSummary.evidenceLinks : [];
                 const comments = Array.isArray(progressSummary.comments) ? progressSummary.comments : [];
                 const reactions = Array.isArray(progressSummary.reactions) ? progressSummary.reactions : [];

                 // *** TẠO OBJECT MỚI ĐỂ ĐẢM BẢO REACTIVITY ***
                  const newProgressForDate = {
                      ...progressSummary,
                      completedTaskIds: completedTaskIdsSet,
                      attachments,
                      // evidenceLinks,
                      comments,
                      reactions
                 };
                 const updatedDailyStatus = {
                     ...this.dashboard.membersProgress[memberIndex].dailyStatus,
                     [date]: newProgressForDate
                 };
                 this.dashboard.membersProgress[memberIndex].dailyStatus = updatedDailyStatus;
                 // *** KẾT THÚC THAY ĐỔI ***

                 console.log(`WS Updated dashboard state for ${memberEmail} on ${date}`);

                 // Tính toán lại stats
                 const memberStatuses = Object.values(updatedDailyStatus);
                 this.dashboard.membersProgress[memberIndex].completedDays = memberStatuses.filter(s => s && s.id && s.completed).length;
                 const planDuration = Object.keys(updatedDailyStatus).length;
                 this.dashboard.membersProgress[memberIndex].completionPercentage = planDuration > 0
                       ? (this.dashboard.membersProgress[memberIndex].completedDays / planDuration) * 100
                       : 0;
             } else {
                  console.warn(`Member ${memberEmail} not found in dashboard state during WS update.`);
             }
        }
    }
  },
});