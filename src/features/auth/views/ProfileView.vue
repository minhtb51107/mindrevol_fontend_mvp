<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        
        <v-card class="mb-4 pa-4" variant="outlined">
          <v-row align="center">
            <v-col cols="12" sm="auto" class="text-center">
              <v-avatar size="96" color="primary">
                <v-img 
                  v-if="authStore.userAvatarUrl" 
                  :src="authStore.userAvatarUrl" 
                  :alt="authStore.userFullName"
                ></v-img>
                <span v-else class="text-h3">{{ authStore.userInitial }}</span>
              </v-avatar>
            </v-col>
            <v-col>
              <h1 class="text-h4 font-weight-bold">{{ authStore.userFullName }}</h1>
              <p class="text-h6 text-medium-emphasis" v-if="authStore.currentUser">{{ authStore.currentUser.email }}</p>
              </v-col>
          </v-row>
        </v-card>

        <v-card>
          <v-tabs v-model="tab" grow bg-color="transparent">
            <v-tab value="museum">
              <v-icon start>mdi-history</v-icon>
              Bảo tàng (Hành trình)
            </v-tab>
            <v-tab value="settings">
              <v-icon start>mdi-cog-outline</v-icon>
              Cài đặt tài khoản
            </v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="museum" class="pa-0">
              <div v-if="feedStore.isMuseumLoading && !feedStore.museumItems.length" class="d-flex justify-center align-center pa-10">
                <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
                <span class="ml-3 text-body-1 text-medium-emphasis">Đang tải...</span>
              </div>
              <v-alert v-else-if="feedStore.museumError" type="warning" variant="tonal" class="ma-4" density="comfortable">
                Lỗi: {{ feedStore.museumError }}
              </v-alert>
              <div v-else-if="!feedStore.museumItems.length" class="d-flex flex-column justify-center align-center pa-10 text-medium-emphasis">
                <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-post-outline</v-icon>
                <p>Bạn chưa đăng "Log" nào.</p>
                <p class="text-caption">Hãy <router-link :to="{ name: 'create-plan' }">tạo hành trình</router-link> và bắt đầu ngay!</p>
              </div>

              <div v-else class="social-feed-wrapper">
                <v-card
                  v-for="log in feedStore.museumItems"
                  :key="log.id"
                  class="mb-0"
                  variant="flat"
                  rounded="0"
                  :style="{ borderBottom: '1px solid rgba(var(--v-border-color), 0.1)' }"
                >
                  <v-card-text>
                    <CheckInDetailCard :check-in="log" />
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions class="pa-2">
                    <v-btn 
                      variant="text" 
                      :color="hasReacted(log) ? 'primary' : 'medium-emphasis'" 
                      @click="handleToggleReaction(log.id, 'HEART')"
                    >
                      <v-icon start>{{ hasReacted(log) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                      {{ getTotalReactions(log) }} Thích
                    </v-btn>
                    <v-btn 
                      variant="text" 
                      color="medium-emphasis" 
                      @click="toggleCommentSection(log.id)"
                    >
                      <v-icon start>mdi-comment-outline</v-icon>
                      {{ log.commentCount || 0 }} Bình luận
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-menu v-if="canModifyLog(log)" location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn icon="mdi-dots-horizontal" variant="text" density="comfortable" size="small" v-bind="props"></v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item @click="uiStore.openEditCheckIn(log)" title="Chỉnh sửa Log"></v-list-item>
                        <v-list-item @click="uiStore.openConfirmDialog('delete-checkin', log)" title="Xóa Log" class="text-error"></v-list-item>
                      </v-list>
                    </v-menu>
                  </v-card-actions>
                  <v-expand-transition>
                    <div v-if="expandedLogId === log.id" class="px-4 pb-3">
                      <v-divider class="mb-3"></v-divider>
                      <CommentSection :comments="log.comments || []" :check-in-id="log.id" />
                    </div>
                  </v-expand-transition>
                </v-card>
                
                <div v-if="!feedStore.isMuseumLastPage && !feedStore.isMuseumLoading" class="text-center pa-4">
                  <v-btn variant="outlined" @click="loadMore" :loading="feedStore.isMuseumLoading">
                    Tải thêm
                  </v-btn>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="settings" class="pa-4">
              <v-card-text v-if="authStore.currentUser">
                <h3 class="text-h6">Bảo mật</h3>
                <p class="text-medium-emphasis mb-4">Quản lý mật khẩu đăng nhập của bạn.</p>
                
                <v-btn
                  v-if="authStore.currentUser?.authProvider === 'LOCAL'"
                  color="primary"
                  @click="showChangePasswordModal = true"
                  prepend-icon="mdi-lock-reset"
                >
                  Đổi mật khẩu
                </v-btn>
                
                <div v-else>
                  <v-btn
                    color="secondary"
                    @click="handleSetPasswordRequest"
                    prepend-icon="mdi-lock-plus-outline"
                    :loading="isSendingEmail"
                  >
                    Tạo mật khẩu đăng nhập
                  </v-btn>
                  <p class="text-caption text-medium-emphasis mt-2">
                    Tài khoản của bạn hiện đang đăng nhập qua Google. Tạo mật khẩu để có thể đăng nhập bằng email và mật khẩu.
                  </p>
                </div>
              </v-card-text>
              <v-card-text v-else>
                <v-progress-circular indeterminate></v-progress-circular>
              </v-card-text>

              <v-snackbar
                v-model="showEmailSentAlert"
                color="success"
                timeout="5000"
                location="top"
              >
                Đã gửi email tạo mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
              </v-snackbar>
              <v-snackbar
                v-model="errorMessage"
                color="error"
                timeout="5000"
                location="top"
              >
                {{ errorMessage }}
              </v-snackbar>

            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
    
    <ChangePasswordModal v-model="showChangePasswordModal" />
    
    <PlanDialogs 
        @show-snackbar="showSnackbar"
        @confirm-action="onConfirmAction"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
// [CẬP NHẬT] Stores
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useFeedStore } from '@/features/community/stores/feedStore';
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanUiStore } from '@/features/plan/stores/planUiStore'; // <-- THÊM

// [CẬP NHẬT] Components
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal.vue';
import CheckInDetailCard from '@/features/progress/components/checkin/CheckInDetailCard.vue';
import CommentSection from '@/features/community/components/CommentSection.vue';
import PlanDialogs from '@/features/plan/components/PlanDialogs.vue'; // <-- THÊM
import { 
  VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VBtn, VDivider, VAvatar, 
  VSnackbar, VIcon, VImg, VTabs, VTab, VWindow, VWindowItem,
  VCardActions, VSpacer, VExpandTransition, VProgressCircular, VAlert,
  VMenu, VList, VListItem // <-- THÊM
} from 'vuetify/components';

const authStore = useAuthStore();
const feedStore = useFeedStore();
const progressStore = useProgressStore();
const uiStore = usePlanUiStore(); // <-- THÊM

const tab = ref('museum'); // Mặc định mở "Bảo tàng"
const expandedLogId = ref(null);
const currentUserId = computed(() => authStore.currentUser?.id);

// --- State cho logic Cài đặt (Giữ nguyên từ file cũ) ---
const showChangePasswordModal = ref(false);
const isSendingEmail = ref(false);
const showEmailSentAlert = ref(false);
const errorMessage = ref('');
const snackbar = ref(false); // <-- THÊM

// --- Tải dữ liệu "Bảo tàng" ---
onMounted(() => {
  feedStore.clearMuseumFeed(); // Xóa cũ
  if (currentUserId.value) {
    feedStore.fetchMuseumFeed(currentUserId.value, false);
  }
});
onUnmounted(() => {
  feedStore.clearMuseumFeed(); // Dọn dẹp
});

const loadMore = () => {
  if (currentUserId.value) {
    feedStore.fetchMuseumFeed(currentUserId.value, true);
  }
};

// --- LOGIC TƯƠNG TÁC (Copy từ P4.A) ---
const toggleCommentSection = (logId) => {
    expandedLogId.value = expandedLogId.value === logId ? null : logId;
};

const handleToggleReaction = (logId, reactionType) => {
    progressStore.toggleReactionOnCheckIn(logId, reactionType);
    const logItem = feedStore.museumItems.find(item => item.id === logId);
    if (logItem) {
        if (!logItem.reactions) logItem.reactions = [];
        const reaction = logItem.reactions.find(r => r.type === reactionType);
        if (reaction) {
            reaction.reactedByCurrentUser = !reaction.reactedByCurrentUser;
            reaction.count += reaction.reactedByCurrentUser ? 1 : -1;
        } else {
             logItem.reactions.push({ type: reactionType, count: 1, reactedByCurrentUser: true });
        }
    }
};

const getTotalReactions = (log) => {
    if (!log.reactions) return 0;
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.count : 0;
};

const hasReacted = (log) => {
    if (!log.reactions || !authStore.currentUser) return false;
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.reactedByCurrentUser : false;
};

// Thêm (Từ P3.3)
const canModifyLog = (log) => {
    if (!authStore.currentUser) return false;
    // Chỉ chủ Log mới được sửa/xóa (không cho chủ Plan sửa/xóa ở đây)
    return log.author?.userId === authStore.currentUser.id;
};

// Thêm (Từ P3.3)
const showSnackbar = (text, color = 'success') => {
    errorMessage.value = (color === 'error') ? text : '';
    snackbar.value = (color === 'success'); // Cần một state snackbar riêng
};
// Thêm (Từ P3.3)
const onConfirmAction = (payload) => {
  if (payload.action === 'delete-checkin' && payload.data) {
    progressStore.deleteCheckInAction(payload.data.id)
      .then(() => {
        showSnackbar("Đã xóa Log thành công.", "success");
        // Tải lại feed Bảo tàng
        if (currentUserId.value) {
          feedStore.fetchMuseumFeed(currentUserId.value, false);
        }
      })
      .catch((err) => showSnackbar(err.message || "Lỗi khi xóa Log.", "error"));
  }
};


// --- LOGIC CÀI ĐẶT (Giữ nguyên từ file cũ) ---
const handleSetPasswordRequest = async () => {
  if (!authStore.currentUser?.email) {
    errorMessage.value = "Không tìm thấy email người dùng.";
    return;
  }
  isSendingEmail.value = true;
  errorMessage.value = '';
  try {
    await authStore.handleForgotPassword(authStore.currentUser.email);
    showEmailSentAlert.value = true;
  } catch (error) {
    if (error.response) {
      errorMessage.value = error.response.data?.message || 'Gửi email thất bại. Vui lòng thử lại.';
    } else {
      errorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
  } finally {
    isSendingEmail.value = false;
  }
};
</script>

<style scoped>
.social-feed-wrapper .v-card {
  transition: box-shadow 0.2s ease-in-out;
}
.social-feed-wrapper .v-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
</style>