<template>
  <v-app :style="{ background: theme.current.value.colors.background }">
    <v-app-bar app color="surface" elevation="0" border="b" height="64">
      <v-container class="d-flex align-center py-0" fluid>
        <v-app-bar-title class="me-4">
          <RouterLink to="/" class="text-decoration-none d-flex align-center text-on-surface">
            <v-icon icon="mdi-robot-happy-outline" class="me-2" color="primary"></v-icon>
            <span class="font-weight-bold text-h6">MindRevol</span>
          </RouterLink>
        </v-app-bar-title>

        <v-btn variant="text" to="/" exact class="me-1 text-on-surface">
          <v-icon start>mdi-view-dashboard-outline</v-icon> Dashboard
        </v-btn>

        <v-spacer></v-spacer>

        <v-btn
          icon
          @click="toggleTheme"
          class="me-2"
        >
          <v-icon>{{ isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
        </v-btn>

        <div v-if="authStore.isAuthenticated" class="d-flex align-center">
          <v-menu
            v-model="notificationMenu"
            :close-on-content-click="false"
            location="bottom end"
            transition="slide-y-transition"
            min-width="350px"
            max-width="400px"
            content-class="elevation-1 rounded-lg"
          >
            <template v-slot:activator="{ props }">
               <v-btn icon v-bind="props" class="me-1">
                 <v-badge :content="notificationStore.unreadCount" color="error" :model-value="notificationStore.hasUnread" dot offset-x="1" offset-y="1">
                    <v-icon icon="mdi-bell-outline"></v-icon>
                  </v-badge>
               </v-btn>
            </template>
            <v-card rounded="lg">
               <v-list-subheader class="d-flex justify-space-between align-center">
                   <span>Thông báo</span>
                   <v-btn
                      v-if="notificationStore.unreadCount > 0"
                      variant="text" size="small" color="primary" @click="markAllRead" :loading="notificationStore.isLoading">
                     Đánh dấu đã đọc
                   </v-btn>
                </v-list-subheader>
               <v-divider></v-divider>
               <v-list lines="two" density="compact" class="notification-list py-0" nav>
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
                          <v-icon :icon="notificationIcon(notification)" :color="notification.read ? 'grey' : 'primary'" size="small" class="mt-1 me-3"></v-icon>
                       </template>
                       <v-list-item-title class="text-body-2 text-wrap mb-1">{{ notification.message }}</v-list-item-title>
                       <div class="text-caption text-medium-emphasis">
                          {{ formatTimeAgo(notification.createdAt) }}
                       </div>
                       <template v-slot:append v-if="!notification.read">
                         <v-icon icon="mdi-circle-medium" color="primary" size="x-small"></v-icon>
                       </template>
                     </v-list-item>
                     <v-divider v-if="index < notificationStore.notifications.length - 1"></v-divider>
                   </div>

                   <v-list-item v-if="canLoadMore" class="text-center mt-2">
                      <v-btn variant="text" color="primary" @click="loadMoreNotifications" :loading="notificationStore.isLoading" size="small">
                        Xem thêm
                      </v-btn>
                   </v-list-item>
                 </template>
               </v-list>
            </v-card>
          </v-menu>

          <v-menu offset-y location="bottom end" transition="slide-y-transition" content-class="elevation-1 rounded-lg">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-avatar :image="authStore.userAvatarUrl" color="primary" size="36">
                   <template v-slot:error>
                     <span class="white--text text-subtitle-1">{{ authStore.userInitial }}</span>
                   </template>
                  <span v-if="!authStore.userAvatarUrl" class="white--text text-subtitle-1">{{ authStore.userInitial }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-list density="compact" nav>
              <v-list-subheader>Chào, {{ authStore.userFullName }}</v-list-subheader>
              <v-list-item @click="openProfileModal" link rounded="lg" class="mb-1 menu-item-custom">
                <template v-slot:prepend>
                  <v-icon icon="mdi-account-circle-outline"></v-icon>
                </template>
                <v-list-item-title>Thông tin cá nhân</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openChangePasswordModal" link rounded="lg" class="menu-item-custom">
                 <template v-slot:prepend>
                  <v-icon icon="mdi-lock-reset"></v-icon>
                </template>
                <v-list-item-title>Đổi mật khẩu</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1"></v-divider>
              <v-list-item @click="handleLogout" link rounded="lg" base-color="error">
                <template v-slot:prepend>
                  <v-icon icon="mdi-logout"></v-icon>
                </template>
                <v-list-item-title>Đăng xuất</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div v-else>
           <v-btn variant="text" to="/login" class="me-1">Đăng nhập</v-btn>
           <v-btn color="primary" variant="flat" to="/register" rounded="lg">Đăng ký</v-btn>
        </div>

      </v-container>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>

    <ProfileModal v-model="isProfileModalOpen" />
    <ChangePasswordModal v-model="isChangePasswordModalOpen" />

  </v-app>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notificationStore';
import websocketService from '@/api/websocketService';
import { useTheme } from 'vuetify';
import ProfileModal from '@/components/ProfileModal.vue';
import ChangePasswordModal from '@/components/ChangePasswordModal.vue';
import { formatTimeAgo } from '@/utils/formatters';

import {
  VApp, VAppBar, VAppBarTitle, VContainer, VSpacer, VBtn, VMenu, VList, VListItem, VListItemTitle, VListItemSubtitle, VDivider, VAvatar, VIcon, VMain, VListSubheader, VBadge, VCard, VProgressCircular, VAlert
} from 'vuetify/components';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const theme = useTheme();

const notificationMenu = ref(false);
let refreshInterval = null;

const isProfileModalOpen = ref(false);
const isChangePasswordModalOpen = ref(false);

const isDarkMode = computed(() => theme.global.current.value.dark);

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'myCustomLightTheme' : 'myCustomDarkTheme';
  localStorage.setItem('theme', theme.global.name.value);
};

const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        theme.global.name.value = savedTheme;
    }
};

const canLoadMore = computed(() => notificationStore.currentPage < notificationStore.totalPages);

const openProfileModal = () => {
  isProfileModalOpen.value = true;
};

const openChangePasswordModal = () => {
  isChangePasswordModalOpen.value = true;
};

const handleLogout = async () => {
  await authStore.logout();
};

const handleNotificationClick = (notification) => {
    notificationStore.markNotificationRead(notification);
};

const loadMoreNotifications = () => {
    notificationStore.fetchNotifications(true);
};

const notificationIcon = (notification) => {
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

const markAllRead = () => {
   notificationStore.markAllNotificationsRead();
};

const setupNotificationWatcher = () => {
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
  loadTheme();
  console.log("DefaultLayout mounted. Calling loadInitialData...");
  authStore.loadInitialData().then(() => {
      console.log("Initial data loaded. Setting up notification watcher.");
      setupNotificationWatcher();
      if (authStore.isAuthenticated) {
        websocketService.connect();
      }
  }).catch(err => {
      console.error("Error during initial data load:", err);
      setupNotificationWatcher();
      if (authStore.isAuthenticated) {
         websocketService.connect();
      }
  });
});

onUnmounted(() => {
    console.log("DefaultLayout unmounted. Clearing notification interval and disconnecting WebSocket.");
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    websocketService.disconnect();
});

watch(() => authStore.isAuthenticated, (isAuth, wasAuth) => {
    console.log(`Layout Authentication status changed: ${wasAuth} -> ${isAuth}`);
    if (isAuth !== wasAuth) {
       setupNotificationWatcher();
    }
    if (isAuth && !websocketService.isConnected()) {
        console.log("User authenticated, connecting WebSocket...");
        websocketService.connect();
    } else if (!isAuth && websocketService.isConnected()) {
        console.log("User logged out, disconnecting WebSocket...");
        websocketService.disconnect();
    }
});

</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
  color: inherit;
}

.v-app-bar-title {
  flex: none;
}

.notification-list {
    max-height: 400px;
    overflow-y: auto;
}
.unread-notification {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
.unread-notification:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}
.text-wrap {
    white-space: normal;
}
.v-list-item--link:hover {
    background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.v-badge :deep(.v-badge__badge) {
}
</style>