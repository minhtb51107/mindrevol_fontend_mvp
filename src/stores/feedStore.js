// File: src/stores/feedStore.js
import { defineStore } from 'pinia';
import feedService from '@/api/feedService';
import websocketService from '@/api/websocketService';
import { useAuthStore } from './auth';
import { formatTimeAgo } from '@/utils/formatters';

// *** ĐÃ CẬP NHẬT HÀM NÀY ***
// Hàm xử lý dữ liệu API/WebSocket thành định dạng hiển thị
const processFeedItem = (item) => {
  if (!item) return null;

  let message = '';
  let icon = 'mdi-information-outline';
  let avatarColor = 'grey-lighten-3';
  let iconColor = 'grey-darken-1';

  // --- SỬ DỤNG item.actorFullName THAY VÌ item.userFullName ---
  const actorName = item.actorFullName || 'Ai đó'; // Lấy tên actor, fallback về "Ai đó"

  switch (item.eventType) {
    case 'CHECK_IN':
      message = `<strong>${actorName}</strong> vừa check-in kế hoạch "${item.planTitle || 'N/A'}"`;
      icon = 'mdi-check';
      avatarColor = 'success-lighten-4';
      iconColor = 'success-darken-1';
      break;
    case 'STREAK_ACHIEVED':
      message = `<strong>${actorName}</strong> đạt chuỗi <strong>${item.details?.streakDays || '?'} ngày</strong>! 🔥`;
      icon = 'mdi-fire';
      avatarColor = 'orange-lighten-4';
      iconColor = 'orange-darken-2';
      break;
    case 'JOIN_PLAN':
      message = `<strong>${actorName}</strong> đã tham gia kế hoạch "${item.planTitle || 'N/A'}"`;
      icon = 'mdi-account-plus-outline';
      avatarColor = 'blue-lighten-4';
      iconColor = 'info';
      break;
    case 'PLAN_COMPLETE':
      // Sự kiện này có thể không có actor, giữ nguyên logic cũ
      message = `Chúc mừng nhóm đã hoàn thành kế hoạch "${item.planTitle || 'N/A'}"! 🎉`;
      icon = 'mdi-party-popper';
      avatarColor = 'purple-lighten-4';
      iconColor = 'purple';
      break;
    case 'COMMENT_ADDED': // Thêm case này nếu bạn muốn hiển thị comment feed
       message = `<strong>${actorName}</strong> đã bình luận về tiến độ ngày ${item.details?.progressDate || 'N/A'} của kế hoạch "${item.planTitle || 'N/A'}"`;
       icon = 'mdi-comment-text-outline';
       avatarColor = 'teal-lighten-4';
       iconColor = 'teal';
       break;
    case 'REACTION_ADDED': // Thêm case này nếu bạn muốn hiển thị reaction feed
        let reactionEmoji = '';
        switch(item.details?.reactionType) {
            case 'THUMBS_UP': reactionEmoji = '👍'; break;
            case 'HEART': reactionEmoji = '❤️'; break;
            case 'CELEBRATE': reactionEmoji = '🎉'; break;
            case 'ROCKET': reactionEmoji = '🚀'; break;
        }
        message = `<strong>${actorName}</strong> đã thả ${reactionEmoji} cho tiến độ ngày ${item.details?.progressDate || 'N/A'} của kế hoạch "${item.planTitle || 'N/A'}"`;
        icon = 'mdi-thumb-up-outline'; // Hoặc icon khác tùy reaction
        avatarColor = 'pink-lighten-4';
        iconColor = 'pink';
        break;
     case 'TASK_COMMENT_ADDED': // Thêm case này nếu có
        message = `<strong>${actorName}</strong> đã bình luận về công việc "${item.details?.taskDescriptionShort || '...'}" trong kế hoạch "${item.planTitle || 'N/A'}"`;
        icon = 'mdi-comment-processing-outline';
        avatarColor = 'cyan-lighten-4';
        iconColor = 'cyan';
        break;
    default:
      message = `Hoạt động mới: ${item.eventType || 'Không xác định'}`;
  }

  // Trả về item đã xử lý, bao gồm cả actorFullName để dùng sau này nếu cần
  return { ...item, message, icon, avatarColor, iconColor, timestamp: item.timestamp, actorFullName: item.actorFullName };
};


export const useFeedStore = defineStore('feed', {
  state: () => ({
    feedItems: [],
    currentPage: 0,
    totalPages: 0,
    isLoading: false,
    error: null,
    isSubscribed: false,
    webSocketTopic: null,
  }),

  actions: {
    async fetchFeed(loadMore = false) {
      if (this.isLoading && !loadMore) return;
      this.isLoading = true;
      this.error = null;

      const pageToFetch = loadMore ? this.currentPage : 0;

      try {
        const response = await feedService.getFeed(pageToFetch);
        const data = response.data;
        const newItems = data.content.map(processFeedItem).filter(item => item !== null);

        if (loadMore) {
          const existingIds = new Set(this.feedItems.map(i => i.id));
          const trulyNewItems = newItems.filter(item => !existingIds.has(item.id));
          this.feedItems.push(...trulyNewItems);
        } else {
          this.feedItems = newItems;
        }

        this.currentPage = data.number + 1;
        this.totalPages = data.totalPages;

        this.subscribeToFeedUpdates();

      } catch (err) {
        console.error("Lỗi khi tải feed:", err);
        this.error = "Không thể tải hoạt động nhóm.";
        if (!loadMore) this.feedItems = [];
      } finally {
        this.isLoading = false;
      }
    },

    handleFeedUpdate(feedEventDto) {
      console.log("WebSocket Feed Update Received:", feedEventDto);
      const newItem = processFeedItem(feedEventDto);
      if (newItem) {
        const exists = this.feedItems.some(item => item.id === newItem.id);
        if (!exists) {
          this.feedItems.unshift(newItem);
          if (this.feedItems.length > 50) {
            this.feedItems.pop();
          }
        }
      }
    },

    subscribeToFeedUpdates() {
      const authStore = useAuthStore();
      const userId = authStore.currentUser?.id;

      if (!userId || this.isSubscribed || !websocketService.isConnected()) {
          // ... (log messages giữ nguyên) ...
          return;
      }

      this.webSocketTopic = `/topic/user/${userId}/feed`;

      console.log(`Feed WS: Subscribing to ${this.webSocketTopic}`);
      websocketService.subscribe(this.webSocketTopic, this.handleFeedUpdate)
        .then(() => {
          this.isSubscribed = true;
          console.log(`Feed WS: Subscribed successfully to ${this.webSocketTopic}`);
        })
        .catch(err => {
          console.error(`Feed WS: Failed to subscribe to ${this.webSocketTopic}`, err);
          this.webSocketTopic = null;
        });
    },

    unsubscribeFromFeedUpdates() {
      if (this.isSubscribed && this.webSocketTopic) {
        console.log(`Feed WS: Unsubscribing from ${this.webSocketTopic}`);
        websocketService.unsubscribe(this.webSocketTopic);
        this.isSubscribed = false;
        this.webSocketTopic = null;
      }
    },

    clearFeed() {
        this.unsubscribeFromFeedUpdates();
        this.feedItems = [];
        this.currentPage = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.error = null;
    }
  },
});