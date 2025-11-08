<template>
  <v-container fluid class="fill-height">
    <div v-if="planStore.isLoading && !planStore.currentPlan" class="text-center mt-10 w-100">
       <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
       <p class="mt-4 text-medium-emphasis">Đang tải thông tin hành trình...</p>
    </div>

    <v-alert
      v-else-if="planStore.error && !planStore.currentPlan"
      type="error" variant="tonal" class="my-5 w-100" closable @click:close="planStore.error = null">
      {{ planStore.error }}
    </v-alert>

    <div v-else-if="planStore.currentPlan && !planStore.isCurrentUserMember" class="w-100">
      <v-card class="text-center pa-6 mx-auto glass-effect" max-width="600">
        <v-card-item>
            <v-icon icon="mdi-account-group-outline" size="48" color="primary" class="mb-4"></v-icon>
            <v-card-title class="text-h5 mb-2 neon-text-primary">Bạn được mời tham gia!</v-card-title>
        </v-card-item>
        <v-card-text>
            <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2>
            <p class="text-medium-emphasis mb-5">{{ planStore.currentPlan.description }}</p>
            <v-list lines="one" density="compact" class="text-left mx-auto bg-transparent" max-width="400">
                <v-list-item prepend-icon="mdi-account-outline">
                    <v-list-item-title>Người tạo:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.creatorFullName || 'Không rõ' }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider inset></v-divider>
                <v-list-item prepend-icon="mdi-calendar-clock-outline">
                    <v-list-item-title>Thời lượng:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.durationInDays }} ngày</v-list-item-subtitle>
                </v-list-item>
                <v-divider inset></v-divider>
                <v-list-item prepend-icon="mdi-account-multiple-outline">
                    <v-list-item-title>Đã có:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.memberCount }} thành viên</v-list-item-subtitle>
                </v-list-item>
            </v-list>
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

    <div v-else-if="planStore.currentPlan" class="fill-height w-100 d-flex flex-column">
      <v-row class="main-layout-row flex-grow-1">
        
        <v-col cols="12" md="8" class="main-content-col">
          <v-card class="fill-height" rounded="lg">
            <TimelineDashboard 
              class="fill-height" 
              @open-check-in="uiStore.openNewCheckIn"
              @edit-check-in="uiStore.openEditCheckIn"
              @delete-check-in="(event) => uiStore.openConfirmDialog('delete-checkin', event)"
              @comment-on-check-in="(event) => communityStore.selectProgress(event)"
            />
          </v-card>
        </v-col>

        <v-col cols="12" md="4" class="sidebar-col d-flex flex-column">
          
          <div class="sidebar-row-info">
            <PlanInfoPanel
              class="fill-height"
              :link-copied="linkCopied"
              :link-copy-text="linkCopyText"
              :is-loading-action="isLoadingAction" 
              :is-archiving="isArchiving" 
              :is-leaving="isLeaving"
              :removing-member-id="removingMemberId" 
              :error="actionError" 
              @copy-invite-link="copyInviteLink"
              @archive-plan="(val) => uiStore.openConfirmDialog(val ? 'archive-plan' : 'unarchive-plan')"
              @open-transfer-dialog="uiStore.openTransferOwnership"
              @remove-member="(member) => uiStore.openConfirmDialog('remove-member', member)"
              @open-edit-dialog="uiStore.openEditPlan"
              @leave-plan="uiStore.openConfirmDialog('leave-plan')"
              @open-delete-dialog="uiStore.openConfirmDialog('delete-plan')"
            />
            </div>

          <div class="sidebar-row-tasks">
            <v-card class="fill-height" rounded="lg">
              <DailyTaskList
                class="fill-height"
                :tasks="planTaskStore.sortedDailyTasks"
                :is-loading="planTaskStore.isLoading"
                :is-action-loading="planTaskStore.isTaskActionLoading"
                :error="planTaskStore.error"
                :is-owner="planStore.isCurrentUserOwner"
                :date-formatted="dayjs(selectedDateRef).format('DD/MM/YYYY')"
                @open-add-task="uiStore.openAddTask"
                @open-edit-task="uiStore.openEditTask"
                @confirm-delete-task="uiStore.openDeleteTask"
                @reorder-tasks="handleTasksReordered"
              />
            </v-card>
          </div>
          
        </v-col>
      </v-row>
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
import { usePlanStore } from '@/stores/plan';
import { usePlanTaskStore } from '@/stores/planTaskStore';
import { usePlanUiStore } from '@/stores/planUi';
import { useProgressStore } from '@/stores/progress';
import { useCommunityStore } from '@/stores/community'; 
import websocketService from '@/api/websocketService';
import { usePlanWebSocket } from '@/composables/usePlanWebSocket';
// [MỚI] Import composable actions
import { usePlanActions } from '@/composables/usePlanActions';

import PlanInfoPanel from '@/components/PlanInfoPanel.vue';
import TimelineDashboard from '@/components/TimelineDashboard.vue';
import DailyTaskList from '@/components/DailyTaskList.vue';
import PlanDialogs from '@/components/PlanDialogs.vue'; 

import dayjs from 'dayjs'; // <-- THÊM DÒNG NÀY

import {
  VContainer, VRow, VCol, VCard, VCardItem, VCardTitle, VCardText, VList, VListItem, VListItemTitle, VListItemSubtitle, 
  VDivider, VBtn, VAlert, VProgressCircular, VIcon, VSnackbar
} from 'vuetify/components';

const route = useRoute();
const planStore = usePlanStore();
const planTaskStore = usePlanTaskStore();
const uiStore = usePlanUiStore();
const progressStore = useProgressStore();
const communityStore = useCommunityStore(); 

// [MỚI] Khởi tạo Composable Actions
// Destructure các state và hàm xử lý từ usePlanActions
const { 
    isLoadingAction, 
    actionError, 
    isArchiving, 
    isLeaving, 
    removingMemberId, 
    handleGenericConfirm 
} = usePlanActions();

const selectedDateRef = computed(() => progressStore.getSelectedDate);
const { connect: connectWS } = usePlanWebSocket(selectedDateRef);

// Local UI state
const isJoining = ref(false);
const joinError = ref('');
const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const isReordering = ref(false); 

// --- INITIAL DATA FETCHING ---
const fetchPlanAndInitialData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    // Reset action error từ composable (nếu có thể gán được, nhưng tốt nhất để composable tự quản lý)
    // actionError.value = null; 
    await planStore.fetchPlan(shareableLink);
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        connectWS(shareableLink);
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    progressStore.timelineError = null;
    planTaskStore.error = null;
    await Promise.allSettled([ 
        progressStore.fetchTimeline(shareableLink, date),
        planTaskStore.fetchDailyTasks(shareableLink, date)
    ]);
};

// --- ACTION HANDLERS ---

const handleJoinPlan = async () => {
    const link = route.params.shareableLink;
    if (!link) { joinError.value="Mã mời không hợp lệ."; return; }
    isJoining.value=true;
    joinError.value='';
    try {
        await planStore.joinCurrentPlan(link);
        await fetchPlanAndInitialData(link);
    } catch (e) {
        joinError.value = planStore.error || 'Lỗi tham gia.';
    } finally {
        isJoining.value=false;
    }
};

const copyInviteLink = () => {
    if(linkCopied.value || !planStore.currentPlan?.shareableLink) return;
    const inviteUrl = `${window.location.origin}/plan/${planStore.currentPlan.shareableLink}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
        linkCopyText.value='Đã copy!';
        linkCopied.value=true;
        showSnackbar('Đã copy link mời vào clipboard!', 'success');
        setTimeout(() => { linkCopyText.value='Copy link mời'; linkCopied.value=false; }, 2500);
    }).catch(err => {
        showSnackbar('Lỗi khi copy link.', 'error');
    });
};

const showSnackbar = (text, color = 'success') => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
};

// [MỚI] Hàm xử lý sự kiện confirm từ PlanDialogs
// Nó sẽ gọi đến handleGenericConfirm của composable và truyền vào callback showSnackbar
const onConfirmAction = (payload) => {
    handleGenericConfirm(payload, showSnackbar);
};

const handleTasksReordered = async (orderedTasks) => {
    if (isReordering.value) return;
    const taskDate = progressStore.selectedDate;
    isReordering.value = true;
    try {
        await planTaskStore.reorderTasks(planStore.currentPlan.shareableLink, taskDate, orderedTasks);
    } catch (e) {
        showSnackbar(planTaskStore.taskActionError || 'Lỗi khi sắp xếp công việc.', 'error');
    } finally {
        isReordering.value = false;
    }
};

// --- WATCHERS & LIFECYCLE ---
watch(() => route.params.shareableLink, (newLink, oldLink) => {
  if (newLink && newLink !== oldLink) {
    fetchPlanAndInitialData(newLink); 
  }
}, { immediate: true });

watch(selectedDateRef, (newDate, oldDate) => {
    if (newDate && newDate !== oldDate && planStore.currentPlan?.shareableLink) {
        fetchDataForSelectedDate(planStore.currentPlan.shareableLink, newDate); 
    }
});

onMounted(() => {
    if (!websocketService.isConnected()) {
        websocketService.connect();
    }
});

onUnmounted(() => {
    planStore.clearCurrentPlanData();
    planTaskStore.clearDailyTasks();
    progressStore.clearPlanProgressData();
    uiStore.resetAll(); 
});
</script>

<style scoped>
/* Giữ nguyên style cũ */
.fill-height { height: 100%; }
.w-100 { width: 100%; }
.d-flex.flex-column { display: flex; flex-direction: column; }
.flex-grow-1 { flex-grow: 1 !important; }

.main-layout-row {
  height: 100%; 
  min-height: 0; 
}
.main-layout-row > .v-col {
  height: 100%;
  padding-top: 0; 
  padding-bottom: 0;
}
.main-content-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; 
}
.sidebar-col {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0; 
  padding-left: 12px; 
}
.sidebar-row-info {
  flex-grow: 0; 
  flex-shrink: 0; 
  margin-bottom: 16px; 
  display: flex;
  flex-direction: column;
}
.sidebar-row-tasks {
  flex-grow: 1; 
  min-height: 0; 
  display: flex;
  flex-direction: column;
}
.bg-transparent { background-color: transparent !important; }
</style>