// File: src/stores/progress.js
import { defineStore } from 'pinia';
import dayjs from 'dayjs';

// [CẬP NHẬT] Services
import progressService from '@/features/progress/services/progressService';
import userService from '@/features/auth/services/userService';

// [CẬP NHẬT] Stores
import { useAuthStore } from '@/features/auth/stores/authStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { usePlanTaskStore } from '@/features/plan/stores/planTaskStore';
import { useCommunityStore } from '@/features/community/stores/communityStore';

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

    isLoadingInteraction: false,
    interactionError: null,
    editingCheckInCommentId: null,
    editingCheckInCommentContent: '',
    todayCompletedTaskIds: new Set(), // <-- BẮT BUỘC PHẢI CÓ DÒNG NÀY

    // Thêm vào state
journeyPathData: [],
isLoadingJourneyPath: false,
  }),

  getters: {
     timelineSwimlanes: (state) => state.currentTimeline,
     getSelectedDate: (state) => state.selectedDate,
  },

  actions: {
    async addCommentToCheckIn(checkInId, content) {
        if (!this.currentPlanShareableLink) throw new Error("Không tìm thấy mã kế hoạch.");
        this.isLoadingInteraction = true;
        this.interactionError = null;
        try {
            const response = await progressService.addCommentToCheckIn(this.currentPlanShareableLink, checkInId, { content });
            this.currentTimeline?.forEach(memberTimeline => {
                const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
                if (checkIn) {
                    if (!checkIn.comments) checkIn.comments = [];
                    checkIn.comments.push(response.data); 
                    checkIn.commentCount = (checkIn.commentCount || 0) + 1; 
                }
            });
        } catch (error) {
            console.error('Lỗi thêm bình luận:', error);
            this.interactionError = error.response?.data?.message || 'Không thể gửi bình luận.';
            throw error;
        } finally {
            this.isLoadingInteraction = false;
        }
    },

    async deleteCheckInComment(checkInId, commentId) {
        if (!this.currentPlanShareableLink) throw new Error("Không tìm thấy mã kế hoạch.");
        this.isLoadingInteraction = true;
        this.interactionError = null;
        try {
            await progressService.deleteCheckInComment(this.currentPlanShareableLink, checkInId, commentId);
            this.currentTimeline?.forEach(memberTimeline => {
                const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
                if (checkIn && checkIn.comments) {
                    checkIn.comments = checkIn.comments.filter(c => c.id !== commentId);
                    checkIn.commentCount = Math.max(0, (checkIn.commentCount || 1) - 1);
                }
            });
        } catch (error) {
            console.error('Lỗi xóa bình luận:', error);
            this.interactionError = error.response?.data?.message || 'Không thể xóa bình luận.';
            throw error;
        } finally {
            this.isLoadingInteraction = false;
        }
    },

    async toggleReactionOnCheckIn(checkInId, reactionType) {
        if (!this.currentPlanShareableLink) throw new Error("Không tìm thấy mã kế hoạch.");
        let oldReactions = [];
        let checkInRef = null;
        this.currentTimeline?.forEach(memberTimeline => {
            const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
            if (checkIn) {
                checkInRef = checkIn;
                if (!checkIn.reactions) checkIn.reactions = [];
                oldReactions = JSON.parse(JSON.stringify(checkIn.reactions)); 
                let reaction = checkIn.reactions.find(r => r.type === reactionType);
                if (reaction) {
                    if (reaction.hasCurrentUserReacted) {
                        reaction.count--;
                        reaction.hasCurrentUserReacted = false;
                    } else {
                        reaction.count++;
                        reaction.hasCurrentUserReacted = true;
                    }
                } else {
                    checkIn.reactions.push({ type: reactionType, count: 1, hasCurrentUserReacted: true });
                }
            }
        });
        try {
            await progressService.toggleReactionOnCheckIn(this.currentPlanShareableLink, checkInId, { reactionType });
        } catch (error) {
            console.error('Lỗi toggle reaction:', error);
            if (checkInRef) checkInRef.reactions = oldReactions;
            this.interactionError = 'Không thể thả cảm xúc.';
        }
    },
    
    startEditingCheckInComment(comment) {
        this.editingCheckInCommentId = comment.id;
        this.editingCheckInCommentContent = comment.content;
        this.interactionError = null;
    },
    
    cancelEditingCheckInComment() {
        this.editingCheckInCommentId = null;
        this.editingCheckInCommentContent = '';
    },
    
    async saveEditingCheckInComment(checkInId) {
        if (!this.editingCheckInCommentId || !this.currentPlanShareableLink) return;
        this.isLoadingInteraction = true;
        this.interactionError = null;
        try {
            const response = await progressService.updateCheckInComment(this.currentPlanShareableLink, checkInId, this.editingCheckInCommentId, { content: this.editingCheckInCommentContent });
            this.currentTimeline?.forEach(memberTimeline => {
                const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
                if (checkIn && checkIn.comments) {
                    const idx = checkIn.comments.findIndex(c => c.id === this.editingCheckInCommentId);
                    if (idx > -1) checkIn.comments[idx] = response.data;
                }
            });
            this.cancelEditingCheckInComment(); 
        } catch (error) {
            console.error('Lỗi sửa bình luận:', error);
            this.interactionError = error.response?.data?.message || 'Không thể lưu bình luận.';
            throw error;
        } finally {
            this.isLoadingInteraction = false;
        }
    },

    setSelectedDate(date) {
        const newDate = dayjs(date).format('YYYY-MM-DD');
        if (newDate !== this.selectedDate) {
            this.selectedDate = newDate;
            if (this.currentPlanShareableLink) {
                this.fetchTimeline(this.currentPlanShareableLink, newDate);
            }
        }
    },
    
    getCompletedTaskIdsForCurrentUser(currentUserId) {
        if (!this.currentTimeline || !currentUserId) return new Set(); 
        const currentUserTimeline = this.currentTimeline.find(t => t.userId === currentUserId);
        if (!currentUserTimeline || !Array.isArray(currentUserTimeline.checkInEvents)) return new Set(); 
        const completedIds = new Set();
        currentUserTimeline.checkInEvents.forEach(event => {
            if (Array.isArray(event.completedTaskIds)) {
                event.completedTaskIds.forEach(id => completedIds.add(id));
            }
        });
        return completedIds;
    },

    // Tìm action fetchTimeline trong src/stores/progress.js và thay thế toàn bộ bằng:

    async fetchTimeline(shareableLink, date = this.selectedDate) {
        if (!shareableLink) {
            this.timelineError = "Thiếu mã kế hoạch.";
            this.currentTimeline = null;
            return;
        }
        this.isLoadingTimeline = true;
        this.timelineError = null;
        this.currentPlanShareableLink = shareableLink; 
        
        const planTaskStore = usePlanTaskStore();
        const authStore = useAuthStore();

        try {
            const response = await progressService.getDailyTimeline(shareableLink, date); 
            this.currentTimeline = response.data || [];
            
            // === [FIX QUAN TRỌNG] ĐỒNG BỘ TRẠNG THÁI HOÀN THÀNH ===
            if (authStore.currentUser && authStore.currentUser.id) {
                 // Ép kiểu về Number để đảm bảo so sánh chính xác (tránh lỗi "2" !== 2)
                 const currentUserId = Number(authStore.currentUser.id);
                 
                 // Tìm timeline của chính user đang đăng nhập
                 const myTimeline = this.currentTimeline.find(t => Number(t.userId) === currentUserId);
                 const myCompletedIds = new Set();

                 if (myTimeline) {
                     // console.log("ProgressStore: Tìm thấy timeline của user:", myTimeline);
                     if (Array.isArray(myTimeline.checkInEvents)) {
                         myTimeline.checkInEvents.forEach(event => {
                             // Gom completedTaskIds (mảng các ID số)
                             if (Array.isArray(event.completedTaskIds)) {
                                 event.completedTaskIds.forEach(id => myCompletedIds.add(Number(id)));
                             }
                             // Gom completedTasks (mảng object, dự phòng nếu backend trả về cái này)
                             if (Array.isArray(event.completedTasks)) {
                                 event.completedTasks.forEach(t => { 
                                     if(t.taskId) myCompletedIds.add(Number(t.taskId)); 
                                 });
                             }
                         });
                     }
                 } else {
                     console.warn(`ProgressStore: Không tìm thấy timeline cho User ID ${currentUserId} trong ngày ${date}`);
                 }

                 console.log("ProgressStore: Đồng bộ danh sách hoàn thành:", Array.from(myCompletedIds));
                 // Cập nhật ngay sang planTaskStore để UI hiển thị gạch ngang
                 planTaskStore.syncCompletedTaskIds(myCompletedIds);
            }
            // === [KẾT THÚC FIX] ===
            
            // (Logic cập nhật communityStore giữ nguyên)
            const communityStore = useCommunityStore();
            if (communityStore.selectedProgress) {
                 const selectedId = communityStore.selectedProgress.id;
                 let updated = null;
                 for (const mt of this.currentTimeline) {
                     updated = mt.checkIns.find(c => c.id === selectedId);
                     if (updated) break;
                 }
                 if (updated) communityStore.selectedProgress = updated;
                 else communityStore.clearSelectedProgress();
            }

        } catch (error) {
            console.error('Lỗi tải timeline:', error);
            this.timelineError = error.response?.data?.message || 'Không thể tải timeline.';
            this.currentTimeline = null; 
            planTaskStore.syncCompletedTaskIds(new Set());
        } finally {
            this.isLoadingTimeline = false;
        }
    },

    async fetchTodayCompletedTasks(shareableLink) {
    if (!shareableLink) return;
    try {
        // Gọi API vừa thêm ở Bước 1
        const response = await progressService.getTodayCompletedTasks(shareableLink);

        // Đảm bảo luôn tạo ra Set, kể cả khi data null/undefined
        this.todayCompletedTaskIds = new Set(response.data || []);

    } catch (error) {
        console.error("Lỗi tải task đã hoàn thành hôm nay:", error);
        // Fallback an toàn: nếu lỗi thì coi như chưa hoàn thành task nào, 
        // nhưng vẫn phải là một Set để không crash UI
        this.todayCompletedTaskIds = new Set(); 
    } finally {
         // Đồng bộ sang planTaskStore (nếu bạn đang dùng nó để hiển thị ở DailyTaskList)
         try {
             const planTaskStore = usePlanTaskStore();
             planTaskStore.syncCompletedTaskIds(this.todayCompletedTaskIds);
         } catch (e) {
             console.warn("Không thể đồng bộ sang planTaskStore:", e);
         }
    }
},

// Thêm vào actions
async fetchJourneyPath(shareableLink) {
  if (this.isLoadingJourneyPath) return;
  this.isLoadingJourneyPath = true;
  try {
    const data = await progressService.fetchJourneyPath(shareableLink); //
    this.journeyPathData = data;
  } catch (error) {
    console.error('Lỗi khi tải Journey Path:', error);
  } finally {
    this.isLoadingJourneyPath = false;
  }
},

    async submitCheckIn(shareableLink, checkInData) {
        if (!shareableLink) throw new Error("Thiếu mã kế hoạch.");
        const planTaskStore = usePlanTaskStore(); 
        try {
            const response = await progressService.createCheckIn(shareableLink, checkInData);

            await this.fetchTodayCompletedTasks(shareableLink);
            
            // 1. Cập nhật lạc quan cho Task List (gạch ngang ngay lập tức)
            const checkInDate = dayjs().format('YYYY-MM-DD');
            if (checkInDate === this.selectedDate && checkInData.completedTaskIds?.length > 0) {
                planTaskStore.addCompletedTaskIds(checkInData.completedTaskIds); 
            }

            // 2. Tải lại thống kê
            await this.fetchUserStats();

            // 3. --- QUAN TRỌNG: TẢI LẠI TIMELINE NGAY LẬP TỨC ---
            // Điều này giúp check-in mới hiện lên ngay mà không cần F5
            if (checkInDate === this.selectedDate) {
                 await this.fetchTimeline(shareableLink, this.selectedDate);
            }

            return response.data;
        } catch (error) {
            console.error('Lỗi check-in:', error);
            throw error.response?.data?.message || error.message || 'Lỗi check-in.';
        }
    },

    async updateCheckInAction(checkInEventId, updateData) {
        if (!this.currentPlanShareableLink) throw new Error("Thiếu mã kế hoạch.");
        try {
            await progressService.updateCheckIn(this.currentPlanShareableLink, checkInEventId, updateData);
            // --- QUAN TRỌNG: Tải lại timeline sau khi update ---
            await this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
        } catch (error) {
            console.error('Lỗi cập nhật check-in:', error);
            throw error.response?.data?.message || 'Không thể cập nhật check-in.';
        }
    },

    async deleteCheckInAction(checkInEventId) {
        if (!this.currentPlanShareableLink) throw new Error("Thiếu mã kế hoạch.");
         try {
            await progressService.deleteCheckIn(this.currentPlanShareableLink, checkInEventId);
            // --- QUAN TRỌNG: Tải lại timeline sau khi xóa ---
            await this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
            
            // (Tùy chọn) Nếu muốn kỹ hơn, bạn có thể cần fetch lại cả daily tasks 
            // để bỏ gạch ngang các task bị xóa check-in, 
            // nhưng WebSocket hoặc lần chuyển ngày tiếp theo sẽ lo việc đó.
        } catch (error) {
            console.error('Lỗi xóa check-in:', error);
            throw error.response?.data?.message || 'Không thể xóa check-in.';
        }
    },

    handleWebSocketUpdate(updateData) {
        if (updateData.type === 'NEW_CHECK_IN' && updateData.checkInEvent) {
            const { checkInTimestamp, completedTaskIds, userId } = updateData.checkInEvent;
            const checkInDate = dayjs(checkInTimestamp).format('YYYY-MM-DD');
            const authStore = useAuthStore();
            // SỬA: Dùng planTaskStore
            const planTaskStore = usePlanTaskStore();

            if (this.currentPlanShareableLink && checkInDate === this.selectedDate) {
                 this.debouncedRefetchTimeline();
            }
            
            if (userId === authStore.currentUser?.id && 
                checkInDate === this.selectedDate &&
                completedTaskIds?.length > 0) 
            {
                // SỬA: Dùng planTaskStore
                planTaskStore.addCompletedTaskIds(completedTaskIds); 
            }
        } else if (['UPDATE_CHECK_IN', 'DELETE_CHECK_IN', 'NEW_CHECKIN_COMMENT', 'UPDATE_CHECKIN_COMMENT', 'DELETE_CHECKIN_COMMENT', 'UPDATE_CHECKIN_REACTION'].includes(updateData.type)) {
             if (this.currentPlanShareableLink) this.debouncedRefetchTimeline();
        }
    },

    debouncedRefetchTimeline() {
        if (!this._refetchTimelineDebounce) {
            this._refetchTimelineDebounce = debounce(() => {
                if (this.currentPlanShareableLink) {
                    this.fetchTimeline(this.currentPlanShareableLink, this.selectedDate);
                }
            }, 600); 
        }
        this._refetchTimelineDebounce();
    },

    clearPlanProgressData() {
        this.currentPlanShareableLink = null; 
        this.currentTimeline = null;
        this.isLoadingTimeline = false;
        this.timelineError = null;
        try {
             // SỬA: Dùng planTaskStore
             const planTaskStore = usePlanTaskStore();
             if(planTaskStore) planTaskStore.syncCompletedTaskIds(new Set());
        } catch (e) { /* ignore */ }
    },

    // ... (Giữ nguyên fetchUserStats, fetchChartData, clearUserSessionData cũ nếu chưa xóa) ...
     async fetchUserStats() {
         // ... (giữ nguyên code cũ của bạn)
     },
     async fetchChartData() {
         // ... (giữ nguyên code cũ của bạn)
     },
     clearUserSessionData() {
        this.userStats = { checkedInTodayComplete: false, currentStreak: 0, totalTasksToday: 0, completedTasksToday: 0 };
        this.isLoadingStats = false; this.errorStats = null;
        this.chartData = []; this.isChartLoading = false; this.errorChart = null;
        this.clearPlanProgressData();
        this.selectedDate = dayjs().format('YYYY-MM-DD');
     }
  },
});