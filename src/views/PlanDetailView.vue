<template>
  <v-container fluid class="fill-height">
    <div v-if="planStore.isLoading && !planStore.currentPlan" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Đang tải thông tin kế hoạch...</p>
    </div>
    <v-alert
      v-else-if="planStore.error && !planStore.currentPlan"
      type="error" variant="tonal" class="my-5" closable @click:close="planStore.error = null">
      {{ planStore.error }}
    </v-alert>

    <div v-else-if="planStore.currentPlan && !planStore.isCurrentUserMember">
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
          <TimelineDashboard 
            class="fill-height" 
            @open-check-in="openCheckInModal"
            @edit-check-in="openEditCheckInDialog"
            @delete-check-in="openDeleteCheckInConfirm"
            @comment-on-check-in="openCommentDialog"
          />
        </v-col>

        <v-col cols="12" md="4" class="sidebar-col d-flex flex-column">
          
          <div class="sidebar-row-info">
            <PlanInfoPanel
              class="fill-height"
              :link-copied="linkCopied"
              :link-copy-text="linkCopyText"
              :is-loading-action="planStore.isLoading" 
              :is-archiving="isArchiving" 
              :removing-member-id="memberToDelete?.userId" 
              :error="planStore.error" 
              @copy-invite-link="copyInviteLink"
              @archive-plan="confirmArchiveAction"
              @open-transfer-dialog="openTransferOwnershipDialog"
              @remove-member="confirmRemoveMember"
            />
          </div>

          <div class="sidebar-row-tasks">
            <DailyTaskList
              class="fill-height"
              @open-add-task="openAddTaskDialog"
              @open-edit-task="openEditTaskDialog"
              @confirm-delete-task="confirmDeleteTask"
            />
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

    <v-dialog v-model="deleteMemberConfirmDialog" persistent max-width="450px">
      </v-dialog>
    <v-dialog v-model="archiveConfirmDialog" persistent max-width="450px">
       </v-dialog>
    <v-dialog v-model="transferOwnershipDialog" persistent max-width="500px">
      </V-dialog>

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
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import { useCommunityStore } from '@/stores/community'; // <-- (THÊM) Import community store
import websocketService from '@/api/websocketService';
import dayjs from 'dayjs'; 

import PlanInfoPanel from '@/components/PlanInfoPanel.vue';
import TimelineDashboard from '@/components/TimelineDashboard.vue';
import DailyTaskList from '@/components/DailyTaskList.vue';
import CheckInModal from '@/components/CheckInModal.vue'; 
import ProgressDetailModal from '@/components/ProgressDetailModal.vue'; // <-- (THÊM) Import modal chi tiết

import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VList, VListItem, VListItemTitle, VListItemSubtitle, VDivider, VBtn, VAlert, VProgressCircular, VIcon, VChip, VSnackbar,
  VCardActions, VSpacer, VDialog, VForm, VTextarea, VTextField,
  VSelect
} from 'vuetify/components';

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const authStore = useAuthStore();
const progressStore = useProgressStore();
const communityStore = useCommunityStore(); // <-- (THÊM) Khởi tạo community store

// (State gốc giữ nguyên)
const isJoining = ref(false);
const joinError = ref('');
const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const taskDialog = ref(false);
const editingTask = ref(null);
const taskFormRef = ref(null);
const taskForm = reactive({ description: '', deadlineTime: null, taskDate: null });
const taskDialogError = ref('');
const deleteTaskConfirmDialog = ref(false);
const taskToDelete = ref(null);

const deleteMemberConfirmDialog = ref(false);
const memberToDelete = ref(null);

const archiveConfirmDialog = ref(false);
const isArchiving = ref(null); 

const transferOwnershipDialog = ref(false);
const selectedNewOwnerId = ref(null);
const transferOwnershipError = ref('');

// --- (STATE MỚI CHO CHECK-IN) ---
const isCheckInModalOpen = ref(false);
const checkInToEdit = ref(null); // (Mới) Dùng để phân biệt Sửa và Tạo mới

const deleteCheckInConfirmDialog = ref(false); // (Mới)
const checkInToDelete = ref(null); // (Mới)
const isDeletingCheckIn = ref(false); // (Mới)
// --- (KẾT THÚC STATE MỚI) ---


const progressTopic = ref('');
const taskTopic = ref('');
const planDetailsTopic = ref('');

// (Tất cả các hàm logic gốc: fetch, rules, computed, watch, v.v. giữ nguyên)
// ...

const unsubscribeWebSocketTopics = () => {
    if (progressTopic.value) websocketService.unsubscribe(progressTopic.value);
    if (taskTopic.value) websocketService.unsubscribe(taskTopic.value);
    if (planDetailsTopic.value) websocketService.unsubscribe(planDetailsTopic.value);
    progressTopic.value = '';
    taskTopic.value = '';
    planDetailsTopic.value = '';
    console.log(`WS: Unsubscribed from plan topics.`);
};

const fetchPlanAndInitialData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    await planStore.fetchPlan(shareableLink);
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        setupWebSocket(shareableLink);
    } else if (planStore.currentPlan && !planStore.isCurrentUserMember) {
        console.log("PlanDetailView: User is not a member yet.");
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    console.log(`PlanDetailView: Fetching timeline and tasks for ${date}...`);
    progressStore.timelineError = null;
    planStore.dailyTasksError = null;
    await Promise.allSettled([ 
        progressStore.fetchTimeline(shareableLink, date),
        planStore.fetchDailyTasks(shareableLink, date)
    ]);
     console.log(`PlanDetailView: Finished fetching data for ${date}.`);
};

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  date: value => !value || dayjs(value, 'YYYY-MM-DD', true).isValid() || 'Định dạng ngày YYYY-MM-DD.',
};

const selectedDate = computed(() => progressStore.getSelectedDate);
const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    return planStore.currentPlan.members.filter(member => member.role !== 'OWNER' && member.userId !== authStore.currentUser.id);
}); 

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

    subscribeAndLog(progressTopic, `/topic/plan/${shareableLink}/progress`, handleProgressUpdate);
    subscribeAndLog(taskTopic, `/topic/plan/${shareableLink}/tasks`, handleTaskUpdate);
    subscribeAndLog(planDetailsTopic, `/topic/plan/${shareableLink}/details`, handlePlanDetailsUpdate);
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
    // ... (Logic gốc của bạn giữ nguyên)
    console.log("WS Received plan details update:", message);
    if (!planStore.currentPlan) return;
    const { type, member, userId, status, displayStatus, title, description, durationInDays, dailyGoal, startDate, endDate, oldOwnerUserId, newOwnerUserId } = message;
    let needsTimelineRefetch = false;
    switch(type) {
        case 'MEMBER_JOINED':
            if (planStore.currentPlan.members && !planStore.currentPlan.members.some(m => m.userId === member?.userId)) {
                planStore.currentPlan.members.push(member);
                if (typeof planStore.currentPlan.memberCount === 'number') planStore.currentPlan.memberCount++;
                console.log("RT: Added Member:", member?.userEmail);
                needsTimelineRefetch = true;
            }
            break;
        case 'MEMBER_REMOVED':
            if (planStore.currentPlan.members) {
                const index = planStore.currentPlan.members.findIndex(m => m.userId === userId);
                if (index !== -1) {
                    planStore.currentPlan.members.splice(index, 1);
                    if (typeof planStore.currentPlan.memberCount === 'number' && planStore.currentPlan.memberCount > 0) planStore.currentPlan.memberCount--;
                    console.log("RT: Removed Member:", userId);
                    needsTimelineRefetch = true;
                }
            }
            break;
        case 'STATUS_CHANGED':
            if (status !== undefined) planStore.currentPlan.status = status;
            if (displayStatus !== undefined) planStore.currentPlan.displayStatus = displayStatus;
            console.log("RT: Status Changed:", status);
            break;
        case 'PLAN_INFO_UPDATED':
            if (title !== undefined) planStore.currentPlan.title = title;
            if (description !== undefined) planStore.currentPlan.description = description;
            if (durationInDays !== undefined) planStore.currentPlan.durationInDays = durationInDays;
            if (dailyGoal !== undefined) planStore.currentPlan.dailyGoal = dailyGoal;
            if (startDate !== undefined) planStore.currentPlan.startDate = startDate;
            if (endDate !== undefined) planStore.currentPlan.endDate = endDate;
            console.log("RT: Plan Info Updated.");
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

const handleJoinPlan = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
    const link = route.params.shareableLink;
    if (!link) { joinError.value="Mã mời không hợp lệ."; return; }
    isJoining.value=true;
    joinError.value='';
    try {
        await planStore.joinCurrentPlan(link);
        await fetchPlanAndInitialData(link);
    } catch (e) {
        joinError.value = planStore.error || 'Lỗi tham gia.';
        console.error("Join plan error:", e);
    } finally {
        isJoining.value=false;
    }
};

const copyInviteLink = () => {
    // ... (Logic gốc của bạn giữ nguyên)
    if(linkCopied.value || !planStore.currentPlan?.shareableLink) return;
    const inviteUrl = `${window.location.origin}/plan/${planStore.currentPlan.shareableLink}`;
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

// --- (Logic CRUD Task - Giữ nguyên) ---
const openAddTaskDialog = () => {
    // ... (Logic gốc của bạn giữ nguyên)
    editingTask.value = null;
    taskForm.description = '';
    taskForm.deadlineTime = null;
    taskForm.taskDate = progressStore.selectedDate; 
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const openEditTaskDialog = (task) => {
    // ... (Logic gốc của bạn giữ nguyên)
    editingTask.value = { ...task };
    taskForm.description = task.description;
    taskForm.deadlineTime = task.deadlineTime || null;
    taskForm.taskDate = null; 
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const closeTaskDialog = () => {
    // ... (Logic gốc của bạn giữ nguyên)
    taskDialog.value = false;
    editingTask.value = null; 
};

const saveTask = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
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
        taskDate: taskForm.taskDate || undefined 
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
    // ... (Logic gốc của bạn giữ nguyên)
    taskToDelete.value = { id: task.id, description: task.description, taskDate: task.taskDate };
    deleteTaskConfirmDialog.value = true;
};

const executeDeleteTask = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
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

// --- (Logic Quản lý Plan/Member - Giữ nguyên) ---
const confirmRemoveMember = (member) => {
    // ... (Logic gốc của bạn giữ nguyên)
    memberToDelete.value = member;
    deleteMemberConfirmDialog.value = true;
};
const executeRemoveMember = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
    if (!memberToDelete.value?.userId) return;
    const name = memberToDelete.value.userFullName;
    const id = memberToDelete.value.userId;
    deleteMemberConfirmDialog.value = false;
    const memberBeingRemoved = { ...memberToDelete.value };
    memberToDelete.value = null; 
    try {
        await planStore.removeMemberFromCurrentPlan(id);
        showSnackbar(`Yêu cầu loại bỏ ${name} đã được gửi.`, 'success');
    } catch (e) {
        console.error("Remove member error:", e);
        showSnackbar(planStore.error || `Lỗi khi loại bỏ ${name}.`, 'error');
        memberToDelete.value = memberBeingRemoved; 
    }
};
const confirmArchiveAction = (archive) => {
    // ... (Logic gốc của bạn giữ nguyên)
    isArchiving.value = archive; 
    archiveConfirmDialog.value = true;
};
const executeArchiveAction = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
    archiveConfirmDialog.value = false;
    const currentlyArchiving = isArchiving.value; 
    isArchiving.value = null; 
    try {
        let msg = '';
        if (currentlyArchiving) {
            await planStore.archiveCurrentPlan();
            msg = 'Yêu cầu lưu trữ kế hoạch đã được gửi.';
            showSnackbar(msg, 'info');
        } else {
            await planStore.unarchiveCurrentPlan();
            msg = 'Yêu cầu khôi phục kế hoạch đã được gửi.';
            showSnackbar(msg, 'success');
        }
    } catch (e) {
        showSnackbar(planStore.error || `Lỗi khi ${currentlyArchiving ? 'lưu trữ' : 'khôi phục'}.`, 'error');
        console.error("Archive/Unarchive error:", e);
        isArchiving.value = currentlyArchiving; 
    }
};
const openTransferOwnershipDialog = () => {
    // ... (Logic gốc của bạn giữ nguyên)
    selectedNewOwnerId.value = null;
    transferOwnershipError.value = '';
    transferOwnershipDialog.value = true;
};
const closeTransferOwnershipDialog = () => {
    // ... (Logic gốc của bạn giữ nguyên)
    transferOwnershipDialog.value = false;
};
const confirmTransferOwnership = async () => {
    // ... (Logic gốc của bạn giữ nguyên)
    if (!selectedNewOwnerId.value) {
        transferOwnershipError.value = "Vui lòng chọn một thành viên.";
        return;
    }
    transferOwnershipError.value = '';
    try {
        await planStore.transferPlanOwnership(selectedNewOwnerId.value);
        showSnackbar('Yêu cầu chuyển quyền sở hữu đã được gửi.', 'success');
        closeTransferOwnershipDialog();
    } catch (error) {
       transferOwnershipError.value = planStore.error || 'Có lỗi xảy ra, vui lòng thử lại.';
       console.error("Transfer ownership error:", error);
    }
};


// --- (CẬP NHẬT LOGIC CHECK-IN) ---

// (Hàm này giờ chỉ mở modal ở chế độ TẠO MỚI)
const openCheckInModal = () => {
    // (MỚI) Logic fetch đã bị XÓA. 
    // CheckInModal giờ sẽ tự fetch.
    const todayStr = dayjs().format('YYYY-MM-DD');

    // (Rút gọn) Chỉ kiểm tra xem có phải là thành viên không.
    // Việc kiểm tra "có task hay không" sẽ do modal tự xử lý.
    if (planStore.isCurrentUserMember) {
         checkInToEdit.value = null; 
         isCheckInModalOpen.value = true;
    } else {
         showSnackbar("Bạn phải là thành viên để check-in.", "error");
    }
};

// (MỚI) Hàm này được gọi khi CheckInModal đóng
const onCheckInModalClose = (value) => {
    if (!value) {
        isCheckInModalOpen.value = false;
        checkInToEdit.value = null; // Luôn reset khi modal đóng
    }
};

// (MỚI) Hàm này mở modal ở chế độ SỬA
const openEditCheckInDialog = (checkInEvent) => {
    console.log("PlanDetailView: Opening dialog to EDIT check-in:", checkInEvent.id);
    checkInToEdit.value = checkInEvent; // Gán dữ liệu check-in cần sửa
    isCheckInModalOpen.value = true; // Mở cùng một modal
};

// (MỚI) Hàm này mở dialog XÓA CHECK-IN
const openDeleteCheckInConfirm = (checkInEvent) => {
    checkInToDelete.value = checkInEvent;
    deleteCheckInConfirmDialog.value = true;
};

// (MỚI) Hàm này đóng dialog XÓA CHECK-IN
const closeDeleteCheckInConfirm = () => {
    checkInToDelete.value = null;
    deleteCheckInConfirmDialog.value = false;
};

// (MỚI) Hàm này thực thi XÓA CHECK-IN
const executeDeleteCheckIn = async () => {
    if (!checkInToDelete.value) return;
    
    isDeletingCheckIn.value = true;
    try {
        // Gọi action mới trong progressStore
        await progressStore.deleteCheckInAction(checkInToDelete.value.id);
        showSnackbar('Đã gửi yêu cầu xóa check-in.', 'success');
        // WebSocket sẽ tự động cập nhật UI
        closeDeleteCheckInConfirm();
    } catch (error) {
        showSnackbar(error || 'Lỗi khi xóa check-in.', 'error');
    } finally {
        isDeletingCheckIn.value = false;
    }
};

// ================== START: CODE ĐƯỢC SỬA ==================
// (SỬA) Hàm này xử lý BÌNH LUẬN
const openCommentDialog = (checkInEvent) => {
    // (SỬA) Thay vì hiển thị snackbar, chúng ta gọi communityStore
    console.log("PlanDetailView: Opening Progress Detail Modal for check-in:", checkInEvent.id);
    
    // Dữ liệu 'checkInEvent' (chính là 'progress' chi tiết)
    // được đưa vào communityStore.
    // ProgressDetailModal sẽ tự động mở vì nó đang theo dõi store này.
    communityStore.selectProgress(checkInEvent);
};
// =================== END: CODE ĐƯỢC SỬA ===================

</script>

<style scoped>
/* (CSS gốc của bạn giữ nguyên) */
.fill-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Sửa CSS */
.main-layout-row {
  max-height: 100%;
  height: 100%;
}

.main-layout-row > .v-col {
  height: 100%;
  padding-top: 0; 
  padding-bottom: 0;
}

/* COL 1: CHO TIMELINE */
.main-content-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; 
}

/* COL 2: CHO INFO + TASKS */
.sidebar-col {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0; 
  padding-left: 12px; 
}

/* ROW 2.1: INFO PANEL */
.sidebar-row-info {
  flex-grow: 0; 
  flex-shrink: 0; 
  margin-bottom: 16px; 
  display: flex;
  flex-direction: column;
}

/* ROW 2.2: TASK LIST */
.sidebar-row-tasks {
  flex-grow: 1; 
  min-height: 0; 
  display: flex;
  flex-direction: column;
}


.bg-transparent {
    background-color: transparent !important;
}
</style>