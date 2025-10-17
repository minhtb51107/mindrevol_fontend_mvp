// File: src/stores/community.js
import { defineStore } from 'pinia';
import communityService from '@/api/communityService';
import { useProgressStore } from './progress'; // Để cập nhật lại dashboard

export const useCommunityStore = defineStore('community', {
  state: () => ({
    // dailyProgressId sẽ được dùng để fetch chi tiết sau này
    // Hiện tại, chúng ta sẽ truyền trực tiếp data vào
    selectedProgress: null, 
    isLoading: false,
  }),
  actions: {
    // Mở modal với dữ liệu của một ngày check-in cụ thể
    selectProgress(progressData) {
        this.selectedProgress = progressData;
    },

    clearSelectedProgress() {
        this.selectedProgress = null;
    },

    async addComment(content) {
      if (!this.selectedProgress) return;
      this.isLoading = true;
      try {
        const response = await communityService.postComment(this.selectedProgress.id, content);
        // Thêm comment mới vào danh sách hiện tại để UI cập nhật ngay lập tức
        this.selectedProgress.comments.push(response.data);
      } catch(error) {
        console.error("Lỗi khi bình luận:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

async toggleReaction(reactionType) {
    if (!this.selectedProgress) return;

    const progressStore = useProgressStore();
    if (!progressStore.dashboard) return;

    const shareableLink = progressStore.dashboard.planShareableLink; // Cần thêm trường này vào dashboard

    const currentUserReaction = this.selectedProgress.reactions.find(r => r.hasCurrentUserReacted);

    try {
        if (currentUserReaction && currentUserReaction.type === reactionType) {
            await communityService.removeReaction(this.selectedProgress.id);
        } else {
            await communityService.addOrUpdateReaction(this.selectedProgress.id, reactionType);
        }

        // Tải lại dashboard để cập nhật state
        await progressStore.fetchDashboard(shareableLink);

        // Cập nhật lại selectedProgress trong modal với dữ liệu mới nhất
        const updatedMember = progressStore.dashboard.membersProgress.find(m => m.userFullName === this.selectedProgress.memberFullName);
        if (updatedMember) {
            const updatedProgress = updatedMember.dailyStatus[this.selectedProgress.date];
            if (updatedProgress) {
                this.selectProgress({
                    ...updatedProgress,
                    memberFullName: updatedMember.userFullName,
                    date: this.selectedProgress.date,
                });
            }
        }

    } catch (error) {
        console.error("Lỗi khi thả reaction:", error);
        throw error;
    }
}
  },
});