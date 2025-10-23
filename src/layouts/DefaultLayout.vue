<template>
  <v-app>
    <v-app-bar app color="white" elevation="1">
      <v-container class="d-flex align-center py-0">
        <v-app-bar-title>
          <RouterLink to="/" class="text-decoration-none text-grey-darken-3 d-flex align-center">
            <v-icon icon="mdi-robot-happy-outline" class="me-2"></v-icon>
            <span style="font-weight: bold;">MindRevol</span>
          </RouterLink>
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <v-btn text to="/" exact class="me-1">Dashboard</v-btn>
        <div v-if="authStore.isAuthenticated">
          <v-menu
            v-model="notificationMenu"
            :close-on-content-click="false"
            location="bottom end"
            transition="slide-y-transition"
            min-width="350px"
            max-width="400px"
          >
            <template v-slot:activator="{ props }">
               <v-btn icon v-bind="props" class="me-2">
                 <v-badge :content="notificationStore.unreadCount" color="error" :model-value="notificationStore.hasUnread" dot>
                    <v-icon icon="mdi-bell-outline"></v-icon>
                  </v-badge>
               </v-btn>
            </template>

            <v-card>
               <v-list-subheader class="d-flex justify-space-between align-center">
                   <span>Thông báo</span>
                   <v-btn
                      v-if="notificationStore.unreadCount > 0"
                      variant="text" size="small" color="primary" @click="markAllRead" :loading="notificationStore.isLoading">
                     Đánh dấu đã đọc
                   </v-btn>
                </v-list-subheader>
               <v-divider></v-divider>

               <v-list lines="two" density="compact" class="notification-list py-0">
                 <div v-if="notificationStore.isLoading && !notificationStore.notifications.length" class="text-center py-5">
                     <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                 </div>
                 <v-alert v-else-if="notificationStore.error" type="warning" variant="tonal" density="compact" class="ma-2">
                     {{ notificationStore.error }}
                 </v-alert>
                 <div v-else-if="!notificationStore.notifications.length" class="text-center text-caption text-medium-emphasis py-5 px-3">
                     Bạn chưa có thông báo nào.
                 </div>

                 <template v-else>
                   <div v-for="(notification, index) in notificationStore.notifications" :key="notification.id">
                     <v-list-item
                       @click="handleNotificationClick(notification)" link :class="{ 'unread-notification': !notification.read }" class="py-3">
                       <template v-slot:prepend>
                          <v-icon :icon="notificationIcon(notification)" :color="notification.read ? 'grey' : 'primary'" class="mt-1"></v-icon>
                       </template>
                       <v-list-item-title class="text-body-2 text-wrap">{{ notification.message }}</v-list-item-title>
                       <v-list-item-subtitle class="text-caption">
                          {{ formatTimeAgo(notification.createdAt) }}
                       </v-list-item-subtitle>
                       <template v-slot:append v-if="!notification.read">
                         <v-icon icon="mdi-circle-medium" color="primary" size="x-small"></v-icon>
                       </template>
                     </v-list-item>
                     <v-divider v-if="index < notificationStore.notifications.length - 1"></v-divider>
                   </div>

                   <v-list-item v-if="canLoadMore" class="text-center">
                      <v-btn variant="text" color="primary" @click="loadMoreNotifications" :loading="notificationStore.isLoading">
                        Xem thêm
                      </v-btn>
                   </v-list-item>
                 </template>
               </v-list>
            </v-card>
          </v-menu>

          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-avatar :image="authStore.userAvatarUrl" color="primary" size="small">
                   <template v-slot:error>
                     <span class="white--text text-subtitle-2">{{ authStore.userInitial }}</span>
                   </template>
                  <span v-if="!authStore.userAvatarUrl" class="white--text text-subtitle-2">{{ authStore.userInitial }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-subheader>Chào, {{ authStore.userFullName }}</v-list-subheader>
              <v-list-item link to="/profile">
                <template v-slot:prepend>
                  <v-icon icon="mdi-account-circle-outline"></v-icon>
                </template>
                <v-list-item-title>Trang cá nhân</v-list-item-title>
              </v-list-item>
              <v-list-item link to="/change-password">
                 <template v-slot:prepend>
                  <v-icon icon="mdi-lock-reset"></v-icon>
                </template>
                <v-list-item-title>Đổi mật khẩu</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="handleLogout" link>
                <template v-slot:prepend>
                  <v-icon icon="mdi-logout"></v-icon>
                </template>
                <v-list-item-title>Đăng xuất</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div v-else>
           <v-btn text to="/login" class="me-1">Đăng nhập</v-btn>
           <v-btn color="primary" variant="flat" to="/register">Đăng ký</v-btn>
        </div>

      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container>
        <RouterView />
      </v-container>
    </v-main>

  </v-app>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'; // watch đã có sẵn
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notificationStore';
import websocketService from '@/api/websocketService'; // *** THÊM IMPORT websocketService ***
import {
  VApp, VAppBar, VAppBarTitle, VContainer, VSpacer, VBtn, VMenu, VList, VListItem, VListItemTitle, VListItemSubtitle, VDivider, VAvatar, VIcon, VMain, VListSubheader, VBadge, VCard, VProgressCircular, VAlert
} from 'vuetify/components';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const notificationMenu = ref(false);
let refreshInterval = null;

const canLoadMore = computed(() => notificationStore.currentPage < notificationStore.totalPages);

const handleLogout = async () => {
  await authStore.logout();
};

const handleNotificationClick = (notification) => {
    notificationStore.markNotificationRead(notification);
    notificationMenu.value = false;
};

const loadMoreNotifications = () => {
    notificationStore.fetchNotifications(true);
};

const notificationIcon = (notification) => {
  // ... (giữ nguyên logic)
  const message = notification.message?.toLowerCase() || '';
  if (message.includes('bình luận')) return 'mdi-comment-text-outline';
  if (message.includes('cảm xúc') || message.includes('reaction')) return 'mdi-heart-outline';
  if (message.includes('tham gia')) return 'mdi-account-plus-outline';
  if (message.includes('hoàn thành')) return 'mdi-check-circle-outline';
  if (message.includes('chúc mừng')) return 'mdi-party-popper';
  if (message.includes('mời')) return 'mdi-email-arrow-right-outline';
  if (message.includes('nhắc nhở') || message.includes('đừng quên')) return 'mdi-bell-ring-outline';
  if (message.includes('động viên')) return 'mdi-human-greeting-variant';
  return 'mdi-bell-outline';
};

const formatTimeAgo = (isoDateTime) => {
    // ... (giữ nguyên logic)
    if (!isoDateTime) return '';
    try {
        const date = new Date(isoDateTime);
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 5) return "Vừa xong";
        if (seconds < 60) return Math.floor(seconds) + " giây trước";

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";

        return "Ít phút trước";

    } catch (e) {
        console.error("Error formatting time ago:", e);
        return '';
    }
};

const markAllRead = () => {
   notificationStore.markAllNotificationsRead();
};

const setupNotificationWatcher = () => {
    // ... (giữ nguyên logic)
     if (authStore.isAuthenticated) {
        console.log("Setting up notification watcher: Authenticated");
        if (!notificationStore.isLoading) {
           notificationStore.fetchNotifications();
        }
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            if(authStore.isAuthenticated && !notificationStore.isLoading) {
                console.log("Interval: Fetching notifications...");
                notificationStore.fetchNotifications();
            } else if (!authStore.isAuthenticated) {
                console.log("Interval: User logged out, clearing interval.");
                 if (refreshInterval) clearInterval(refreshInterval);
                 refreshInterval = null;
            }
        }, 60000);
    } else {
        console.log("Setting up notification watcher: Not Authenticated");
        notificationStore.clearNotifications();
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log("Cleared notification interval.");
        }
    }
};

onMounted(() => {
  console.log("DefaultLayout mounted. Calling loadInitialData...");
  authStore.loadInitialData().then(() => {
      console.log("Initial data loaded. Setting up notification watcher.");
      setupNotificationWatcher();
      // *** THÊM: Kết nối WebSocket nếu đã đăng nhập ***
      if (authStore.isAuthenticated) {
        websocketService.connect();
      }
      // *** KẾT THÚC THÊM ***
  }).catch(err => {
      console.error("Error during initial data load:", err);
      setupNotificationWatcher(); // Vẫn setup notification
      // *** THÊM: Vẫn thử kết nối WebSocket nếu có token (dù profile lỗi) ***
      if (authStore.isAuthenticated) {
         websocketService.connect();
      }
      // *** KẾT THÚC THÊM ***
  });
});

onUnmounted(() => {
    console.log("DefaultLayout unmounted. Clearing notification interval and disconnecting WebSocket.");
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    // *** THÊM: Ngắt kết nối WebSocket ***
    websocketService.disconnect();
    // *** KẾT THÚC THÊM ***
});

// *** THÊM WATCHER CHO isAuthenticatd ĐỂ KẾT NỐI/NGẮT KẾT NỐI WEBSOCKET ***
watch(() => authStore.isAuthenticated, (isAuth, wasAuth) => {
    console.log(`Layout Authentication status changed: ${wasAuth} -> ${isAuth}`);
    // Quản lý notification watcher (giữ nguyên)
    if (isAuth !== wasAuth) {
       setupNotificationWatcher();
    }
    // Quản lý WebSocket connection
    if (isAuth && !websocketService.isConnected()) {
        console.log("User authenticated, connecting WebSocket...");
        websocketService.connect();
    } else if (!isAuth && websocketService.isConnected()) {
        console.log("User logged out, disconnecting WebSocket...");
        websocketService.disconnect();
    }
});
// *** KẾT THÚC THÊM WATCHER ***

</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
}
.v-btn {
  text-transform: none;
}
.v-app-bar-title {
  flex: none;
  margin-right: 16px;
}
.notification-list {
    max-height: 400px;
    overflow-y: auto;
}
.unread-notification {
    background-color: rgba(var(--v-theme-primary), 0.05);
    font-weight: 500;
}
.text-wrap {
    white-space: normal;
}
/* Ensure badge aligns nicely */
.v-badge :deep(.v-badge__badge) {
    /* Adjust position if needed */
}
</style>