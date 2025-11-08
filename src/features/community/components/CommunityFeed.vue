<template>
  <v-card variant="outlined" rounded="xl" class="community-feed-card">
    <v-card-item>
      <v-card-title class="text-h6 font-weight-medium d-flex align-center">
        Hoạt động nhóm
        <v-progress-circular v-if="feedStore.isLoading" indeterminate color="primary" size="20" width="2" class="ms-2"></v-progress-circular>
      </v-card-title>
    </v-card-item>

    <v-alert v-if="feedStore.error" type="warning" variant="tonal" density="compact" class="mx-4 mb-2" rounded="lg">
      {{ feedStore.error }}
    </v-alert>

    <v-list density="compact" class="py-0 feed-list">
      <template v-if="!feedStore.isLoading && feedStore.feedItems.length > 0">
        <div v-for="(item, index) in feedStore.feedItems" :key="item.id || index">
          <v-list-item class="feed-item">
            <template v-slot:prepend>
              <v-avatar size="32" :color="item.avatarColor || 'grey-lighten-3'" class="me-3">
                <v-icon size="small" :color="item.iconColor">{{ item.icon }}</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2" v-html="item.message"></v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ formatTimeAgo(item.timestamp) }}</v-list-item-subtitle>
             </v-list-item>
          <v-divider v-if="index < feedStore.feedItems.length - 1" :key="'divider-' + index" inset></v-divider>
        </div>
      </template>

      <v-list-item v-else-if="!feedStore.isLoading && !feedStore.error" class="text-center text-medium-emphasis text-caption py-4">
        Chưa có hoạt động nào gần đây.
      </v-list-item>
       <template v-if="feedStore.isLoading && feedStore.feedItems.length === 0">
          <v-skeleton-loader v-for="i in 3" :key="`skel-${i}`" type="list-item-avatar-two-line" class="mx-2"></v-skeleton-loader>
       </template>
    </v-list>

    </v-card>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

// [CẬP NHẬT] Store nội bộ feature
import { useFeedStore } from '@/features/community/stores/feedStore';

// [CẬP NHẬT] Utils
import { formatTimeAgo } from '@/utils/formatters';

// Imports Vuetify components (giữ nguyên)
import { VCard, VCardItem, VCardTitle, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar, VIcon, VDivider, VProgressCircular, VAlert, VSkeletonLoader } from 'vuetify/components';

const feedStore = useFeedStore(); // Sử dụng feed store

const fetchFeedInitial = () => {
  // Chỉ fetch trang đầu nếu chưa có dữ liệu hoặc đã có lỗi trước đó
  if (feedStore.feedItems.length === 0 || feedStore.error) {
    feedStore.fetchFeed(false); // Fetch trang đầu (loadMore = false)
  } else {
      // Nếu đã có dữ liệu, có thể chỉ cần đăng ký WebSocket
      feedStore.subscribeToFeedUpdates();
  }
};

const loadMoreFeed = () => {
    feedStore.fetchFeed(true); // Fetch trang tiếp theo
}

onMounted(() => {
  fetchFeedInitial();
  // Không cần gọi subscribe ở đây nữa vì fetchFeed sẽ tự gọi
});

onUnmounted(() => {
    // Hủy đăng ký WebSocket khi component bị hủy (quan trọng!)
    feedStore.unsubscribeFromFeedUpdates();
});

</script>

<style scoped>
.community-feed-card {
  max-height: 250px; /* Giới hạn chiều cao */
  display: flex;
  flex-direction: column;
}
.feed-list {
    flex-grow: 1; /* Cho phép list co giãn */
    overflow-y: auto; /* Thêm thanh cuộn */
    background-color: transparent;
}
.v-list-item { padding-left: 16px; padding-right: 16px; min-height: 68px; }
.v-list-item-subtitle { font-size: 0.75rem; margin-top: 2px; }
.v-divider--inset { margin-left: 64px; }

.feed-item:hover {
   background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

:deep(strong) {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}
</style>