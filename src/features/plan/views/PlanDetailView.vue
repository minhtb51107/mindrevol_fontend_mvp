<template>
  <v-container fluid class="fill-height pa-0">

    <div v-if="planStore.isLoading && !planStore.currentPlan" class="text-center w-100 d-flex flex-column justify-center align-center fill-height">
       <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
       <p class="mt-4 text-medium-emphasis">Đang tải thông tin hành trình...</p>
    </div>

    <v-alert
      v-else-if="planStore.error && !planStore.currentPlan"
      type="error" variant="tonal" class="my-5 mx-auto" closable @click:close="planStore.error = null">
      {{ planStore.error }}
    </v-alert>

    <div v-else-if="planStore.currentPlan && !planStore.isCurrentUserMember" class="w-100 d-flex justify-center align-center fill-height pa-4">
      <v-card class="text-center pa-6 mx-auto" max-width="600" variant="outlined">
        <v-card-item>
            <v-icon icon="mdi-account-group-outline" size="48" color="primary" class="mb-4"></v-icon>
            <v-card-title class="text-h5 mb-2">Bạn được mời tham gia!</v-card-title>
        </v-card-item>
        <v-card-text>
            <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2>
            <p class="text-medium-emphasis mb-5">{{ planStore.currentPlan.description }}</p>
            <v-btn
                @click="handleJoinPlan"
                color="primary"
                size="large"
                :loading="isJoining"
                :disabled="isJoining"
                class="mt-6"
                prepend-icon="mdi-account-plus-outline"
            >
                Tham gia ngay
            </v-btn>
            <v-alert v-if="joinError" type="error" density="compact" class="mt-4 mx-auto" max-width="400" closable @click:close="joinError = ''">
                {{ joinError }}
            </v-alert>
        </v-card-text>
      </v-card>
    </div>

    <div v-else-if="planStore.currentPlan" class="fill-height w-100 d-flex flex-column journey-room-container">
      
      <v-sheet class="journey-header pa-4" border="b" elevation="1">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h5 font-weight-bold">{{ planStore.currentPlan.title }}</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">{{ planStore.currentPlan.description }}</p>
          </div>
          <v-btn 
            color="success" 
            prepend-icon="mdi-plus-box-outline" 
            @click="uiStore.openNewCheckIn"
            class="d-none d-sm-flex"
            >
            Đăng Log
          </v-btn>
        </div>
        
        <v-alert
          v-if="planStore.currentPlan.motivation"
          color="amber-lighten-5" border="start" border-color="amber-darken-2"
          class="mt-4" density="compact"
        >
          <template v-slot:prepend>
             <v-icon icon="mdi-lightbulb-on-outline" color="amber-darken-3"></v-icon>
          </template>
          <div class="text-body-2 font-italic text-grey-darken-3">
            "{{ planStore.currentPlan.motivation }}"
          </div>
        </v-alert>
      </v-sheet>
      
      <div class="journey-feed-content flex-grow-1" style="overflow-y: auto;">
        
        <div class="pa-4 text-center d-sm-none">
          <v-btn color="success" size="large" prepend-icon="mdi-plus-box-outline" @click="uiStore.openNewCheckIn" block>
            ĐĂNG "LOG" HÔM NAY
          </v-btn>
        </div>

        <div class="pa-4 mx-auto" style="max-width: 700px;">
          <CompanionshipPath 
            :members="journeyPathData"
            :is-loading="isLoadingJourneyPath"
            :plan-duration="planDuration"
          />
        </div>

        <div class="pa-4 d-flex justify-center">
            <DateSelector />
        </div>
        <v-divider></v-divider>

        <div v-if="progressStore.isLoadingTimeline" class="d-flex justify-center align-center pa-10">
          <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
          <span class="ml-3 text-body-1 text-medium-emphasis">Đang tải...</span>
        </div>
        <v-alert v-else-if="progressStore.timelineError" type="warning" variant="tonal" class="ma-4" density="comfortable">
          Lỗi: {{ progressStore.timelineError }}
        </v-alert>
        <div v-else-if="!socialFeedData || socialFeedData.length === 0" class="d-flex flex-column justify-center align-center pa-10 text-medium-emphasis">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-post-outline</v-icon>
          <p>Chưa có ai đăng "Log" vào ngày này.</p>
        </div>

        <div v-else class="social-feed-wrapper mx-auto pa-2 pa-md-4" style="max-width: 700px;">
          <v-card
            v-for="log in socialFeedData"
            :key="log.id"
            class="mb-4"
            variant="outlined"
            rounded="lg"
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
        </div>
      </div>
      </div>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Đóng</v-btn>
      </template>
    </v-snackbar>
    <PlanDialogs 
        @show-snackbar="showSnackbar"
        @confirm-action="onConfirmAction"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';

// [CẬP NHẬT] Stores
import { usePlanStore } from '@/features/plan/stores/planStore';
import { usePlanUiStore } from '@/features/plan/stores/planUiStore';
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { useAuthStore } from '@/features/auth/stores/authStore'; // <-- THÊM
// [XÓA] Bỏ communityStore
// import { useCommunityStore } from '@/features/community/stores/communityStore';

// [CẬP NHẬT] Components
import PlanDialogs from '@/features/plan/components/PlanDialogs.vue';
import CheckInDetailCard from '@/features/progress/components/checkin/CheckInDetailCard.vue'; // <-- THÊM (P3.2)
import CommentSection from '@/features/community/components/CommentSection.vue'; // <-- THÊM
import DateSelector from '@/components/common/DateSelector.vue'; // <-- THÊM
import CompanionshipPath from '@/features/plan/components/CompanionshipPath.vue';
// [XÓA] Bỏ TimelineDashboard
// import TimelineDashboard from '@/features/progress/components/TimelineDashboard.vue';

import {
  VContainer, VCard, VCardItem, VCardTitle, VCardText, VCardActions,
  VBtn, VAlert, VProgressCircular, VIcon, VSnackbar, VSheet, VDivider,
  VSpacer, VMenu, VList, VListItem, VExpandTransition
} from 'vuetify/components';

const route = useRoute();
const planStore = usePlanStore();
const uiStore = usePlanUiStore();
const progressStore = useProgressStore();
const authStore = useAuthStore(); // <-- THÊM
const journeyPathData = computed(() => progressStore.journeyPathData);
const isLoadingJourneyPath = computed(() => progressStore.isLoadingJourneyPath);
const planDuration = computed(() => {
  const plan = planStore.currentPlan;
  // Lấy 'durationInDays' từ planStore, khớp với 'Plan.java'
  if (plan && plan.durationInDays > 0) {
    return plan.durationInDays;
  }
  return 0; // Trả về 0 nếu không có
});
// Local UI state
const isJoining = ref(false);
const joinError = ref('');
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const expandedLogId = ref(null); // <-- THÊM

// *** LOGIC MỚI (LẤY TỪ TIMELINEDASHBOARD) ***
// Dữ liệu Social Feed (Làm phẳng + Sắp xếp)
const socialFeedData = computed(() => {
    const timelineData = progressStore.timelineSwimlanes;
    if (!timelineData) return [];
    let allPosts = [];
    timelineData.forEach(lane => {
        if (lane.checkIns && lane.checkIns.length > 0) {
             lane.checkIns.forEach(checkIn => {
                 // Gắn thông tin author vào
                 allPosts.push({ ...checkIn, author: lane.member });
             });
        }
    });
    // Sắp xếp: mới nhất lên đầu
    return allPosts.sort((a, b) => new Date(b.checkInTimestamp) - new Date(a.checkInTimestamp));
});
// *** KẾT THÚC LOGIC MỚI ***


// --- HÀM TẢI DỮ LIỆU (ĐƠN GIẢN HÓA) ---
// SỬA LẠI HÀM NÀY:
const fetchPlanData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    await planStore.fetchPlan(shareableLink);
    
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        // Vẫn phải gọi fetchTimeline để lấy dữ liệu cho socialFeedData
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        
        // <-- THÊM DÒNG MỚI NÀY -->
        await progressStore.fetchJourneyPath(shareableLink);
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    progressStore.timelineError = null;
    await progressStore.fetchTimeline(shareableLink, date); // Chỉ cần fetch timeline
};

// --- HÀM XỬ LÝ ---
const handleJoinPlan = async () => {
    const link = route.params.shareableLink;
    if (!link) { joinError.value="Mã mời không hợp lệ."; return; }
    isJoining.value=true;
    joinError.value='';
    try {
        await planStore.joinCurrentPlan(link);
        await fetchPlanData(link);
    } catch (e) {
        joinError.value = planStore.error || 'Lỗi tham gia.';
    } finally {
        isJoining.value=false;
    }
};

const showSnackbar = (text, color = 'success') => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
};

// [SỬA] Cần implement lại onConfirmAction
const onConfirmAction = (payload) => {
  // SỬA LỖI: Đổi 'payload.action' -> 'payload.type' và 'payload.data' -> 'payload.item'
  if (payload.type === 'delete-checkin' && payload.item) { 
    console.log("Xác nhận xóa CheckIn/Log:", payload.item.id);
    progressStore.deleteCheckInAction(payload.item.id)
      .then(() => showSnackbar("Đã xóa Log thành công.", "success"))
      .catch((err) => showSnackbar(err.message || "Lỗi khi xóa Log.", "error"));
  } else {
    console.warn("Hành động chưa được hỗ trợ (hoặc payload không đúng):", payload);
  }
};

// --- HÀM XỬ LÝ MỚI CHO FEED ---
const toggleCommentSection = (logId) => {
    expandedLogId.value = expandedLogId.value === logId ? null : logId;
};

const handleToggleReaction = (logId, reactionType) => {
    // Gọi action từ progressStore
    progressStore.toggleReactionOnCheckIn(logId, reactionType);
};

const getTotalReactions = (log) => {
    if (!log.reactions) return 0;
    // Tìm reaction 'HEART'
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.count : 0;
};

const hasReacted = (log) => {
    // Kiểm tra xem user hiện tại (từ authStore) đã react 'HEART' chưa
    if (!log.reactions || !authStore.currentUser) return false;
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.reactedByCurrentUser : false;
};

const canModifyLog = (log) => {
    if (!authStore.currentUser) return false;
    // Hoặc là chủ Log, hoặc là chủ Plan
    return log.author?.userId === authStore.currentUser.id || planStore.isCurrentUserOwner;
};

// --- WATCHERS & LIFECYCLE ---
watch(() => route.params.shareableLink, (newLink, oldLink) => {
  if (newLink && newLink !== oldLink) {
    fetchPlanData(newLink); 
  }
}, { immediate: true });

watch(() => progressStore.getSelectedDate, (newDate, oldDate) => {
    if (newDate && newDate !== oldDate && planStore.currentPlan?.shareableLink) {
        fetchDataForSelectedDate(planStore.currentPlan.shareableLink, newDate); 
    }
});

onUnmounted(() => {
    planStore.clearCurrentPlanData();
    progressStore.clearPlanProgressData();
    uiStore.resetAll(); 
});
</script>

<style scoped>
.journey-room-container {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
.journey-header {
  flex-grow: 0;
  flex-shrink: 0;
  background-color: rgba(var(--v-theme-surface), 0.95); /* Đậm hơn 1 chút */
  z-index: 10; /* Cao hơn feed */
}
.journey-feed-content {
  flex-grow: 1;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-background)); /* Màu nền cho feed */
}
/* Style cho card trong feed */
.social-feed-wrapper .v-card {
  transition: box-shadow 0.2s ease-in-out;
}
.social-feed-wrapper .v-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
</style>