// File: src/stores/community.js
import { defineStore } from 'pinia';
// [CẬP NHẬT] Service nội bộ
import communityService from '@/features/community/services/communityService';

// [CẬP NHẬT] Stores từ các feature khác
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const useCommunityStore = defineStore('community', {
  state: () => ({
    selectedProgress: null,
    isLoading: false,
    error: null,
    // Thêm state để quản lý việc sửa comment
    editingCommentId: null,
    editingCommentContent: '',
  }),
  actions: {
    selectProgress(progressData) {
        this.selectedProgress = progressData;
        this.error = null;
        this.editingCommentId = null; // Reset trạng thái sửa khi chọn progress mới
        this.editingCommentContent = '';
    },

    clearSelectedProgress() {
        this.selectedProgress = null;
        this.editingCommentId = null;
        this.editingCommentContent = '';
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
         if (this.selectedProgress.comments) {
            this.selectedProgress.comments.push(response.data);
        } else {
            this.selectedProgress.comments = [response.data];
        }
      } catch(error) {
        console.error("Lỗi khi bình luận:", error);
        this.error = error.response?.data?.message || "Gửi bình luận thất bại.";
        throw error; // Ném lỗi để component xử lý (ví dụ: hiển thị thông báo)
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
        const shareableLink = progressStore.currentPlanShareableLink;
        if (!shareableLink) {
            console.error("toggleReaction không tìm thấy shareableLink trong progressStore");
            this.error = "Lỗi: Không tìm thấy mã kế hoạch hiện tại.";
            return;
        }
        const currentUserReaction = this.selectedProgress.reactions?.find(r => r.hasCurrentUserReacted);
        const currentReactionType = currentUserReaction?.type;
        this.isLoading = true;
        this.error = null;
        try {
            if (currentReactionType === reactionType) {
                await communityService.removeReaction(this.selectedProgress.id);
            } else {
                await communityService.addOrUpdateReaction(this.selectedProgress.id, reactionType);
            }

            // ================== START: SỬA LỖI ==================
            // Lỗi là ở đây: Tên hàm đúng là 'fetchTimeline' và nó cần cả 'date'
            
            // DÒNG CŨ (BỊ LỖI):
            // await progressStore.fetchDashboard(shareableLink);
            
            // DÒNG MỚI (ĐÃ SỬA):
            await progressStore.fetchTimeline(shareableLink, this.selectedProgress.date);
            
            // =================== END: SỬA LỖI ===================

            const updatedDashboard = progressStore.dashboard;
            if (updatedDashboard?.membersProgress) {
                 const updatedMember = updatedDashboard.membersProgress.find(m => m.userFullName === this.selectedProgress.memberFullName);
                 if (updatedMember?.dailyStatus) {
                     const updatedProgressData = updatedMember.dailyStatus[this.selectedProgress.date];
                     if (updatedProgressData) {
                         this.selectProgress({ // Dùng selectProgress để cập nhật đúng cách
                             ...updatedProgressData,
                             memberFullName: updatedMember.userFullName,
                             date: this.selectedProgress.date,
                         });
                     } else {
                          console.warn("Không tìm thấy dữ liệu progress cập nhật sau khi fetch lại dashboard.");
                     }
                 }
            }
        } catch (error) {
            console.error("Lỗi khi thả reaction:", error);
            this.error = error.response?.data?.message || "Thao tác reaction thất bại.";
            throw error; // Ném lỗi để component xử lý
        } finally {
             this.isLoading = false;
        }
    },

    // --- THÊM CÁC ACTIONS NÀY ---
    startEditingComment(comment) {
        this.editingCommentId = comment.id;
        this.editingCommentContent = comment.content;
        this.error = null; // Xóa lỗi cũ nếu có
    },

    cancelEditingComment() {
        this.editingCommentId = null;
        this.editingCommentContent = '';
    },

    async saveEditedComment() {
        if (!this.editingCommentId || !this.editingCommentContent.trim()) {
            this.error = "Nội dung bình luận không được để trống.";
            return;
        }
        this.isLoading = true; // Có thể dùng loading riêng cho việc sửa
        this.error = null;
        try {
            const response = await communityService.updateComment(this.editingCommentId, this.editingCommentContent);
            // Cập nhật comment trong state
            const index = this.selectedProgress.comments.findIndex(c => c.id === this.editingCommentId);
            if (index !== -1) {
                this.selectedProgress.comments[index] = response.data;
            }
            // Kết thúc chỉnh sửa
            this.cancelEditingComment();
        } catch (error) {
            console.error("Lỗi khi cập nhật bình luận:", error);
            this.error = error.response?.data?.message || "Cập nhật bình luận thất bại.";
            // Không cancel editing để người dùng có thể thử lại
            throw error; // Ném lỗi để component xử lý
        } finally {
            this.isLoading = false;
        }
    },

    async deleteComment(commentId) {
        if (!this.selectedProgress) return;
        // Có thể thêm confirm dialog ở component trước khi gọi action này
        this.isLoading = true; // Có thể dùng loading riêng cho việc xóa
        this.error = null;
        try {
            await communityService.deleteComment(commentId);
            // Xóa comment khỏi state
            this.selectedProgress.comments = this.selectedProgress.comments.filter(c => c.id !== commentId);
        } catch (error) {
            console.error("Lỗi khi xóa bình luận:", error);
            this.error = error.response?.data?.message || "Xóa bình luận thất bại.";
            throw error; // Ném lỗi để component xử lý
        } finally {
            this.isLoading = false;
        }
    },
    // --- KẾT THÚC THÊM ---

  },
});