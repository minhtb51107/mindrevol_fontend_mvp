import { defineStore } from 'pinia';
// [CẬP NHẬT] Service nội bộ
import notificationService from '@/features/notification/services/notificationService';
import router from '@/router'; // Import router để điều hướng

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    currentPage: 0,
    totalPages: 0,
    isLoading: false,
    error: null,
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    async fetchNotifications(loadMore = false) {
      if (this.isLoading) return; // Tránh gọi liên tục
      this.isLoading = true;
      this.error = null;

      const pageToFetch = loadMore ? this.currentPage : 0;

      try {
        const response = await notificationService.getNotifications(pageToFetch);
        const data = response.data;

        if (loadMore) {
          this.notifications.push(...data.content);
        } else {
          this.notifications = data.content;
        }

        // Tính toán unreadCount dựa trên danh sách hiện tại
        this.unreadCount = this.notifications.filter(n => !n.read).length;

        this.currentPage = data.number + 1; // page number hiện tại (API trả về 0-based)
        this.totalPages = data.totalPages;

      } catch (err) {
        console.error("Lỗi khi tải thông báo:", err);
        this.error = "Không thể tải thông báo.";
      } finally {
        this.isLoading = false;
      }
    },

    async markNotificationRead(notification) {
      if (notification.read) {
         // Nếu thông báo đã đọc, chỉ điều hướng nếu có link
         if (notification.link) {
            router.push(notification.link);
         }
         return; // Không cần gọi API
      }

      try {
        await notificationService.markAsRead(notification.id);
        // Cập nhật trạng thái 'read' trong state
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index].read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1); // Giảm count
        }
         // Điều hướng sau khi đánh dấu đã đọc
         if (notification.link) {
            router.push(notification.link);
         }
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
        // Không ném lỗi ra ngoài để tránh làm phiền người dùng
      }
    },

     // (Tùy chọn) Action đánh dấu tất cả đã đọc
    async markAllNotificationsRead() {
       if (this.unreadCount === 0) return;
       try {
          await notificationService.markAllAsRead();
          this.notifications.forEach(n => n.read = true);
          this.unreadCount = 0;
       } catch (err) {
          console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
       }
    },

    // Xóa thông báo khỏi state (chỉ dùng nội bộ nếu cần)
    clearNotifications() {
        this.notifications = [];
        this.unreadCount = 0;
        this.currentPage = 0;
        this.totalPages = 0;
    }
  },
});