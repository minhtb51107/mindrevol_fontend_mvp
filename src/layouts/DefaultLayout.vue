<template
  ><v-app :style="{ background: theme.current.value.colors.background }"
    ><v-navigation-drawer app permanent width="280">
      <template v-slot:append>
        <v-divider></v-divider>
        <div
          class="pa-2 d-flex justify-space-around align-center bottom-icon-bar"
        >
          <v-menu
            v-if="authStore.isAuthenticated"
            v-model="notificationMenu"
            :close-on-content-click="false"
            location="top end"
            transition="slide-y-transition"
            min-width="350px"
            max-width="400px"
            content-class="elevation-1 rounded-lg mb-1"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                density="comfortable"
              >
                <v-badge
                  dot
                  color="error"
                  :model-value="notificationStore.hasUnread"
                >
                  <v-icon>mdi-bell-outline</v-icon>
                </v-badge>
              </v-btn>
            </template>
            <v-card rounded="lg">
              <v-list-subheader
                class="d-flex justify-space-between align-center"
              >
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
              <v-list
                lines="two"
                density="compact"
                class="notification-list py-0"
                nav
              >
                <div
                  v-if="
                    notificationStore.isLoading &&
                    !notificationStore.notifications.length
                  "
                  class="text-center py-5"
                >
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="32"
                  ></v-progress-circular>
                </div>
                <v-alert
                  v-else-if="notificationStore.error"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="ma-2"
                >
                  {{ notificationStore.error }}
                </v-alert>
                <div
                  v-else-if="!notificationStore.notifications.length"
                  class="text-center text-caption text-medium-emphasis py-5 px-3"
                >
                  Bạn chưa có thông báo nào.
                </div>
                <template v-else>
                  <div
                    v-for="(notification, index) in notificationStore.notifications"
                    :key="notification.id"
                  >
                    <v-list-item
                      @click="handleNotificationClick(notification)"
                      link
                      :class="{ 'unread-notification': !notification.read }"
                      class="py-3"
                    >
                      <template v-slot:prepend>
                        <v-icon
                          :icon="notificationIcon(notification)"
                          :color="notification.read ? 'grey' : 'primary'"
                          size="small"
                          class="mt-1 me-3"
                        ></v-icon>
                      </template>
                      <v-list-item-title class="text-body-2 text-wrap mb-1">{{
                        notification.message
                      }}</v-list-item-title>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatTimeAgo(notification.createdAt) }}
                      </div>
                      <template v-slot:append v-if="!notification.read">
                        <v-icon
                          icon="mdi-circle-medium"
                          color="primary"
                          size="x-small"
                        ></v-icon>
                      </template>
                    </v-list-item>
                    <v-divider
                      v-if="index < notificationStore.notifications.length - 1"
                    ></v-divider>
                  </div>
                  <v-list-item v-if="canLoadMore" class="text-center mt-2">
                    <v-btn
                      variant="text"
                      color="primary"
                      @click="loadMoreNotifications"
                      :loading="notificationStore.isLoading"
                      size="small"
                    >
                      Xem thêm
                    </v-btn>
                  </v-list-item>
                </template>
              </v-list>
            </v-card>
          </v-menu>
          <span v-else></span>

          <v-menu
            v-if="authStore.isAuthenticated"
            location="top end"
            transition="slide-y-transition"
            rounded="lg"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                density="comfortable"
              >
                <v-avatar
                  v-if="authStore.userAvatarUrl"
                  :image="authStore.userAvatarUrl"
                  size="small"
                ></v-avatar>
                <v-avatar v-else color="primary" size="small">
                  <span class="text-caption font-weight-medium">{{
                    authStore.userInitial
                  }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-list density="compact" nav class="pa-1 bg-surface" rounded="lg">
              <v-list-item disabled>
                <v-list-item-title class="font-weight-medium">{{
                  authStore.userFullName || 'User'
                }}</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1"></v-divider>
              <v-list-item
                @click="openProfileModal"
                rounded="md"
                prepend-icon="mdi-account-circle-outline"
                title="Thông tin cá nhân"
              ></v-list-item>
              <v-list-item
                @click="openChangePasswordModal"
                rounded="md"
                prepend-icon="mdi-lock-reset"
                title="Đổi mật khẩu"
              ></v-list-item>
              <v-divider class="my-1"></v-divider>
              <v-list-item
                @click="handleLogout"
                rounded="md"
                prepend-icon="mdi-logout"
                title="Đăng xuất"
                base-color="error"
              ></v-list-item>
            </v-list>
          </v-menu>
          <span v-else></span>

          <v-btn
            @click="toggleTheme"
            icon
            variant="text"
            density="comfortable"
          >
            <v-icon>{{
              isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny'
            }}</v-icon>
          </v-btn>
        </div>
      </template>

      <div class="d-flex flex-column" style="height: 100%">
        <v-list class="flex-shrink-0">
          <v-list-item class="mb-2">
            <RouterLink
              to="/"
              class="text-decoration-none d-flex align-center text-on-surface"
            >
              <v-icon
                icon="mdi-robot-happy-outline"
                class="me-3"
                color="primary"
                size="large"
              ></v-icon>
              <span class="font-weight-bold text-h6">MindRevol</span>
            </RouterLink>
          </v-list-item>
        </v-list>
        <div
          class="px-2 mb-2 flex-shrink-0"
          v-if="authStore.isAuthenticated"
        >
          <v-btn
            block
            color="primary"
            variant="flat"
            :to="{ name: 'create-plan' }"
            prepend-icon="mdi-plus"
            rounded="lg"
            size="small"
          >
            Tạo kế hoạch mới
          </v-btn>
        </div>
        <div class="flex-shrink-0" v-else>
          <v-list nav>
            <v-list-item
              prepend-icon="mdi-login"
              title="Đăng nhập"
              to="/login"
              rounded="lg"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-account-plus-outline"
              title="Đăng ký"
              to="/register"
              rounded="lg"
            ></v-list-item>
          </v-list>
        </div>
        <v-divider class="my-2 flex-shrink-0"></v-divider>
        <v-list nav dense class="flex-shrink-0">
          <v-list-item
            prepend-icon="mdi-view-dashboard-outline"
            title="Dashboard"
            :to="{ name: 'home' }"
            exact
            rounded="lg"
          ></v-list-item>
        </v-list>

        <div class="flex-grow-1" style="overflow-y: auto; min-height: 0">
          <v-list
            nav
            dense
            v-if="authStore.isAuthenticated"
            class="plan-tree-list"
          >
            <v-list-item
              @click="isPlanListExpanded = !isPlanListExpanded"
              link
              density="compact"
              class="list-section-header"
              rounded="lg"
              :class="{ 'bg-section-header': isPlanListExpanded }"
            >
              <template v-slot:prepend>
                <v-icon>mdi-folder-outline</v-icon>
              </template>
              <v-list-item-title
                class="text-caption font-weight-bold text-uppercase"
                >Kế hoạch của bạn</v-list-item-title
              >
              <template v-slot:append>
                <v-icon size="small">{{
                  isPlanListExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                }}</v-icon>
              </template>
            </v-list-item>

            <v-expand-transition>
              <div v-show="isPlanListExpanded" class="plan-list-items">
                <v-list-item
                  v-if="planStore.isUserPlansLoading"
                  density="compact"
                  class="tree-node"
                >
                  <v-progress-linear
                    indeterminate
                    color="primary"
                    height="4"
                    rounded
                  ></v-progress-linear>
                </v-list-item>

                <v-list-item
                  v-for="(plan, index) in planStore.userPlans"
                  :key="plan.id"
                  :to="{
                    name: 'plan-details',
                    params: { shareableLink: plan.shareableLink },
                  }"
                  rounded="lg"
                  density="compact"
                  class="tree-node"
                  :class="{ 'last-node': index === planStore.userPlans.length - 1 }"
                >
                  <template v-slot:prepend>
                    <span class="tree-connector"></span>
                    <v-icon
                      :color="getStatusColor(plan.displayStatus)"
                      size="x-small"
                      class="tree-icon"
                      >mdi-circle-outline</v-icon
                    >
                  </template>
                  <v-list-item-title class="text-body-2">{{
                    plan.title
                  }}</v-list-item-title>
                </v-list-item>

                <v-list-item
                  v-if="
                    !planStore.isUserPlansLoading && !planStore.userPlans.length
                  "
                  density="compact"
                  class="tree-node last-node"
                >
                  <template v-slot:prepend>
                     <span class="tree-connector"></span>
                  </template>
                  <span class="text-caption text-medium-emphasis"
                    >Bạn chưa có kế hoạch nào.</span
                  >
                </v-list-item>
              </div>
            </v-expand-transition>
          </v-list>
          <v-spacer v-if="!authStore.isAuthenticated"></v-spacer>
        </div>
      </div> </v-navigation-drawer
    ><v-main> <RouterView :key="route.fullPath"/> </v-main
    ><ProfileModal v-model="isProfileModalOpen" /><ChangePasswordModal
      v-model="isChangePasswordModalOpen"
  /></v-app>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { useTheme } from 'vuetify';

// [CẬP NHẬT] Stores từ các Feature
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNotificationStore } from '@/features/notification/stores/notificationStore';
import { usePlanStore } from '@/features/plan/stores/planStore';

// [CẬP NHẬT] Core Service
import websocketService from '@/services/websocketService';

// [CẬP NHẬT] Feature Components
import ProfileModal from '@/features/auth/components/ProfileModal.vue';
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal.vue';

// [CẬP NHẬT] Utils (giữ nguyên nếu không di chuyển thư mục utils)
import { formatTimeAgo } from '@/utils/formatters';

import {
  VApp,
  VNavigationDrawer,
  VMain,
  VContainer,
  VSpacer,
  VBtn,
  VMenu,
  VList,
  VListItem,
  VListItemTitle,
  VListItemSubtitle,
  VDivider,
  VAvatar,
  VIcon,
  VListSubheader,
  VBadge,
  VCard,
  VProgressCircular,
  VAlert,
  VProgressLinear,
  VExpandTransition,
} from 'vuetify/components';

const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const planStore = usePlanStore();
const theme = useTheme();

const notificationMenu = ref(false);
let refreshInterval = null;

const isProfileModalOpen = ref(false);
const isChangePasswordModalOpen = ref(false);
const isPlanListExpanded = ref(true);

const isDarkMode = computed(() => theme.global.current.value.dark);
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark
    ? 'myCustomLightTheme'
    : 'myCustomDarkTheme';
  localStorage.setItem('theme', theme.global.name.value);
};
const loadTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.global.name.value = savedTheme;
  }
};
const canLoadMore = computed(
  () => notificationStore.currentPage < notificationStore.totalPages
);
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
  if (message.includes('cảm xúc') || message.includes('reaction'))
    return 'mdi-heart-outline';
  if (message.includes('tham gia')) return 'mdi-account-plus-outline';
  if (message.includes('hoàn thành')) return 'mdi-check-circle-outline';
  if (message.includes('chúc mừng')) return 'mdi-party-popper';
  if (message.includes('mời')) return 'mdi-email-arrow-right-outline';
  if (message.includes('nhắc nhở') || message.includes('đừng quên'))
    return 'mdi-bell-ring-outline';
  if (message.includes('động viên')) return 'mdi-human-greeting-variant';
  return 'mdi-bell-outline';
};
const markAllRead = () => {
  notificationStore.markAllNotificationsRead();
};
const setupNotificationWatcher = () => {
  if (authStore.isAuthenticated) {
    console.log('Setting up notification watcher: Authenticated');
    if (!notificationStore.isLoading) {
      notificationStore.fetchNotifications();
    }
    if (!planStore.userPlans.length && !planStore.isUserPlansLoading) {
      planStore.fetchUserPlans();
    }
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      if (authStore.isAuthenticated && !notificationStore.isLoading) {
        console.log('Interval: Fetching notifications...');
        notificationStore.fetchNotifications();
      } else if (!authStore.isAuthenticated) {
        console.log('Interval: User logged out, clearing interval.');
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }, 60000);
  } else {
    console.log('Setting up notification watcher: Not Authenticated');
    notificationStore.clearNotifications();
    planStore.clearUserPlans();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      console.log('Cleared notification interval.');
    }
  }
};
onMounted(() => {
  loadTheme();
  console.log('DefaultLayout mounted. Calling loadInitialData...');
  authStore
    .loadInitialData()
    .then(() => {
      console.log('Initial data loaded. Setting up notification watcher.');
      setupNotificationWatcher();
      if (authStore.isAuthenticated) {
        websocketService.connect();
      }
    })
    .catch((err) => {
      console.error('Error during initial data load:', err);
      setupNotificationWatcher();
      if (authStore.isAuthenticated) {
        websocketService.connect();
      }
    });
});
onUnmounted(() => {
  console.log(
    'DefaultLayout unmounted. Clearing notification interval and disconnecting WebSocket.'
  );
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  websocketService.disconnect();
});
watch(
  () => authStore.isAuthenticated,
  (isAuth, wasAuth) => {
    console.log(`Layout Authentication status changed: ${wasAuth} -> ${isAuth}`);
    if (isAuth !== wasAuth) {
      setupNotificationWatcher();
    }
    if (isAuth && !websocketService.isConnected()) {
      console.log('User authenticated, connecting WebSocket...');
      websocketService.connect();
    } else if (!isAuth && websocketService.isConnected()) {
      console.log('User logged out, disconnecting WebSocket...');
      websocketService.disconnect();
    }
  }
);
const getStatusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'COMPLETED':
      return 'primary';
    case 'ARCHIVED':
      return 'grey-darken-1';
    default:
      return 'grey';
  }
};
</script>

<style scoped>
/* Các style cũ không liên quan đến cây thư mục giữ nguyên */
.text-decoration-none { text-decoration: none; color: inherit; }
.notification-list { max-height: 400px; overflow-y: auto; }
.unread-notification { background-color: rgba(var(--v-theme-primary), 0.05); }
.unread-notification:hover { background-color: rgba(var(--v-theme-primary), 0.08); }
.text-wrap { white-space: normal; }
.v-list-item--link:hover { background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity)); }
.v-badge :deep(.v-badge__badge) { }
.v-navigation-drawer { border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12); }
.v-list-subheader { font-size: 0.75rem !important; letter-spacing: 0.5px; font-weight: 700 !important; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important; height: auto; min-height: 40px; padding-top: 8px; padding-bottom: 8px; }

/* Style cho header section "Kế hoạch của bạn" */
.list-section-header {
  background-color: rgba(var(--v-theme-primary), 0.08);
     &:hover {
        background-color: rgba(var(--v-theme-on-surface), 0.02);
    }
}
.list-section-header .v-list-item-title { font-size: 0.75rem !important; line-height: 1rem; }
.bg-section-header { background-color: rgba(var(--v-theme-on-surface), 0.04); }

/* === CSS CÂY THƯ MỤC - PHIÊN BẢN ĐƠN GIẢN HÓA === */
.plan-tree-list .v-list-item {
  position: relative;
  min-height: 32px;
}

/* Container cho các item con */
.plan-tree-list .plan-list-items {
  padding-left: 30px; /* Thêm padding trái cho khối item con */
  position: relative; /* Để vẽ đường kẻ dọc */
}

/* Vẽ đường kẻ dọc cho khối item con */
.plan-tree-list .plan-list-items::before {
  content: '';
  position: absolute;
  left: 18px; /* Vị trí đường kẻ dọc */
  top: 0;
  bottom: 14px; /* Dừng trước item cuối 1 đoạn */
  width: 2px; /* Dày hơn */
  background-color: rgba(var(--v-theme-on-surface), 0.35); /* Rõ hơn */
  /* Chỉ hiển thị khi danh sách mở */
  display: v-bind('isPlanListExpanded ? "block" : "none"');
}

/* Từng item con trong cây */
.plan-tree-list .tree-node {
  padding-inline-start: 10px !important; /* Thụt lề so với đường kẻ dọc */
  position: relative; /* Để vẽ đường kẻ ngang */
}

/* Vẽ đường kẻ ngang nối vào đường dọc */
.tree-node::before {
    content: '';
    position: absolute;
    left: -10px; /* Nối từ đường dọc (8px) ra (18px - 8px) */
    top: 16px; /* Căn giữa item (1/2 min-height) */
    width: 17px; /* Độ dài đường ngang */
    height: 2px; /* Dày hơn */
    background-color: rgba(var(--v-theme-on-surface), 0.35); /* Rõ hơn */
}

/* Căn chỉnh lại v-slot:prepend và icon */
.tree-node :deep(.v-list-item__prepend) {
    /* Căn giữa icon với text bằng cách dùng margin auto */
    margin-inline-end: -15px; /* Khoảng cách giữa icon và text */
    /* Ghi đè để không bị lỗi layout */
    display: inline-flex;
    align-items: center;
    align-self: center;
    height: auto;
    padding: 0 !important;
    min-width: auto !important;
}
/* Icon bên trong prepend */
.tree-node :deep(.v-list-item__prepend .v-icon) {
   opacity: 1 !important; /* Đảm bảo icon luôn rõ */
   /* Có thể thêm margin-top/bottom nhỏ nếu cần căn chỉnh thêm */
}

/* Nội dung chính của item (Title) - Bỏ padding cũ nếu có */
.tree-node :deep(.v-list-item__content) {
   padding-inline-start: 0 !important;
}


/* Style cho thanh icon dưới cùng */
.bottom-icon-bar { min-height: 48px; }
.bottom-icon-bar .v-btn { color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); }
.bottom-icon-bar .v-btn:hover { color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); background-color: rgba(var(--v-theme-on-surface), 0.04); }
.bottom-icon-bar .v-badge--dot .v-badge__badge { top: 2px; right: 2px; }
</style>