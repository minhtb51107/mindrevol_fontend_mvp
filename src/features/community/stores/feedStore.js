// File: src/features/community/stores/feedStore.js
import { defineStore } from 'pinia';
import feedService from '@/features/community/services/feedService';
import websocketService from '@/services/websocketService';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const useFeedStore = defineStore('feed', {
  state: () => ({
    feedItems: [], // Đây là "Feed Tri Kỷ"
    isLoading: false,
    error: null,
    currentPage: 0,
    isLastPage: false,
    
    // *** BẮT ĐẦU PHẦN MỚI (PHẦN 4.B) ***
    museumItems: [], // Feed cho "Bảo tàng"
    isMuseumLoading: false,
    museumError: null,
    museumCurrentPage: 0,
    isMuseumLastPage: false,
    // *** KẾT THÚC PHẦN MỚI (PHẦN 4.B) ***
  }),
  
  actions: {
    /**
     * Tải "Feed Tri Kỷ" (P4.A)
     */
    async fetchFeed(loadMore = false) {
      if (this.isLoading || (loadMore && this.isLastPage)) return;

      this.isLoading = true;
      if (!loadMore) {
        this.currentPage = 0;
        this.feedItems = [];
        this.isLastPage = false;
      }
      
      try {
        const response = await feedService.getFriendFeed(this.currentPage, 10);
        const data = response.data;
        
        if (data.content && data.content.length > 0) {
          this.feedItems = loadMore ? [...this.feedItems, ...data.content] : data.content;
          this.currentPage++;
        }
        
        this.isLastPage = data.last || data.content.length === 0;
        this.error = null;
        
        this.subscribeToFeedUpdates(); // Vẫn gọi hàm này

      } catch (error) {
        console.error("Lỗi tải Friend Feed:", error);
        this.error = error.response?.data?.message || "Không thể tải hoạt động.";
      } finally {
        this.isLoading = false;
      }
    },

    clearFeed() {
      this.feedItems = [];
      this.currentPage = 0;
      this.isLastPage = false;
      this.error = null;
      this.unsubscribeFromFeedUpdates();
    },

    // --- CÁC HÀM WEBSOCKET (Giữ nguyên) ---
    // (Dựa trên file FeedServiceImpl.java của bạn)
    subscribeToFeedUpdates() {
      if (!websocketService.isConnected()) {
        console.warn("WebSocket chưa kết nối.");
        return;
      }
      
      // Lấy ID user từ authStore (cần thiết cho topic cá nhân)
      // Tạm thời dùng một cách gián tiếp
      const authStore = useAuthStore(); // Import (hoặc lấy từ pinia)
      const userId = authStore.currentUser?.id;

      if (userId) {
        const userTopic = `/topic/user/${userId}/feed`;
        console.log("Đăng ký topic:", userTopic);
        websocketService.subscribe(userTopic, (feedEvent) => {
          console.log("Nhận được feed event:", feedEvent);
          // Reload lại feed
          this.fetchFeed(false); 
        });
      } else {
        console.warn("Không tìm thấy User ID để đăng ký WebSocket feed.");
      }
    },

    unsubscribeFromFeedUpdates() {
      if (websocketService.isConnected()) {
         const authStore = useAuthStore();
         const userId = authStore.currentUser?.id;
         if (userId) {
           const userTopic = `/topic/user/${userId}/feed`;
           websocketService.unsubscribe(userTopic);
         }
      }
    },

    // *** BẮT ĐẦU PHẦN MỚI (PHẦN 4.B) ***
    /**
     * Tải "Bảo tàng" (Feed cá nhân)
     */
    async fetchMuseumFeed(userId, loadMore = false) {
      if (this.isMuseumLoading || (loadMore && this.isMuseumLastPage)) return;

      this.isMuseumLoading = true;
      if (!loadMore) {
        this.museumCurrentPage = 0;
        this.museumItems = [];
        this.isMuseumLastPage = false;
      }
      
      try {
        const response = await feedService.getUserFeed(userId, this.museumCurrentPage, 10);
        const data = response.data;
        
        if (data.content && data.content.length > 0) {
          this.museumItems = loadMore ? [...this.museumItems, ...data.content] : data.content;
          this.museumCurrentPage++;
        }
        
        this.isMuseumLastPage = data.last || data.content.length === 0;
        this.museumError = null;

      } catch (error) {
        console.error("Lỗi tải Museum Feed:", error);
        this.museumError = error.response?.data?.message || "Không thể tải hoạt động.";
      } finally {
        this.isMuseumLoading = false;
      }
    },

    clearMuseumFeed() {
      this.museumItems = [];
      this.museumCurrentPage = 0;
      this.isMuseumLastPage = false;
      this.museumError = null;
    },
    // *** KẾT THÚC PHẦN MỚI (PHẦN 4.B) ***
  }
});