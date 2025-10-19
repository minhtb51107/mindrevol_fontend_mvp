// File: src/stores/community.js
import { defineStore } from 'pinia';
import communityService from '@/api/communityService';
import { useProgressStore } from './progress'; // Import progress store
import { usePlanStore } from './plan'; // Import plan store (nếu cần lấy task)

export const useCommunityStore = defineStore('community', {
  state: () => ({
    selectedProgress: null,
    isLoading: false,
    error: null, // Thêm state error
  }),
  actions: {
    selectProgress(progressData) {
        this.selectedProgress = progressData;
        this.error = null; // Reset lỗi khi chọn mới
    },

    clearSelectedProgress() {
        this.selectedProgress = null;
    },

    async addComment(content) {
      if (!this.selectedProgress?.id) {
         this.error = "Không tìm thấy thông tin tiến độ để bình luận.";
         return;
      }
      this.isLoading = true;
      this.error = null;
      try {
        const response = await communityService.postComment(this.selectedProgress.id, content);
        // Cập nhật state nội bộ trước khi fetch lại dashboard
         if (this.selectedProgress.comments) {
            this.selectedProgress.comments.push(response.data);
        } else {
            this.selectedProgress.comments = [response.data];
        }
      } catch(error) {
        console.error("Lỗi khi bình luận:", error);
        this.error = error.response?.data?.message || "Gửi bình luận thất bại.";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async toggleReaction(reactionType) {
        if (!this.selectedProgress?.id) {
             this.error = "Không tìm thấy thông tin tiến độ để thả reaction.";
             return;
        }

        const progressStore = useProgressStore();
        // Lấy shareableLink TỪ PROGRESS STORE
        const shareableLink = progressStore.currentPlanShareableLink;

        if (!shareableLink) {
            console.error("toggleReaction không tìm thấy shareableLink trong progressStore");
            this.error = "Lỗi: Không tìm thấy mã kế hoạch hiện tại.";
            return; // Dừng lại nếu không có link
        }

        const currentUserReaction = this.selectedProgress.reactions?.find(r => r.hasCurrentUserReacted);
        const currentReactionType = currentUserReaction?.type;

        this.isLoading = true; // Có thể thêm state loading riêng cho reaction
        this.error = null;

        try {
            if (currentReactionType === reactionType) {
                // Nếu click lại reaction cũ -> xóa
                await communityService.removeReaction(this.selectedProgress.id);
            } else {
                // Nếu click reaction mới (hoặc chưa có) -> thêm/cập nhật
                await communityService.addOrUpdateReaction(this.selectedProgress.id, reactionType);
            }

            // Tải lại dashboard để cập nhật state tổng thể
            await progressStore.fetchDashboard(shareableLink);

            // Cập nhật lại selectedProgress trong modal với dữ liệu MỚI NHẤT từ dashboard vừa fetch
            const updatedDashboard = progressStore.dashboard;
            if (updatedDashboard?.membersProgress) {
                 const updatedMember = updatedDashboard.membersProgress.find(m => m.userFullName === this.selectedProgress.memberFullName);
                 if (updatedMember?.dailyStatus) {
                     const updatedProgressData = updatedMember.dailyStatus[this.selectedProgress.date];
                     if (updatedProgressData) {
                         // Cập nhật lại state selectedProgress với dữ liệu mới
                         this.selectProgress({
                             ...updatedProgressData,
                             memberFullName: updatedMember.userFullName,
                             date: this.selectedProgress.date,
                         });
                     } else {
                          console.warn("Không tìm thấy dữ liệu progress cập nhật sau khi fetch lại dashboard.");
                          // Giữ nguyên modal hoặc đóng? Tùy logic mong muốn.
                     }
                 }
            }

        } catch (error) {
            console.error("Lỗi khi thả reaction:", error);
            this.error = error.response?.data?.message || "Thao tác reaction thất bại.";
            // Không ném lỗi ra ngoài để tránh crash UI, chỉ hiển thị lỗi qua state `error`
        } finally {
             this.isLoading = false;
        }
    }
  },
});