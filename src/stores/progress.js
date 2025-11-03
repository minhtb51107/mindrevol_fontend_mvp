// File: src/stores/progress.js
import { defineStore } from 'pinia';
import progressService from '@/api/progressService';
import userService from '@/api/userService'; // Vẫn giữ nếu cần cho stats/chart (dù đã deprecated)
import { useAuthStore } from './auth';
import dayjs from 'dayjs'; // Import dayjs
import { usePlanStore } from './plan'; // <-- IMPORT PLAN STORE
import { useCommunityStore } from './community'; // <--- THÊM DÒNG NÀY

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

  	// --- STATE MỚI (Giữ nguyên) ---
  	isLoadingInteraction: false, // Loading chung cho comment/reaction
  	interactionError: null,
  	editingCheckInCommentId: null, // ID của bình luận (check-in) đang sửa
  	editingCheckInCommentContent: '', // Nội dung bình luận (check-in) đang sửa
  	// --- KẾT THÚC STATE MỚI ---
  }),

  getters: {
  	 // (Getters gốc của bạn giữ nguyên)
  	 timelineSwimlanes: (state) => state.currentTimeline,
  	 getSelectedDate: (state) => state.selectedDate,
  },

  actions: {

  	/**
  	 * Thêm bình luận vào một CheckInEvent (PHIÊN BẢN THẬT)
  	 */
  	async addCommentToCheckIn(checkInId, content) {
  	if (!this.currentPlanShareableLink) {
    	throw new Error("Không tìm thấy mã kế hoạch.");
  	}
  	this.isLoadingInteraction = true;
  	this.interactionError = null;
  	try {
    	// BƯỚC 1: Gọi API thật
    	const response = await progressService.addCommentToCheckIn(
    	this.currentPlanShareableLink, 
    	checkInId, 
    	{ content }
    	);
    	
    	// BƯỚC 2: Cập nhật state cục bộ (Optimistic Update)
    	this.currentTimeline?.forEach(memberTimeline => {
    	const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
    	if (checkIn) {
    	if (!checkIn.comments) {
    	checkIn.comments = [];
    	}
    	checkIn.comments.push(response.data); 
    	checkIn.commentCount = (checkIn.commentCount || 0) + 1; 
    	}
    	});

  	} catch (error) {
    	console.error('Lỗi khi thêm bình luận check-in:', error);
    	this.interactionError = error.response?.data?.message || 'Không thể gửi bình luận.';
    	throw error;
  	} finally {
    	this.isLoadingInteraction = false;
  	}
  	},

  	/**
  	 * Xóa bình luận khỏi một CheckInEvent (PHIÊN BẢN THẬT)
  	 */
  	async deleteCheckInComment(checkInId, commentId) {
  	if (!this.currentPlanShareableLink) {
    	throw new Error("Không tìm thấy mã kế hoạch.");
  	}
  	this.isLoadingInteraction = true;
  	this.interactionError = null;
  	try {
    	// BƯỚC 1: Gọi API thật
    	await progressService.deleteCheckInComment(
    	this.currentPlanShareableLink, 
    	checkInId, 
    	commentId
    	);

    	// BƯỚC 2: Cập nhật state cục bộ (Optimistic Update)
    	this.currentTimeline?.forEach(memberTimeline => {
    	const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
    	if (checkIn && checkIn.comments) {
    	checkIn.comments = checkIn.comments.filter(c => c.id !== commentId);
    	checkIn.commentCount = Math.max(0, (checkIn.commentCount || 1) - 1);
    	}
    	});

  	} catch (error) {
    	console.error('Lỗi khi xóa bình luận check-in:', error);
    	this.interactionError = error.response?.data?.message || 'Không thể xóa bình luận.';
    	throw error;
  	} finally {
    	this.isLoadingInteraction = false;
  	}
  	},

  	/**
  	 * Bật/tắt reaction trên một CheckInEvent (PHIÊN BẢN THẬT)
  	 */
  	async toggleReactionOnCheckIn(checkInId, reactionType) {
  	if (!this.currentPlanShareableLink) {
    	throw new Error("Không tìm thấy mã kế hoạch.");
  	}
  	
  	// BƯỚC 1: Optimistic Update (Cập nhật UI trước)
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
  	
  	// BƯỚC 2: Gọi API thật
  	try {
        // === SỬA LỖI REACTION 400 ===
    	await progressService.toggleReactionOnCheckIn(
    	this.currentPlanShareableLink, 
    	checkInId, 
        // Sửa "type" thành "reactionType" để khớp với DTO `AddReactionRequest`
    	{ reactionType: reactionType } 
    	);
        // === KẾT THÚC SỬA ===
    	// Thành công!

  	} catch (error) {
    	console.error('Lỗi khi toggle reaction check-in:', error);
    	// BƯỚC 3: Rollback
    	if (checkInRef) {
    	checkInRef.reactions = oldReactions;
    	}
    	this.interactionError = 'Không thể thả cảm xúc. Vui lòng thử lại.';
  	}
  	},
  	
  	// --- CÁC HÀNH ĐỘNG HỖ TRỢ SỬA BÌNH LUẬN (PHIÊN BẢN THẬT) ---
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
  	const commentId = this.editingCheckInCommentId;
  	const content = this.editingCheckInCommentContent;
  	
  	try {
    	// BƯỚC 1: Gọi API
    	const response = await progressService.updateCheckInComment(
    	this.currentPlanShareableLink, 
    	checkInId, 
    	commentId, 
    	{ content: content }
    	);
    	
    	// BƯỚC 2: Cập nhật state cục bộ
    	this.currentTimeline?.forEach(memberTimeline => {
    	const checkIn = memberTimeline.checkIns.find(c => c.id === checkInId);
    	if (checkIn && checkIn.comments) {
    	const commentIndex = checkIn.comments.findIndex(c => c.id === commentId);
    	if (commentIndex > -1) {
    	checkIn.comments[commentIndex] = response.data; // Cập nhật comment
    	}
    	}
    	});
    	
    	this.cancelEditingCheckInComment(); 

  	} catch (error) {
    	console.error('Lỗi khi sửa bình luận check-in:', error);
    	this.interactionError = error.response?.data?.message || 'Không thể lưu bình luận.';
    	throw error;
  	} finally {
    	this.isLoadingInteraction = false;
  	}
  	},

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
    	const response = await progressService.getDailyTimeline(shareableLink, date); 
    	this.currentTimeline = response.data || [];
    	 console.log("ProgressStore: Timeline data fetched:", this.currentTimeline);
    	 
    	const communityStore = useCommunityStore();
         if (communityStore.selectedProgress) {
             const selectedId = communityStore.selectedProgress.id;
             let updatedProgressData = null;

             // Tìm dữ liệu mới nhất của check-in đang được chọn trong modal
             for (const memberTimeline of this.currentTimeline) {
                 // Dùng .find() trên mảng checkIns của mỗi member
                 updatedProgressData = memberTimeline.checkIns.find(c => c.id === selectedId);
                 if (updatedProgressData) break; // Thoát ngay khi tìm thấy
             }

             if (updatedProgressData) {
                 // Đẩy dữ liệu mới vào communityStore để modal tự cập nhật
                 // (Giả sử communityStore cho phép gán trực tiếp)
                 communityStore.selectedProgress = updatedProgressData; 
                 console.log("ProgressStore: Đã đồng bộ dữ liệu mới nhất vào communityStore.selectedProgress");
             } else {
                 // Có thể check-in đã bị xóa, đóng modal lại
                 console.log("ProgressStore: Check-in đang xem (ID: " + selectedId + ") không còn tồn tại. Đóng modal.");
                 communityStore.clearSelectedProgress(); // Đóng modal
             }
         }
    	 
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
    	const response = await progressService.createCheckIn(shareableLink, checkInData);
    	console.log("ProgressStore: Check-in successful:", response.data);

    	const checkInDate = dayjs().format('YYYY-MM-DD');
    	if (checkInDate === this.selectedDate && 
    	checkInData.completedTaskIds && 
    	checkInData.completedTaskIds.length > 0) 
    	{
    	console.log(`ProgressStore: (Inside submitCheckIn) Pushing new completed IDs to planStore (optimistic):`, checkInData.completedTaskIds);
    	planStore.addCompletedTaskIds(checkInData.completedTaskIds); 
    	}
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
  	
  	// === SỬA LỖI WEBSOCKET ===
  	// Gom nhóm tất cả các sự kiện update/delete/reaction
    else if (
        updateData.type === 'UPDATE_CHECK_IN' ||
        updateData.type === 'DELETE_CHECK_IN' ||
        updateData.type === 'NEW_CHECKIN_COMMENT' ||
        updateData.type === 'UPDATE_CHECKIN_COMMENT' || // Thêm
        updateData.type === 'DELETE_CHECKIN_COMMENT' || // Thêm
        updateData.type === 'UPDATE_CHECKIN_REACTION'    // Thêm
    ) {
    	 console.log(`ProgressStore: WebSocket received ${updateData.type}. Refetching timeline...`);
    	 if (this.currentPlanShareableLink) {
    	 // Chỉ cần gọi debouncedRefetchTimeline cho tất cả các sự kiện này
    	 this.debouncedRefetchTimeline();
    	 }
    }
    // === KẾT THÚC SỬA ===
  	
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