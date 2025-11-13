// File: src/features/community/stores/friendStore.js
import { defineStore } from 'pinia';
import friendService from '../services/friendService';
import websocketService from '@/services/websocketService';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const useFriendStore = defineStore('friend', {
  state: () => ({
    friends: [],
    pendingRequests: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    friendCount: (state) => state.friends.length,
    requestCount: (state) => state.pendingRequests.length,
  },

// File: src/features/community/stores/friendStore.js
  actions: {
    // Tải cả hai danh sách
    async fetchAll() {
      this.isLoading = true;
      this.error = null;
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          friendService.getMyFriends(),
          friendService.getPendingRequests(),
        ]);
        this.friends = friendsRes.data;
        this.pendingRequests = requestsRes.data;
      } catch (e) {
        console.error("Lỗi tải danh sách bạn bè:", e);
        this.error = e.response?.data?.message || 'Không thể tải dữ liệu bạn bè.';
      } finally {
        this.isLoading = false;
      }
    },

    // Gửi lời mời
    async sendRequest(email) {
      this.isLoading = true;
      try {
        // === SỬA LỖI 500 (VALIDATION): Thêm .trim() để xóa khoảng trắng ===
        await friendService.sendFriendRequest(email.trim()); 
        // =========================================================
        return true; 
      } catch (e) {
        console.error("Lỗi gửi lời mời:", e);
        this.error = e.response?.data?.message || 'Gửi lời mời thất bại.';
        throw e; // Ném lỗi ra để UI xử lý
      } finally {
        this.isLoading = false;
      }
    },

    // Chấp nhận lời mời
    async acceptRequest(friendshipId) {
      try {
        await friendService.acceptRequest(friendshipId);
        await this.fetchAll();
      } catch (e) {
        console.error("Lỗi chấp nhận lời mời:", e);
        this.error = e.response?.data?.message || 'Thao tác thất bại.';
      }
    },

    // Từ chối lời mời
    async declineRequest(friendshipId) {
      try {
        await friendService.declineRequest(friendshipId);
        this.pendingRequests = this.pendingRequests.filter(req => req.friendshipId !== friendshipId);
      } catch (e) {
        console.error("Lỗi từ chối lời mời:", e);
        this.error = e.response?.data?.message || 'Thao tác thất bại.';
      }
    },

    // Xóa bạn
    async removeFriend(friendUserId) {
        try {
            await friendService.removeFriend(friendUserId);
            this.friends = this.friends.filter(f => f.userId !== friendUserId);
        } catch (e) {
            console.error("Lỗi xóa bạn:", e);
            this.error = e.response?.data?.message || 'Thao tác thất bại.';
        }
    },

    // === BẮT ĐẦU 2 HÀM MỚI BỊ THIẾU ===
    /**
     * Lắng nghe các cập nhật liên quan đến bạn bè qua WebSocket.
     */
    subscribeToFriendUpdates() {
      if (!websocketService.isConnected()) {
        console.warn("FriendStore: WebSocket chưa kết nối, không thể subscribe.");
        return;
      }
      
      const authStore = useAuthStore();
      const userId = authStore.currentUser?.id;

      if (userId) {
        const userTopic = `/topic/user/${userId}/friends`; // Phải khớp với topic ở backend
        console.log("FriendStore: Đăng ký lắng nghe topic:", userTopic);
        
        websocketService.subscribe(userTopic, (message) => {
          console.log("FriendStore: Nhận được tin nhắn friend:", message);
          
          if (message && message.type === 'NEW_FRIEND_REQUEST') {
            console.log("FriendStore: Có lời mời mới, tải lại danh sách...");
            this.fetchAll();
          }
          
          if (message && (message.type === 'FRIEND_REQUEST_ACCEPTED' || message.type === 'FRIEND_REMOVED')) {
             this.fetchAll();
          }
        });
      } else {
        console.warn("FriendStore: Không tìm thấy User ID để đăng ký WebSocket.");
      }
    },

    /**
     * Hủy lắng nghe khi logout.
     */
    unsubscribeFromFriendUpdates() {
      if (websocketService.isConnected()) {
         const authStore = useAuthStore();
         const userId = authStore.currentUser?.id;
         if (userId) {
           const userTopic = `/topic/user/${userId}/friends`;
           console.log("FriendStore: Hủy đăng ký topic:", userTopic);
           websocketService.unsubscribe(userTopic);
         }
      }
    }
    // === KẾT THÚC 2 HÀM MỚI BỊ THIẾU ===
  },
});