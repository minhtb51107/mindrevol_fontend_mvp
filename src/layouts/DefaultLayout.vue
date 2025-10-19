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
          >
            <template v-slot:activator="{ props }">
               <v-btn icon v-bind="props" class="me-2">
                 <v-badge :content="notificationStore.unreadCount" color="error" :model-value="notificationStore.hasUnread">
                    <v-icon icon="mdi-bell-outline"></v-icon>
                  </v-badge>
               </v-btn>
            </template>

            <v-card max-width="400" min-width="350">
               <v-list-subheader class="d-flex justify-space-between align-center">
                   <span>Thông báo</span>
                   <v-btn
                      v-if="notificationStore.unreadCount > 0"
                      variant="text"
                      size="small"
                      color="primary"
                      @click="markAllRead"
                      :loading="notificationStore.isLoading"
                    >
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
                       @click="handleNotificationClick(notification)"
                       link
                       :class="{ 'unread-notification': !notification.read }"
                       class="py-3"
                     >
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
                <v-avatar color="primary" size="small">
                  <span class="white--text text-subtitle-2">{{ userInitial }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-subheader>Chào, {{ userFullName }}</v-list-subheader>
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  VApp, VAppBar, VAppBarTitle, VContainer, VSpacer, VBtn, VMenu, VList, VListItem, VListItemTitle, VListItemSubtitle, VDivider, VAvatar, VIcon, VMain, VListSubheader, VBadge, VCard, VProgressCircular, VAlert
} from 'vuetify/components';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const notificationMenu = ref(false);
let refreshInterval = null;

const userFullName = computed(() => authStore.currentUser?.fullname || 'bạn');
const userInitial = computed(() => authStore.currentUser?.fullname ? authStore.currentUser.fullname.charAt(0).toUpperCase() : '?');
const canLoadMore = computed(() => notificationStore.currentPage < notificationStore.totalPages);

const handleLogout = () => {
  notificationStore.clearNotifications();
  authStore.logout();
};

const handleNotificationClick = (notification) => {
    notificationStore.markNotificationRead(notification);
    notificationMenu.value = false;
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
  // Thêm các từ khóa và icon tương ứng khác ở đây
  return 'mdi-bell-outline';
};

const formatTimeAgo = (isoDateTime) => {
    if (!isoDateTime) return '';
    try {
        const date = new Date(isoDateTime);
        const seconds = Math.floor((new Date() - date) / 1000);
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
        return Math.floor(seconds) < 10 ? "Vừa xong" : Math.floor(seconds) + " giây trước";
    } catch (e) {
        return '';
    }
};

const markAllRead = () => {
   notificationStore.markAllNotificationsRead(); // Gọi action trong store
   // Giữ menu mở để người dùng thấy trạng thái cập nhật
   // notificationMenu.value = false;
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    notificationStore.fetchNotifications();
    refreshInterval = setInterval(() => {
        if(authStore.isAuthenticated) {
            notificationStore.fetchNotifications();
        }
    }, 60000);
  }
});

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
        notificationStore.fetchNotifications();
         if (!refreshInterval) {
             refreshInterval = setInterval(() => {
                if(authStore.isAuthenticated) {
                    notificationStore.fetchNotifications();
                }
            }, 60000);
         }
    } else {
        notificationStore.clearNotifications();
         if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
         }
    }
});
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
}
.text-wrap {
    white-space: normal;
}
</style>