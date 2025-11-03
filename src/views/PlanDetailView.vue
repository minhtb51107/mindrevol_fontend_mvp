<template>
  <v-container fluid class="fill-height">
    <div v-if="planStore.isLoading && !planStore.currentPlan" class="text-center mt-10 w-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Đang tải thông tin kế hoạch...</p>
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
            <v-alert
                v-if="joinError"
                type="error"
                density="compact"
                class="mt-4 mx-auto"
                max-width="400"
                closable
                @click:close="joinError = ''"
            >
                {{ joinError }}
            </v-alert>
        </v-card-text>
      </v-card>
    </div>

    <div v-else-if="planStore.currentPlan" class="fill-height w-100">
      <v-row class="main-layout-row">
        
        <v-col cols="12" md="8" class="main-content-col">
          <v-card class="fill-height" rounded="lg">
            <TimelineDashboard 
              class="fill-height" 
              @open-check-in="openCheckInModal"
              @edit-check-in="openEditCheckInDialog"
              @delete-check-in="openDeleteCheckInConfirm"
              @comment-on-check-in="openCommentDialog"
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
              @archive-plan="confirmArchiveAction"
              @open-transfer-dialog="openTransferOwnershipDialog"
              @remove-member="confirmRemoveMember"
              @open-edit-dialog="openEditPlanDialog"
              @leave-plan="confirmLeavePlan"
              @open-delete-dialog="openDeletePlanDialog"
            />
            </div>

          <div class="sidebar-row-tasks">
            <v-card class="fill-height" rounded="lg">
              <DailyTaskList
                class="fill-height"
                @open-add-task="openAddTaskDialog"
                @open-edit-task="openEditTaskDialog"
                @confirm-delete-task="confirmDeleteTask"
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

    <EditPlanModal 
      v-model="isEditPlanModalOpen" 
      @close="isEditPlanModalOpen = false"
      @plan-updated="showSnackbar('Cập nhật chi tiết kế hoạch thành công.', 'success')"
    />
    <TransferOwnershipDialog
      v-model="showTransferDialog"
      :members="otherMembers"
      @transfer-success="showSnackbar('Đã gửi yêu cầu chuyển quyền sở hữu.', 'success')"
    />
    <DeleteConfirmDialog
      v-model="showConfirmDialog"
      :itemType="confirmDialogType"
      @confirm="onConfirmDialog"
    />


    <v-dialog v-model="taskDialog" persistent max-width="500px">
      <v-card class="glass-effect">
        <v-card-title>{{ editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới' }}</v-card-title>
        <v-card-text>
          <v-alert v-if="taskDialogError" type="error" density="compact" class="mb-3" closable @click:close="taskDialogError = ''">
            {{ taskDialogError }}
          </v-alert>
          <v-form ref="taskFormRef" @submit.prevent="saveTask">
            <v-textarea
              v-model="taskForm.description"
              label="Mô tả công việc *"
              rows="3" variant="outlined" density="compact"
              :rules="[rules.required]" class="mb-3" autofocus>
            </v-textarea>
            <v-text-field
              v-model="taskForm.deadlineTime"
              label="Deadline (HH:mm - tùy chọn)"
              type="time" variant="outlined" density="compact" clearable>
            </v-text-field>
             <v-text-field
                v-if="!editingTask"
                v-model="taskForm.taskDate"
                label="Ngày thực hiện *"
                type="date" variant="outlined" density="compact"
                :rules="[rules.required, rules.date]"
                class="mt-3"
             ></v-text-field>
             <v-text-field
                v-if="editingTask"
                v-model="taskForm.taskDate"
                label="Chuyển sang ngày (tùy chọn)"
                type="date" variant="outlined" density="compact"
                :rules="[rules.date]"
                class="mt-3"
                clearable
             ></v-text-field>

          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="medium-emphasis" variant="text" @click="closeTaskDialog" :disabled="planStore.isTaskLoading">Hủy</v-btn>
          <v-btn color="primary" variant="flat" @click="saveTask" :loading="planStore.isTaskLoading">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTaskConfirmDialog" persistent max-width="400px">
      <v-card class="glass-effect">
        <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa công việc "<span class="font-weight-medium">{{ taskToDelete?.description }}</span>" của ngày {{ taskToDelete?.taskDate }}? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="medium-emphasis" text @click="deleteTaskConfirmDialog = false" :disabled="planStore.isTaskLoading">Hủy</v-btn>
          <v-btn color="error" text @click="executeDeleteTask" :loading="planStore.isTaskLoading">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ProgressDetailModal 
      v-if="planStore.currentPlan?.shareableLink"
      :shareable-link="planStore.currentPlan.shareableLink"
    />
    <CheckInModal 
      v-model="isCheckInModalOpen"
      :is-editing="!!checkInToEdit"
      :existing-check-in="checkInToEdit"
      @update:modelValue="onCheckInModalClose"
    />
    <v-dialog v-model="deleteCheckInConfirmDialog" persistent max-width="450px">
      <v-card class="glass-effect">
        <v-card-title class="text-h6">Xác nhận xóa Check-in</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa vĩnh viễn check-in này không?
          <span v-if="checkInToDelete?.notes" class="d-block mt-2 font-italic text-medium-emphasis">
            "{{ checkInToDelete.notes.substring(0, 100) }}{{ checkInToDelete.notes.length > 100 ? '...' : '' }}"
          </span>
          <br>
          <span class="text-error font-weight-medium">Hành động này sẽ tính toán lại trạng thái hoàn thành của các task liên quan.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="medium-emphasis" text @click="closeDeleteCheckInConfirm" :disabled="isDeletingCheckIn">Hủy</v-btn>
          <v-btn color="error" text @click="executeDeleteCheckIn" :loading="isDeletingCheckIn">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
// (Toàn bộ phần <script setup> giữ nguyên y hệt như lần trước, không cần thay đổi)
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import { useCommunityStore } from '@/stores/community'; 
import websocketService from '@/api/websocketService';
import dayjs from 'dayjs'; 

// Import components chính
import PlanInfoPanel from '@/components/PlanInfoPanel.vue';
import TimelineDashboard from '@/components/TimelineDashboard.vue';
import DailyTaskList from '@/components/DailyTaskList.vue';
import CheckInModal from '@/components/CheckInModal.vue'; 
import ProgressDetailModal from '@/components/ProgressDetailModal.vue'; 

// === (SỬA) IMPORT CÁC DIALOGS MỚI ===
import EditPlanModal from '@/components/dialogs/EditPlanModal.vue'; 
import TransferOwnershipDialog from '@/components/dialogs/TransferOwnershipDialog.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';

// Import components từ Vuetify (giữ nguyên)
import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VList, VListItem, VListItemTitle, VListItemSubtitle, VDivider, VBtn, VAlert, VProgressCircular, VIcon, VChip, VSnackbar,
  VCardActions, VSpacer, VDialog, VForm, VTextarea, VTextField,
  VSelect
} from 'vuetify/components';

// --- Stores & Router ---
const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const authStore = useAuthStore();
const progressStore = useProgressStore();
const communityStore = useCommunityStore(); 

// --- State cho "Join Plan" ---
const isJoining = ref(false);
const joinError = ref('');

// --- State cho UI chung ---
const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// === (SỬA) STATE QUẢN LÝ PLAN (REFACTORED) ===
const actionError = ref(null); // Lỗi chung cho các hành động
const isLoadingAction = ref(false); // Loading chung (để disable các nút khác)
const isEditPlanModalOpen = ref(false); // State cho dialog Sửa
const showTransferDialog = ref(false); // State cho dialog Chuyển quyền
const showConfirmDialog = ref(false); // 1 dialog cho tất cả xác nhận
const confirmDialogType = ref(''); // 'leave-plan', 'archive-plan', 'unarchive-plan', 'remove-member', 'delete-plan'
const itemToProcess = ref(null); // Dùng để lưu member/task cần xử lý
// State loading chi tiết cho PlanInfoPanel
const isArchiving = ref(null); // null, true (archiving), false (unarchiving)
const isLeaving = ref(false);
const removingMemberId = ref(null);
const isDeleting = ref(false); // (MỚI) State cho xóa vĩnh viễn


// --- State cho Dialogs Task (GIỮ NGUYÊN) ---
const taskDialog = ref(false);
const editingTask = ref(null);
const taskFormRef = ref(null);
const taskForm = reactive({ description: '', deadlineTime: null, taskDate: null });
const taskDialogError = ref('');
const deleteTaskConfirmDialog = ref(false);
const taskToDelete = ref(null);

// --- State cho Dialogs Check-in (GIỮ NGUYÊN) ---
const isCheckInModalOpen = ref(false);
const checkInToEdit = ref(null); 
const deleteCheckInConfirmDialog = ref(false); 
const checkInToDelete = ref(null); 
const isDeletingCheckIn = ref(false); 

// --- State cho WebSocket ---
const progressTopic = ref('');
const taskTopic = ref('');
const planDetailsTopic = ref('');

// --- Computed Properties ---
const selectedDate = computed(() => progressStore.getSelectedDate);
const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    // Chỉ trả về các member khác, KHÔNG PHẢI CHÍNH MÌNH
    return planStore.currentPlan.members.filter(member => member.userId !== authStore.currentUser.id && member.role !== 'OWNER');
}); 

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  date: value => !value || dayjs(value, 'YYYY-MM-DD', true).isValid() || 'Định dạng ngày YYYY-MM-DD.',
};

// =================================================================
// ===           (SỬA) DI CHUYỂN HÀM LÊN TRÊN                 ===
// =================================================================

// --- Logic Tải dữ liệu ---
const fetchPlanAndInitialData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    // (SỬA) Reset lỗi action chung khi tải lại
    actionError.value = null;
    await planStore.fetchPlan(shareableLink);
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        // Mặc định tải dữ liệu cho ngày hôm nay (hoặc ngày đã chọn từ store)
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        // Cài đặt WebSocket
        setupWebSocket(shareableLink);
    } else if (planStore.currentPlan && !planStore.isCurrentUserMember) {
        console.log("PlanDetailView: User is not a member yet.");
        // (Không làm gì cả, màn hình "Join" sẽ hiển thị)
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    console.log(`PlanDetailView: Fetching timeline and tasks for ${date}...`);
    progressStore.timelineError = null;
    planStore.dailyTasksError = null;
    // Tải song song timeline và task list
    await Promise.allSettled([ 
        progressStore.fetchTimeline(shareableLink, date),
        planStore.fetchDailyTasks(shareableLink, date)
    ]);
     console.log(`PlanDetailView: Finished fetching data for ${date}.`);
};

// --- Logic WebSocket ---
const setupWebSocket = (shareableLink) => { 
    if (!shareableLink || !planStore.isCurrentUserMember) return;

    const subscribeAndLog = (topicRef, topicPath, handler) => {
        if (topicRef.value) {
             websocketService.unsubscribe(topicRef.value);
             topicRef.value = '';
        }
        websocketService.subscribe(topicPath, handler)
            .then(() => {
                topicRef.value = topicPath;
                console.log(`WS Subscribed: ${topicPath}`);
            })
            .catch(err => console.error(`WS Subscribe Error ${topicPath}:`, err));
    };

    // 3 Kênh chính
    subscribeAndLog(progressTopic, `/topic/plan/${shareableLink}/progress`, handleProgressUpdate);
    subscribeAndLog(taskTopic, `/topic/plan/${shareableLink}/tasks`, handleTaskUpdate);
    subscribeAndLog(planDetailsTopic, `/topic/plan/${shareableLink}/details`, handlePlanDetailsUpdate);
};

const unsubscribeWebSocketTopics = () => {
    if (progressTopic.value) websocketService.unsubscribe(progressTopic.value);
    if (taskTopic.value) websocketService.unsubscribe(taskTopic.value);
    if (planDetailsTopic.value) websocketService.unsubscribe(planDetailsTopic.value);
    progressTopic.value = '';
    taskTopic.value = '';
    planDetailsTopic.value = '';
    console.log(`WS: Unsubscribed from plan topics.`);
};

const handleProgressUpdate = (message) => { 
    console.log("WS Received progress update:", message);
    progressStore.handleWebSocketUpdate(message);
};

const handleTaskUpdate = (message) => { 
    console.log("WS Received task update:", message);
    planStore.handleTaskWebSocketUpdate(message, progressStore.selectedDate);
};

const handlePlanDetailsUpdate = (message) => { 
    console.log("WS Received plan details update:", message);
    if (!planStore.currentPlan) return;
    
    const { 
      type, member, userId, 
      status, displayStatus, 
      title, description, dailyGoal, 
      durationInDays, startDate, endDate, 
      oldOwnerUserId, newOwnerUserId 
    } = message;

    let needsTimelineRefetch = false;
    const authStore = useAuthStore(); 

    switch(type) {
        case 'MEMBER_JOINED':
            if (planStore.currentPlan.members && !planStore.currentPlan.members.some(m => m.userId === member?.userId)) {
                planStore.currentPlan.members.push(member);
                if (typeof planStore.currentPlan.memberCount === 'number') planStore.currentPlan.memberCount++;
                console.log("RT: Added Member:", member?.userEmail);
                needsTimelineRefetch = true;
            }
            break;
        
        case 'MEMBER_LEFT':
        case 'MEMBER_REMOVED':
            if (planStore.currentPlan.members) {
                const index = planStore.currentPlan.members.findIndex(m => m.userId === userId);
                if (index !== -1) {
                    planStore.currentPlan.members.splice(index, 1);
                    if (typeof planStore.currentPlan.memberCount === 'number' && planStore.currentPlan.memberCount > 0) planStore.currentPlan.memberCount--;
                    console.log("RT: Removed/Left Member:", userId);
                    needsTimelineRefetch = true;
                }
                // Nếu người dùng hiện tại bị "đá" hoặc "rời", điều hướng họ đi
                if (authStore.currentUser?.id === userId) {
                    showSnackbar(type === 'MEMBER_LEFT' ? 'Bạn đã rời kế hoạch.' : 'Bạn đã bị loại khỏi kế hoạch.', 'warning');
                    router.push('/dashboard');
                }
            }
            break;

        case 'STATUS_CHANGED':
            if (status !== undefined) planStore.currentPlan.status = status;
            if (displayStatus !== undefined) planStore.currentPlan.displayStatus = displayStatus;
            console.log("RT: Status Changed:", status);
            // Nếu plan bị lưu trữ, *và* người dùng hiện tại *không phải* là owner,
            // thì mới điều hướng đi. Owner cần ở lại để thấy nút "Khôi phục" / "Xóa".
            if (status === 'ARCHIVED' && !planStore.isCurrentUserOwner) {
                showSnackbar('Kế hoạch này đã được lưu trữ.', 'info');
                router.push('/dashboard');
            }
            // (SỬA) Nếu plan được khôi phục, tải lại dữ liệu
            else if (status === 'ACTIVE' || status === 'COMPLETED') {
                 fetchDataForSelectedDate(planStore.currentPlan.shareableLink, progressStore.selectedDate);
            }
            break;

        case 'PLAN_DETAILS_UPDATED':
        case 'PLAN_INFO_UPDATED': 
            if (title !== undefined) planStore.currentPlan.title = title;
            if (description !== undefined) planStore.currentPlan.description = description;
            if (dailyGoal !== undefined) planStore.currentPlan.dailyGoal = dailyGoal;
            if (durationInDays !== undefined) planStore.currentPlan.durationInDays = durationInDays;
            if (startDate !== undefined) planStore.currentPlan.startDate = startDate;
            if (endDate !== undefined) planStore.currentPlan.endDate = endDate;
            console.log("RT: Plan Info/Details Updated.");
            break;

        case 'OWNERSHIP_TRANSFERRED':
            if (planStore.currentPlan.members && oldOwnerUserId && newOwnerUserId) {
                const oldOwner = planStore.currentPlan.members.find(m => m.userId === oldOwnerUserId);
                const newOwner = planStore.currentPlan.members.find(m => m.userId === newOwnerUserId);
                if (oldOwner) oldOwner.role = 'MEMBER';
                if (newOwner) newOwner.role = 'OWNER';
                console.log(`RT: Ownership Transferred: ${oldOwnerUserId} -> ${newOwnerUserId}`);
            }
            break;
        default:
            console.log("RT: Unhandled plan details update type:", type);
    }
    if (needsTimelineRefetch && planStore.currentPlan?.shareableLink) {
         console.log("RT: Refetching timeline due to member change...");
         progressStore.fetchTimeline(planStore.currentPlan.shareableLink, progressStore.selectedDate);
    }
};

// --- Logic Hành động (Join, Copy) ---
const handleJoinPlan = async () => {
    const link = route.params.shareableLink;
    if (!link) { joinError.value="Mã mời không hợp lệ."; return; }
    isJoining.value=true;
    joinError.value='';
    try {
        await planStore.joinCurrentPlan(link);
        // Sau khi join thành công, tải lại toàn bộ dữ liệu
        await fetchPlanAndInitialData(link);
    } catch (e) {
        joinError.value = planStore.error || 'Lỗi tham gia.';
        console.error("Join plan error:", e);
    } finally {
        isJoining.value=false;
    }
};

const copyInviteLink = () => {
    if(linkCopied.value || !planStore.currentPlan?.shareableLink) return;
    // (Sửa) Tạo link mời đúng
    const inviteUrl = `${window.location.origin}/plan/join/${planStore.currentPlan.shareableLink}`; 
    navigator.clipboard.writeText(inviteUrl).then(() => {
        linkCopyText.value='Đã copy!';
        linkCopied.value=true;
        showSnackbar('Đã copy link mời vào clipboard!', 'success');
        setTimeout(() => { linkCopyText.value='Copy link mời'; linkCopied.value=false; }, 2500);
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        showSnackbar('Lỗi khi copy link.', 'error');
    });
};

const showSnackbar = (text, color = 'success') => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
};

// --- Logic Hành động Quản lý Plan (REFACTORED) ---

// Mở dialog Sửa (Từ PlanInfoPanel)
const openEditPlanDialog = () => {
    isEditPlanModalOpen.value = true;
};

// Mở dialog Chuyển quyền (Từ PlanInfoPanel)
const openTransferOwnershipDialog = () => {
    showTransferDialog.value = true;
};

// Mở dialog Rời Plan (Từ PlanInfoPanel)
const confirmLeavePlan = () => {
    openConfirmDialog('leave-plan');
};

// Mở dialog Lưu trữ/Khôi phục (Từ PlanInfoPanel)
const confirmArchiveAction = (isArchivingFlag) => {
    openConfirmDialog(isArchivingFlag ? 'archive-plan' : 'unarchive-plan');
};

// Mở dialog Xóa Member (Từ PlanInfoPanel)
const confirmRemoveMember = (member) => {
    openConfirmDialog('remove-member', member);
};

// (MỚI) Mở dialog Xóa Vĩnh viễn (Từ PlanInfoPanel)
const openDeletePlanDialog = () => {
    openConfirmDialog('delete-plan');
};

// Hàm trợ giúp: Mở Dialog Xác nhận chung
const openConfirmDialog = (type, item = null) => {
    confirmDialogType.value = type;
    itemToProcess.value = item; // Lưu member hoặc item khác nếu cần
    actionError.value = null; // Reset lỗi
    showConfirmDialog.value = true;
};

// Hàm Thực thi Xác nhận (Từ DeleteConfirmDialog)
const onConfirmDialog = async () => {
  const type = confirmDialogType.value;
  const item = itemToProcess.value;
  showConfirmDialog.value = false;
  
  // Bật loading chung
  isLoadingAction.value = true;
  actionError.value = null;

  try {
    switch (type) {
      case 'leave-plan':
        isLeaving.value = true;
        await planStore.leaveCurrentPlan();
        showSnackbar('Bạn đã rời khỏi kế hoạch.');
        // Store đã xử lý điều hướng
        break;
        
      case 'archive-plan':
        isArchiving.value = true;
        await planStore.archiveCurrentPlan();
        showSnackbar('Kế hoạch đã được lưu trữ.');
        // (SỬA) KHÔNG ĐIỀU HƯỚNG, plan state sẽ tự cập nhật
        break;

      case 'unarchive-plan':
        isArchiving.value = false;
        await planStore.unarchiveCurrentPlan();
        showSnackbar('Kế hoạch đã được khôi phục.');
        // Tải lại toàn bộ dữ liệu (vì userPlans list cũng thay đổi)
        await fetchPlanAndInitialData(route.params.shareableLink);
        break;
        
      case 'remove-member':
        if (item) {
          removingMemberId.value = item.userId;
          await planStore.removeMemberFromCurrentPlan(removingMemberId.value);
          showSnackbar(`Đã xóa thành viên: ${item.userFullName}`, 'success');
        }
        break;
        
      case 'delete-plan': // (MỚI)
        isDeleting.value = true;
        await planStore.deletePlanPermanently();
        showSnackbar('Kế hoạch đã được xóa vĩnh viễn.');
        // Store đã xử lý điều hướng
        break;
    }
  } catch (err) {
    const errorMessage = err.message || 'Hành động thất bại. Vui lòng thử lại.';
    actionError.value = errorMessage; // Hiển thị lỗi trên PlanInfoPanel
    showSnackbar(errorMessage, 'error');
  } finally {
    // Reset tất cả các state loading
    isLoadingAction.value = false;
    isArchiving.value = null;
    isLeaving.value = false;
    removingMemberId.value = null;
    isDeleting.value = false;
    itemToProcess.value = null;
    confirmDialogType.value = '';
  }
};


// --- Logic Task (GIỮ NGUYÊN) ---
const openAddTaskDialog = () => {
    editingTask.value = null;
    taskForm.description = '';
    taskForm.deadlineTime = null;
    taskForm.taskDate = progressStore.selectedDate; // Tự động điền ngày đang chọn
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const openEditTaskDialog = (task) => {
    editingTask.value = { ...task };
    taskForm.description = task.description;
    taskForm.deadlineTime = task.deadlineTime || null;
    taskForm.taskDate = null; // Để null khi edit, user có thể chọn ngày mới
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const closeTaskDialog = () => {
    taskDialog.value = false;
    editingTask.value = null; 
};

const saveTask = async () => {
    if (!taskFormRef.value) return;
    const { valid } = await taskFormRef.value.validate();
    if (!valid) return;
    let time = null;
    if (taskForm.deadlineTime) {
        if (dayjs(taskForm.deadlineTime, 'HH:mm', true).isValid()) {
             time = dayjs(taskForm.deadlineTime, 'HH:mm').format('HH:mm');
        } else {
             taskDialogError.value = 'Định dạng Deadline không hợp lệ (HH:mm).';
             return;
        }
    }
     if (!editingTask.value && !taskForm.taskDate) {
         taskDialogError.value = 'Vui lòng chọn ngày thực hiện công việc.';
         return;
     }
     if (taskForm.taskDate && !dayjs(taskForm.taskDate, 'YYYY-MM-DD', true).isValid()) {
         taskDialogError.value = 'Định dạng ngày không hợp lệ (YYYY-MM-DD).';
         return;
     }
    const data = {
        description: taskForm.description,
        deadlineTime: time,
        taskDate: taskForm.taskDate || undefined // Chỉ gửi nếu có
    };
    taskDialogError.value = '';
    try {
        if (editingTask.value) {
            await planStore.updateTaskInCurrentPlan(editingTask.value.id, data, editingTask.value.taskDate);
            showSnackbar('Yêu cầu cập nhật công việc đã được gửi.', 'success');
        } else {
            await planStore.addTaskToCurrentPlan(data);
            showSnackbar('Yêu cầu thêm công việc đã được gửi.', 'success');
        }
        closeTaskDialog();
    } catch (e) {
        taskDialogError.value = planStore.taskError || 'Lỗi khi lưu công việc.';
        console.error("Save task error:", e)
    }
};

const confirmDeleteTask = (task) => {
    taskToDelete.value = { id: task.id, description: task.description, taskDate: task.taskDate };
    deleteTaskConfirmDialog.value = true;
};

const executeDeleteTask = async () => {
    if (!taskToDelete.value?.id || !taskToDelete.value?.taskDate) return;
    const desc = taskToDelete.value.description;
    const id = taskToDelete.value.id;
    const date = taskToDelete.value.taskDate;
    deleteTaskConfirmDialog.value = false;
    const taskBeingDeleted = { ...taskToDelete.value }; 
    taskToDelete.value = null;
    try {
        await planStore.deleteTaskFromCurrentPlan(id, date);
        showSnackbar(`Yêu cầu xóa "${desc}" đã được gửi.`, 'success');
    } catch (e) {
        showSnackbar(planStore.taskError || `Lỗi khi xóa "${desc}".`, 'error');
        console.error("Delete task error:", e);
        taskToDelete.value = taskBeingDeleted; 
    }
};

// --- Logic Check-in & Comment (GIỮ NGUYÊN) ---
const openCheckInModal = () => {
    if (planStore.isCurrentUserMember) {
         checkInToEdit.value = null; // Mở ở chế độ TẠO MỚI
         isCheckInModalOpen.value = true;
    } else {
         showSnackbar("Bạn phải là thành viên để check-in.", "error");
    }
};

const onCheckInModalClose = (value) => {
    if (!value) {
        isCheckInModalOpen.value = false;
        checkInToEdit.value = null; // Luôn reset khi modal đóng
    }
};

const openEditCheckInDialog = (checkInEvent) => {
    console.log("PlanDetailView: Opening dialog to EDIT check-in:", checkInEvent.id);
    checkInToEdit.value = checkInEvent; // Gán dữ liệu check-in cần sửa
    isCheckInModalOpen.value = true; // Mở cùng một modal
};

const openDeleteCheckInConfirm = (checkInEvent) => {
    checkInToDelete.value = checkInEvent;
    deleteCheckInConfirmDialog.value = true;
};

const closeDeleteCheckInConfirm = () => {
    checkInToDelete.value = null;
    deleteCheckInConfirmDialog.value = false;
};

const executeDeleteCheckIn = async () => {
    if (!checkInToDelete.value) return;
    
    isDeletingCheckIn.value = true;
    try {
        await progressStore.deleteCheckInAction(checkInToDelete.value.id);
        showSnackbar('Đã gửi yêu cầu xóa check-in.', 'success');
        closeDeleteCheckInConfirm();
    } catch (error) {
        showSnackbar(error.message || 'Lỗi khi xóa check-in.', 'error');
    } finally {
        isDeletingCheckIn.value = false;
    }
};

const openCommentDialog = (checkInEvent) => {
    console.log("PlanDetailView: Opening Progress Detail Modal for check-in:", checkInEvent.id);
    // Mở modal chi tiết/comment
    communityStore.selectProgress(checkInEvent);
};

// =================================================================
// ===           (SỬA) HOOKS ĐƯỢC DI CHUYỂN XUỐNG DƯỚI           ===
// =================================================================

// --- Watchers (Theo dõi route và ngày) ---
watch(() => route.params.shareableLink, (newLink, oldLink) => {
  if (newLink && newLink !== oldLink) {
    console.log(`PlanDetailView: Route changed to ${newLink}. Refetching data...`);
    unsubscribeWebSocketTopics(); 
    fetchPlanAndInitialData(newLink); 
  }
}, { immediate: true });

watch(selectedDate, (newDate, oldDate) => {
    if (newDate && newDate !== oldDate && planStore.currentPlan?.shareableLink) {
        console.log(`PlanDetailView: Selected date changed to ${newDate}. Fetching data for this date...`);
        fetchDataForSelectedDate(planStore.currentPlan.shareableLink, newDate); 
    }
});

// --- Hooks Vòng đời (onMounted, onUnmounted) ---
onMounted(() => {
    if (!websocketService.isConnected()) {
        websocketService.connect();
    }
});

onUnmounted(() => {
    console.log("PlanDetailView: Unmounting. Cleaning up stores and unsubscribing WebSocket.");
    planStore.clearCurrentPlanData();
    progressStore.clearPlanProgressData();
    unsubscribeWebSocketTopics();
});

</script>

<style scoped>
/* (Giữ nguyên CSS) */
.fill-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.w-100 {
  width: 100%;
}
.main-layout-row {
  max-height: 100%;
  height: 100%;
  flex-grow: 1; /* (MỚI) Đảm bảo row chiếm không gian */
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
.bg-transparent {
    background-color: transparent !important;
}
/* (Thêm) Sửa lỗi glass-effect nếu cần */
.glass-effect {
  background-color: rgba(var(--v-theme-surface-variant), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.3) !important;
}
</style>