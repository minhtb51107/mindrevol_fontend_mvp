<template>
  <v-container fluid>
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
      <v-card class="text-center pa-6 elevation-2 mx-auto" max-width="600">
        <v-card-item>
            <v-icon icon="mdi-account-group-outline" size="48" color="primary" class="mb-4"></v-icon>
            <v-card-title class="text-h5 mb-2">Bạn được mời tham gia!</v-card-title>
        </v-card-item>
        <v-card-text>
            <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2>
            <p class="text-medium-emphasis mb-5">{{ planStore.currentPlan.description }}</p>
            <v-list lines="one" density="compact" class="text-left mx-auto" max-width="400">
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

    <div v-else-if="planStore.currentPlan">
      <v-row class="mb-4">
           <v-col cols="12" md="3"></v-col> <v-col cols="12" md="9">
               <DateSelector />
               </v-col>
       </v-row>

      <v-row>
        <v-col cols="12" md="3">
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
          </v-col>

        <v-col cols="12" md="6">
          <TimelineDashboard class="fill-height" />
          </v-col>

        <v-col cols="12" md="3">
          <DailyTaskList
            class="fill-height"
            @open-add-task="openAddTaskDialog"
            @open-edit-task="openEditTaskDialog"
            @confirm-delete-task="confirmDeleteTask"
          />
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
      <v-card>
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
          <v-btn color="grey-darken-1" variant="text" @click="closeTaskDialog" :disabled="planStore.isTaskLoading">Hủy</v-btn>
          <v-btn color="primary" variant="flat" @click="saveTask" :loading="planStore.isTaskLoading">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTaskConfirmDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa công việc "<span class="font-weight-medium">{{ taskToDelete?.description }}</span>" của ngày {{ taskToDelete?.taskDate }}? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteTaskConfirmDialog = false" :disabled="planStore.isTaskLoading">Hủy</v-btn>
          <v-btn color="error" text @click="executeDeleteTask" :loading="planStore.isTaskLoading">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteMemberConfirmDialog" persistent max-width="450px">
      <v-card>
        <v-card-title class="text-h6">Xác nhận loại bỏ thành viên</v-card-title>
        <v-card-text> Bạn có chắc chắn muốn loại bỏ <span class="font-weight-medium">{{ memberToDelete?.userFullName }} ({{ memberToDelete?.userEmail }})</span> khỏi kế hoạch này không? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteMemberConfirmDialog = false" :disabled="planStore.isLoading">Hủy</v-btn>
          <v-btn color="error" text @click="executeRemoveMember" :loading="planStore.isLoading">Loại bỏ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="archiveConfirmDialog" persistent max-width="450px">
       <v-card>
         <v-card-title class="text-h6"> Xác nhận {{ isArchiving ? 'lưu trữ' : 'khôi phục' }} </v-card-title>
         <v-card-text> Bạn có chắc chắn muốn {{ isArchiving ? 'lưu trữ' : 'khôi phục' }} kế hoạch "<span class="font-weight-medium">{{ planStore.currentPlan?.title }}</span>"? <span v-if="isArchiving"> Kế hoạch sẽ bị ẩn khỏi danh sách chính và dashboard.</span> <span v-else> Kế hoạch sẽ trở lại trạng thái hoạt động.</span> </v-card-text>
         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn color="grey-darken-1" text @click="archiveConfirmDialog = false" :disabled="planStore.isLoading">Hủy</v-btn>
           <v-btn :color="isArchiving ? 'orange' : 'blue'" text @click="executeArchiveAction" :loading="planStore.isLoading"> {{ isArchiving ? 'Lưu trữ' : 'Khôi phục' }} </v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>

    <v-dialog v-model="transferOwnershipDialog" persistent max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Chuyển quyền sở hữu kế hoạch</v-card-title>
        <v-card-text>
          <p class="mb-4">Chọn thành viên bạn muốn chuyển quyền sở hữu kế hoạch này. Bạn sẽ trở thành thành viên bình thường sau khi chuyển.</p>
          <v-select
            v-model="selectedNewOwnerId"
            :items="otherMembers"
            item-title="userFullName"
            item-value="userId"
            label="Chọn chủ sở hữu mới *"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            :error-messages="transferOwnershipError"
            prepend-inner-icon="mdi-account-switch-outline"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.userEmail"></v-list-item>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="closeTransferOwnershipDialog" :disabled="planStore.isLoading">Hủy</v-btn>
          <v-btn color="deep-purple" text @click="confirmTransferOwnership" :loading="planStore.isLoading" :disabled="!selectedNewOwnerId">Xác nhận chuyển</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-fab
          v-if="planStore.currentPlan && planStore.isCurrentUserMember"
          icon="mdi-check-circle-outline"
          location="bottom end"
          size="large"
          color="success"
          app
          appear
          class="mb-4 mr-4"
          @click="openCheckInModal"
      >
        Check-in
      </v-fab>

      <CheckInModal v-model="isCheckInModalOpen" />


  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import { useProgressStore } from '@/stores/progress';
import websocketService from '@/api/websocketService';
import dayjs from 'dayjs'; // Import dayjs

// Import các components con
import DateSelector from '@/components/DateSelector.vue';
import PlanInfoPanel from '@/components/PlanInfoPanel.vue';
import TimelineDashboard from '@/components/TimelineDashboard.vue';
import DailyTaskList from '@/components/DailyTaskList.vue';
import CheckInModal from '@/components/CheckInModal.vue'; // Import CheckInModal

// Import Vuetify components đầy đủ
import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VList, VListItem, VListItemTitle, VListItemSubtitle, VListSubheader, VDivider, VBtn, VAlert, VProgressCircular, VIcon, VChip, VSnackbar,
  VCardActions, VSpacer, VDialog, VForm, VTextarea, VTextField,
  VSelect, VFab // Thêm VFab
} from 'vuetify/components';

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const authStore = useAuthStore();
const progressStore = useProgressStore();

// --- Component States ---
const isJoining = ref(false);
const joinError = ref('');
const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Task Dialog States
const taskDialog = ref(false);
const editingTask = ref(null);
const taskFormRef = ref(null);
const taskForm = reactive({ description: '', deadlineTime: null, taskDate: null });
const taskDialogError = ref('');
const deleteTaskConfirmDialog = ref(false);
const taskToDelete = ref(null);

// Member Dialog States
const deleteMemberConfirmDialog = ref(false);
const memberToDelete = ref(null);

// Archive Dialog States
const archiveConfirmDialog = ref(false);
const isArchiving = ref(null); // null ban đầu, true khi archiving, false khi unarchiving

// Transfer Ownership Dialog States
const transferOwnershipDialog = ref(false);
const selectedNewOwnerId = ref(null);
const transferOwnershipError = ref('');

// CheckIn Modal State
const isCheckInModalOpen = ref(false);


// WebSocket topic refs
const progressTopic = ref('');
const taskTopic = ref('');
const planDetailsTopic = ref('');

// ===================================================================
// SỬA LỖI: Di chuyển TẤT CẢ các hàm được gọi bởi 'watch'
// lên TRƯỚC khi 'watch' được khai báo.
// ===================================================================

const unsubscribeWebSocketTopics = () => {
    if (progressTopic.value) websocketService.unsubscribe(progressTopic.value);
    if (taskTopic.value) websocketService.unsubscribe(taskTopic.value);
    if (planDetailsTopic.value) websocketService.unsubscribe(planDetailsTopic.value);
    progressTopic.value = '';
    taskTopic.value = '';
    planDetailsTopic.value = '';
    console.log(`WS: Unsubscribed from plan topics.`);
};

// --- Data Fetching Logic (ĐÃ DI CHUYỂN LÊN TRÊN) ---
const fetchPlanAndInitialData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    await planStore.fetchPlan(shareableLink);
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        // Fetch data cho ngày hiện tại (mặc định từ progressStore)
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        setupWebSocket(shareableLink);
    } else if (planStore.currentPlan && !planStore.isCurrentUserMember) {
        console.log("PlanDetailView: User is not a member yet.");
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    console.log(`PlanDetailView: Fetching timeline and tasks for ${date}...`);
    // Reset lỗi trước khi fetch
    progressStore.timelineError = null;
    planStore.dailyTasksError = null;
    await Promise.allSettled([ // Dùng allSettled để không dừng nếu 1 cái lỗi
        progressStore.fetchTimeline(shareableLink, date),
        planStore.fetchDailyTasks(shareableLink, date)
    ]);
     console.log(`PlanDetailView: Finished fetching data for ${date}.`);
};
// ===================================================================

// Validation Rules
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  date: value => !value || dayjs(value, 'YYYY-MM-DD', true).isValid() || 'Định dạng ngày YYYY-MM-DD.',
};

// --- Computed Properties ---
const selectedDate = computed(() => progressStore.getSelectedDate);
const otherMembers = computed(() => { /* ... giữ nguyên ... */ }); // Giữ computed này
// computed displayStatusText, statusColor đã chuyển vào PlanInfoPanel


// --- Watchers ---
// ✅ Bây giờ các hàm này đã được định nghĩa ở trên, gọi immediate là an toàn
watch(() => route.params.shareableLink, (newLink, oldLink) => {
  if (newLink && newLink !== oldLink) {
    console.log(`PlanDetailView: Route changed to ${newLink}. Refetching data...`);
    unsubscribeWebSocketTopics(); 
    fetchPlanAndInitialData(newLink); // ✅ An toàn
  }
}, { immediate: true });

watch(selectedDate, (newDate, oldDate) => {
    if (newDate && newDate !== oldDate && planStore.currentPlan?.shareableLink) {
        console.log(`PlanDetailView: Selected date changed to ${newDate}. Fetching data for this date...`);
        fetchDataForSelectedDate(planStore.currentPlan.shareableLink, newDate); // ✅ An toàn
    }
});


// --- Lifecycle Hooks ---
onMounted(() => {
    if (!websocketService.isConnected()) {
        websocketService.connect();
    }
    // Logic fetch đã chuyển vào watch route param
});

onUnmounted(() => {
    console.log("PlanDetailView: Unmounting. Cleaning up stores and unsubscribing WebSocket.");
    planStore.clearCurrentPlanData();
    progressStore.clearPlanProgressData();
    unsubscribeWebSocketTopics();
});

// ⛔ ĐÃ XÓA CÁC HÀM FETCH Ở ĐÂY VÌ ĐÃ CHUYỂN LÊN TRÊN ⛔

// --- WebSocket Setup & Handlers ---
const setupWebSocket = (shareableLink) => { /* ... giữ nguyên như trước ... */
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


const handleProgressUpdate = (message) => { /* ... giữ nguyên gọi progressStore.handleWebSocketUpdate ... */
    console.log("WS Received progress update:", message);
    progressStore.handleWebSocketUpdate(message);
};

const handleTaskUpdate = (message) => { /* ... giữ nguyên gọi planStore.handleTaskWebSocketUpdate ... */
    console.log("WS Received task update:", message);
    planStore.handleTaskWebSocketUpdate(message, progressStore.selectedDate);
};

const handlePlanDetailsUpdate = (message) => { /* ... giữ nguyên như trước ... */
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
            // Cần cập nhật lại DateSelector range sau
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


// --- Action Handlers ---
const handleJoinPlan = async () => {
    const link = route.params.shareableLink;
    if (!link) { joinError.value="Mã mời không hợp lệ."; return; }
    isJoining.value=true;
    joinError.value='';
    try {
        await planStore.joinCurrentPlan(link);
        // Sau khi join thành công, fetch data ban đầu và setup WS
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
    // Tạo link đầy đủ
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

// --- Task Dialog Logic ---
const openAddTaskDialog = () => {
    editingTask.value = null;
    taskForm.description = '';
    taskForm.deadlineTime = null;
    taskForm.taskDate = progressStore.selectedDate; // Lấy ngày đang chọn
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const openEditTaskDialog = (task) => {
    editingTask.value = { ...task };
    taskForm.description = task.description;
    taskForm.deadlineTime = task.deadlineTime || null;
    taskForm.taskDate = null; // Để trống khi sửa, chỉ nhập nếu muốn chuyển ngày
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const closeTaskDialog = () => {
    taskDialog.value = false;
    editingTask.value = null; // Reset task đang sửa
    // Không reset taskForm ở đây để giữ lại giá trị nếu user chỉ đóng tạm
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
        taskDate: taskForm.taskDate || undefined // Gửi undefined nếu không nhập ngày mới khi sửa
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
    const taskBeingDeleted = { ...taskToDelete.value }; // Copy data before resetting
    taskToDelete.value = null;
    try {
        await planStore.deleteTaskFromCurrentPlan(id, date);
        showSnackbar(`Yêu cầu xóa "${desc}" đã được gửi.`, 'success');
    } catch (e) {
        showSnackbar(planStore.taskError || `Lỗi khi xóa "${desc}".`, 'error');
        console.error("Delete task error:", e);
        taskToDelete.value = taskBeingDeleted; // Phục hồi lại để user có thể thử lại nếu muốn
    }
};

// --- Member Dialog Logic ---
const confirmRemoveMember = (member) => {
    memberToDelete.value = member;
    deleteMemberConfirmDialog.value = true;
};
const executeRemoveMember = async () => {
    if (!memberToDelete.value?.userId) return;
    const name = memberToDelete.value.userFullName;
    const id = memberToDelete.value.userId;
    deleteMemberConfirmDialog.value = false;
    const memberBeingRemoved = { ...memberToDelete.value };
    memberToDelete.value = null; // Clear selection
    try {
        await planStore.removeMemberFromCurrentPlan(id);
        showSnackbar(`Yêu cầu loại bỏ ${name} đã được gửi.`, 'success');
    } catch (e) {
        console.error("Remove member error:", e);
        showSnackbar(planStore.error || `Lỗi khi loại bỏ ${name}.`, 'error');
        memberToDelete.value = memberBeingRemoved; // Restore for retry if needed
    }
};

// --- Archive Dialog Logic ---
const confirmArchiveAction = (archive) => {
    isArchiving.value = archive; // Set trạng thái là đang archive hay unarchive
    archiveConfirmDialog.value = true;
};
const executeArchiveAction = async () => {
    archiveConfirmDialog.value = false;
    const currentlyArchiving = isArchiving.value; // Lưu lại trạng thái action
    isArchiving.value = null; // Reset trạng thái loading UI riêng
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
        isArchiving.value = currentlyArchiving; // Restore state if failed
    }
};

// --- Transfer Ownership Logic ---
const openTransferOwnershipDialog = () => {
    selectedNewOwnerId.value = null;
    transferOwnershipError.value = '';
    transferOwnershipDialog.value = true;
};
const closeTransferOwnershipDialog = () => {
    transferOwnershipDialog.value = false;
};
const confirmTransferOwnership = async () => {
    if (!selectedNewOwnerId.value) {
        transferOwnershipError.value = "Vui lòng chọn một thành viên.";
        return;
    }
    transferOwnershipError.value = '';
    try {
        await planStore.transferPlanOwnership(selectedNewOwnerId.value);
        showSnackbar('Yêu cầu chuyển quyền sở hữu đã được gửi.', 'success');
        closeTransferOwnershipDialog();
        // UI cập nhật qua WebSocket
    } catch (error) {
       transferOwnershipError.value = planStore.error || 'Có lỗi xảy ra, vui lòng thử lại.';
       console.error("Transfer ownership error:", error);
    }
};

// --- CheckIn Modal Logic ---
const openCheckInModal = () => {
    // Kiểm tra xem có task nào trong ngày hôm nay không
    // Cần lấy task của ngày hiện tại (today) thay vì ngày đang chọn (selectedDate)
    const todayStr = dayjs().format('YYYY-MM-DD');
    // Nếu ngày đang chọn là hôm nay, dùng task đã load sẵn
     if (selectedDate.value === todayStr && !planStore.isLoadingDailyTasks) {
          if (!planStore.currentDailyTasks || planStore.currentDailyTasks.length === 0) {
              showSnackbar("Không có công việc nào được định nghĩa cho hôm nay để check-in.", "info");
              return;
          }
         isCheckInModalOpen.value = true;
     } else if (planStore.currentPlan?.shareableLink) {
         // Nếu đang xem ngày khác, cần fetch task của hôm nay trước khi mở modal
         console.log("Fetching today's tasks before opening CheckInModal...");
         planStore.fetchDailyTasks(planStore.currentPlan.shareableLink, todayStr)
             .then(() => {
                 if (!planStore.currentDailyTasks || planStore.currentDailyTasks.length === 0) {
                     showSnackbar("Không có công việc nào được định nghĩa cho hôm nay để check-in.", "info");
                 } else {
                      isCheckInModalOpen.value = true;
                 }
             })
             .catch(err => {
                 showSnackbar("Lỗi khi tải danh sách công việc hôm nay.", "error");
             });
     }

};

// --- Test function to change date ---
// const changeDateForTesting = (daysToAdd) => {
//     const newDate = dayjs(progressStore.selectedDate).add(daysToAdd, 'day').format('YYYY-MM-DD');
//     progressStore.setSelectedDate(newDate);
// };

</script>

<style scoped>
.fill-height {
  height: 100%;
  /* Thêm display flex để các card con có thể tự co dãn */
   display: flex;
   flex-direction: column;
}
/* Style cho container chính để tránh thanh cuộn toàn trang */
.v-container {
    /* Có thể giới hạn chiều cao max nếu cần */
    /* max-height: calc(100vh - 64px); /* Giả sử header cao 64px */
    /* overflow-y: hidden; */ /* Ngăn cuộn toàn trang */
}
/* Đảm bảo các cột có chiều cao tối thiểu */
.v-col {
    min-height: 150px; /* Hoặc giá trị phù hợp */
}

</style>