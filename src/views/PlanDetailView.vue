<template>
  <v-container>
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
        <v-card class="text-center pa-6 elevation-2">
            <v-card-item> <v-icon icon="mdi-account-group-outline" size="48" color="primary" class="mb-4"></v-icon> <v-card-title class="text-h5 mb-2">Bạn được mời tham gia!</v-card-title> </v-card-item>  
             <v-card-text> <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2> <p class="text-medium-emphasis mb-5">{{ planStore.currentPlan.description }}</p> <v-list lines="one" density="compact" class="text-left mx-auto" max-width="400"> <v-list-item prepend-icon="mdi-account-outline"> <v-list-item-title>Người tạo:</v-list-item-title> <v-list-item-subtitle>{{ planStore.currentPlan.creatorFullName }}</v-list-item-subtitle> </v-list-item> <v-divider inset></v-divider> <v-list-item prepend-icon="mdi-calendar-clock-outline"> <v-list-item-title>Thời lượng:</v-list-item-title> <v-list-item-subtitle>{{ planStore.currentPlan.durationInDays }} ngày</v-list-item-subtitle> </v-list-item> <v-divider inset></v-divider> <v-list-item prepend-icon="mdi-account-multiple-outline"> <v-list-item-title>Đã có:</v-list-item-title> <v-list-item-subtitle>{{ planStore.currentPlan.memberCount }} thành viên</v-list-item-subtitle> </v-list-item> </v-list> <v-btn @click="handleJoinPlan" color="primary" size="large" :loading="isJoining" :disabled="isJoining" class="mt-6" prepend-icon="mdi-account-plus-outline"> Tham gia ngay </v-btn> <v-alert v-if="joinError" type="error" density="compact" class="mt-4 mx-auto" max-width="400" closable @click:close="joinError = ''"> {{ joinError }} </v-alert> </v-card-text>
        </v-card>
    </div>

    <div v-else-if="planStore.currentPlan">
      <v-row g-4>
        <v-col cols="12" lg="4">
           <v-card class="mb-4 elevation-1">
                <v-card-item>
                   <v-card-title class="text-h6">{{ planStore.currentPlan.title }}</v-card-title>
                   <v-card-subtitle>{{ planStore.currentPlan.description }}</v-card-subtitle>
                </v-card-item>
                 <v-divider></v-divider>
                <v-card-text>
                  <v-list density="compact"> <v-list-item prepend-icon="mdi-calendar-check-outline" title="Bắt đầu" :subtitle="planStore.currentPlan.startDate"></v-list-item> <v-list-item prepend-icon="mdi-calendar-end-outline" title="Kết thúc" :subtitle="planStore.currentPlan.endDate"></v-list-item> <v-list-item prepend-icon="mdi-flag-outline" title="Mục tiêu ngày" :subtitle="planStore.currentPlan.dailyGoal || 'Chưa có'"></v-list-item> <v-list-item prepend-icon="mdi-progress-check" title="Trạng thái"> <template v-slot:subtitle> <v-chip :color="statusColor" size="small" label>{{ displayStatusText }}</v-chip> </template> </v-list-item> </v-list>
                  <v-btn @click="copyInviteLink" variant="outlined" color="success" block class="mt-3" :prepend-icon="linkCopied ? 'mdi-check' : 'mdi-clipboard-check-outline'" :disabled="linkCopied"> {{ linkCopyText }} </v-btn>
                  <v-btn v-if="planStore.isCurrentUserOwner && planStore.currentPlan.status !== 'ARCHIVED'" @click="confirmArchiveAction(true)" variant="outlined" color="orange" block class="mt-2" prepend-icon="mdi-archive-arrow-down-outline" :loading="planStore.isLoading && isArchiving === true" :disabled="planStore.isLoading"> Lưu trữ Kế hoạch </v-btn>
                  <v-btn v-if="planStore.isCurrentUserOwner && planStore.currentPlan.status === 'ARCHIVED'" @click="confirmArchiveAction(false)" variant="outlined" color="blue" block class="mt-2" prepend-icon="mdi-archive-arrow-up-outline" :loading="planStore.isLoading && isArchiving === false" :disabled="planStore.isLoading"> Khôi phục Kế hoạch </v-btn>
                  <v-btn
                      v-if="planStore.isCurrentUserOwner && otherMembers.length > 0"
                      @click="openTransferOwnershipDialog"
                      variant="outlined" color="deep-purple" block class="mt-2" prepend-icon="mdi-crown-outline"
                      :disabled="planStore.isLoading"
                  >
                      Chuyển quyền sở hữu
                  </v-btn>
                  </v-card-text>
              </v-card>

              <v-card class="mb-4 elevation-1">
                <v-list-subheader>Công việc hàng ngày ({{ planStore.currentPlanTasks.length }})</v-list-subheader>
                <v-list lines="two" density="compact" class="pa-0">
                    <draggable :list="draggableTasks" item-key="id" ghost-class="ghost-item" handle=".drag-handle" :disabled="!planStore.isCurrentUserOwner || planStore.isTaskLoading" @end="onDragEnd">    
                        <template #item="{ element: task, index }">
                            <v-list-item :key="task.id || `task-${index}`" class="task-list-item" :class="{'draggable-item': planStore.isCurrentUserOwner}">
                                <template v-slot:prepend v-if="planStore.isCurrentUserOwner"> <v-icon class="drag-handle" style="cursor: move;">mdi-drag-vertical</v-icon> </template>
                                <v-list-item-title class="text-wrap">{{ index + 1 }}. {{ task.description }}</v-list-item-title>
                                <v-list-item-subtitle v-if="task.deadlineTime">Deadline: {{ task.deadlineTime }}</v-list-item-subtitle>
                                <template v-slot:append v-if="planStore.isCurrentUserOwner"> <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="grey" @click="openEditTaskDialog(task)" class="me-n2" :disabled="planStore.isTaskLoading"></v-btn> <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="grey" @click="confirmDeleteTask(task)" :disabled="planStore.isTaskLoading"></v-btn> </template>
                            </v-list-item>
                        </template>
                        <template #header v-if="!planStore.currentPlanTasks.length"> <v-list-item class="text-medium-emphasis text-caption"> Chưa có công việc nào được định nghĩa. </v-list-item> </template>
                    </draggable>
                 </v-list>
                <v-card-actions v-if="planStore.isCurrentUserOwner"> <v-spacer></v-spacer> <v-btn color="primary" variant="text" @click="openAddTaskDialog" prepend-icon="mdi-plus" :disabled="planStore.isTaskLoading">Thêm công việc</v-btn> </v-card-actions>
                 <v-alert v-if="planStore.taskError" type="error" density="compact" class="ma-2" closable @click:close="planStore.taskError = null"> {{ planStore.taskError }} </v-alert>
              </v-card>

              <v-card class="elevation-1">
                <v-list-subheader>Thành viên ({{ planStore.currentPlan.members.length }})</v-list-subheader>
                <v-list lines="one" density="compact">
                  <v-list-item v-for="member in planStore.currentPlan.members" :key="member.userEmail" :title="member.userFullName" :subtitle="member.userEmail" prepend-icon="mdi-account-circle-outline">  
                     <template v-slot:append>
                        <v-chip v-if="member.role === 'OWNER'" color="primary" size="small" label>Chủ kế hoạch</v-chip>
                        <v-btn v-if="planStore.isCurrentUserOwner && member.role !== 'OWNER'" icon="mdi-account-remove-outline" size="x-small" variant="text" color="grey" @click="confirmRemoveMember(member)" :loading="planStore.isLoading && memberToDelete?.userId === member.userId" :disabled="planStore.isLoading"></v-btn>
                     </template>
                  </v-list-item>
                </v-list>
                 <v-alert v-if="planStore.error && !planStore.taskError" type="error" density="compact" class="ma-2" closable @click:close="planStore.error = null"> {{ planStore.error }} </v-alert>        
              </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <ProgressDashboard v-if="planStore.currentPlan?.shareableLink" :shareable-link="planStore.currentPlan.shareableLink" :key="dashboardKey" />
           <div v-else-if="!planStore.isLoading" class="text-center pa-5 text-medium-emphasis"> Không thể tải bảng tiến độ (thiếu thông tin link). </div>
        </v-col>
      </v-row>
    </div>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right"> {{ snackbarText }} <template v-slot:actions> <v-btn color="white" variant="text" @click="snackbar = false">Đóng</v-btn> </template> </v-snackbar>

    <v-dialog v-model="taskDialog" persistent max-width="500px"> <v-card> <v-card-title>{{ editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới' }}</v-card-title> <v-card-text> <v-alert v-if="taskDialogError" type="error" density="compact" class="mb-3" closable @click:close="taskDialogError = ''"> {{ taskDialogError }} </v-alert> <v-form ref="taskFormRef" @submit.prevent="saveTask"> <v-textarea v-model="taskForm.description" label="Mô tả công việc *" rows="3" variant="outlined" density="compact" :rules="[rules.required]" class="mb-3" autofocus> </v-textarea> <v-text-field v-model="taskForm.deadlineTime" label="Deadline (HH:mm - tùy chọn)" type="time" variant="outlined" density="compact" clearable> </v-text-field> </v-form> </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" variant="text" @click="closeTaskDialog" :disabled="planStore.isTaskLoading">Hủy</v-btn> <v-btn color="primary" variant="flat" @click="saveTask" :loading="planStore.isTaskLoading">Lưu</v-btn> </v-card-actions> </v-card> </v-dialog>
     <v-dialog v-model="deleteTaskConfirmDialog" persistent max-width="400px"> <v-card> <v-card-title class="text-h6">Xác nhận xóa</v-card-title> <v-card-text>Bạn có chắc chắn muốn xóa công việc "<span class="font-weight-medium">{{ taskToDelete?.description }}</span>"? Hành động này không thể hoàn tác.</v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text @click="deleteTaskConfirmDialog = false" :disabled="planStore.isTaskLoading">Hủy</v-btn> <v-btn color="error" text @click="executeDeleteTask" :loading="planStore.isTaskLoading">Xóa</v-btn> </v-card-actions> </v-card> </v-dialog>
     <v-dialog v-model="deleteMemberConfirmDialog" persistent max-width="450px"> <v-card> <v-card-title class="text-h6">Xác nhận loại bỏ thành viên</v-card-title> <v-card-text> Bạn có chắc chắn muốn loại bỏ <span class="font-weight-medium">{{ memberToDelete?.userFullName }} ({{ memberToDelete?.userEmail }})</span> khỏi kế hoạch này không? </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text @click="deleteMemberConfirmDialog = false" :disabled="planStore.isLoading">Hủy</v-btn> <v-btn color="error" text @click="executeRemoveMember" :loading="planStore.isLoading">Loại bỏ</v-btn> </v-card-actions> </v-card> </v-dialog>
     <v-dialog v-model="archiveConfirmDialog" persistent max-width="450px"> <v-card> <v-card-title class="text-h6"> Xác nhận {{ isArchiving ? 'lưu trữ' : 'khôi phục' }} </v-card-title> <v-card-text> Bạn có chắc chắn muốn {{ isArchiving ? 'lưu trữ' : 'khôi phục' }} kế hoạch "<span class="font-weight-medium">{{ planStore.currentPlan?.title }}</span>"? <span v-if="isArchiving"> Kế hoạch sẽ bị ẩn khỏi danh sách chính và dashboard.</span> <span v-else> Kế hoạch sẽ trở lại trạng thái hoạt động.</span> </v-card-text> <v-card-actions> <v-spacer></v-spacer> <v-btn color="grey-darken-1" text @click="archiveConfirmDialog = false" :disabled="planStore.isLoading">Hủy</v-btn> <v-btn :color="isArchiving ? 'orange' : 'blue'" text @click="executeArchiveAction" :loading="planStore.isLoading"> {{ isArchiving ? 'Lưu trữ' : 'Khôi phục' }} </v-btn> </v-card-actions> </v-card> </v-dialog>

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
    </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import { useCommunityStore } from '@/stores/community';
import { useProgressStore } from '@/stores/progress';
import { useTaskStore } from '@/stores/taskStore';
import ProgressDashboard from '@/components/ProgressDashboard.vue';
import websocketService from '@/api/websocketService';
import draggable from 'vuedraggable';
import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VList, VListItem, VListItemTitle, VListItemSubtitle, VListSubheader, VDivider, VBtn, VAlert, VProgressCircular, VIcon, VChip, VSnackbar,
  VCardActions, VSpacer, VDialog, VForm, VTextarea, VTextField,
  VSelect // *** THÊM IMPORT VSelect ***
} from 'vuetify/components';

// Helper function for debounce
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const progressStore = useProgressStore();

// Component States
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
const taskForm = reactive({ description: '', deadlineTime: null });
const taskDialogError = ref('');
const deleteTaskConfirmDialog = ref(false);
const taskToDelete = ref(null);
const deleteMemberConfirmDialog = ref(false);
const memberToDelete = ref(null);
const archiveConfirmDialog = ref(false);
const isArchiving = ref(true);
const dashboardKey = ref(0);

// *** STATE CHO TRANSFER OWNERSHIP ***
const transferOwnershipDialog = ref(false);
const selectedNewOwnerId = ref(null); // ID của member được chọn
const transferOwnershipError = ref(''); // Lỗi hiển thị trong dialog
// *** KẾT THÚC STATE ***

// WebSocket topic refs
const communityTopic = ref('');
const progressTopic = ref('');
const taskTopic = ref('');
const planDetailsTopic = ref('');

// Debounce function ref
const fetchDashboardDebounced = ref(null);

// Computed property for Draggable
const draggableTasks = computed({
    get() { return planStore.currentPlanTasks; },
    set(newTaskList) { /* Handled in onDragEnd */ }
});

// *** COMPUTED PROPERTY LẤY DANH SÁCH THÀNH VIÊN KHÁC (CHO TRANSFER) ***
const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    // Lọc bỏ Owner hiện tại
    return planStore.currentPlan.members.filter(member => member.role !== 'OWNER' && member.userId !== authStore.currentUser.id);
});

// Validation Rules
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchDashboardDebounced.value = debounce(() => { if (planStore.currentPlan?.shareableLink) { console.log("Debounced: Fetching dashboard..."); progressStore.fetchDashboard(planStore.currentPlan.shareableLink); } }, 1000);
  const shareableLink = route.params.shareableLink;
  if (shareableLink) { planStore.fetchPlan(shareableLink).then(() => { if (planStore.currentPlan) { setupWebSocket(shareableLink); } }).catch(err => { console.error("Failed fetch plan:", err); }); }       
  else { console.error("Missing shareableLink!"); planStore.error = "URL không hợp lệ."; }
});

onUnmounted(() => {
    if (communityTopic.value) websocketService.unsubscribe(communityTopic.value);
    if (progressTopic.value) websocketService.unsubscribe(progressTopic.value);
    if (taskTopic.value) websocketService.unsubscribe(taskTopic.value);
    if (planDetailsTopic.value) websocketService.unsubscribe(planDetailsTopic.value);
    console.log(`WS: Unsubscribed from topics.`);
});

// --- WebSocket Setup ---
const setupWebSocket = (shareableLink) => {
     if (!shareableLink) return;
    const subscribeAndLog = (topic, handler) => { websocketService.subscribe(topic, handler) .then(() => console.log(`WS Subscribed: ${topic}`)) .catch(err => console.error(`WS Subscribe Error ${topic}:`, err)); };
    communityTopic.value = `/topic/plan/${shareableLink}/community`; subscribeAndLog(communityTopic.value, handleCommunityUpdate);
    progressTopic.value = `/topic/plan/${shareableLink}/progress`; subscribeAndLog(progressTopic.value, handleProgressUpdate);
    taskTopic.value = `/topic/plan/${shareableLink}/tasks`; subscribeAndLog(taskTopic.value, handleTaskUpdate);
    planDetailsTopic.value = `/topic/plan/${shareableLink}/details`; subscribeAndLog(planDetailsTopic.value, handlePlanDetailsUpdate);
};

// --- WebSocket Message Handlers ---
const handleCommunityUpdate = (message) => {
    console.log("WS Received community:", message);
    const { type, progressId, comment, commentId, userId, reactionType } = message;
    if (communityStore.selectedProgress?.id === progressId) {
        let comments = communityStore.selectedProgress.comments || [];
        switch (type) {
            case 'NEW_COMMENT': if (!comments.some(c => c.id === comment.id)) comments.push(comment); break;
            case 'UPDATE_COMMENT': const idxUpd = comments.findIndex(c => c.id === comment.id); if (idxUpd !== -1) comments[idxUpd] = comment; else comments.push(comment); break;
            case 'DELETE_COMMENT': comments = comments.filter(c => c.id !== commentId); break;
            case 'UPDATE_REACTION': updateReactionSummary(communityStore.selectedProgress, userId, reactionType); break;
            case 'REMOVE_REACTION': updateReactionSummary(communityStore.selectedProgress, userId, null); break;
        }
        communityStore.selectedProgress.comments = comments; // Gán lại để đảm bảo reactivity
    }
    if (['NEW_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT', 'UPDATE_REACTION', 'REMOVE_REACTION'].includes(type)) { if(fetchDashboardDebounced.value) fetchDashboardDebounced.value(); else if (planStore.currentPlan?.shareableLink) progressStore.fetchDashboard(planStore.currentPlan.shareableLink); }
};

const handleProgressUpdate = (message) => {
    console.log("WS Received progress:", message);
    const { type, date, memberEmail, progressSummary } = message;
    if (type === 'PROGRESS_UPDATE' && progressStore.dashboard?.membersProgress) {
        const memberIdx = progressStore.dashboard.membersProgress.findIndex(m => m.userEmail === memberEmail);
        if (memberIdx !== -1 && progressStore.dashboard.membersProgress[memberIdx].dailyStatus) {
            progressStore.dashboard.membersProgress[memberIdx].dailyStatus[date] = { ...progressSummary, completedTaskIds: new Set(progressSummary.completedTaskIds || []) };
            console.log(`RT Update Progress: ${memberEmail} on ${date}`);
        } else { console.warn(`Member ${memberEmail} not found. Fetching dashboard.`); if (planStore.currentPlan?.shareableLink) progressStore.fetchDashboard(planStore.currentPlan.shareableLink); }        
    }
};

const handlePlanDetailsUpdate = (message) => {
    console.log("WS Received plan details:", message);
    const { type, member, userId, status, displayStatus, title, description, durationInDays, dailyGoal, startDate, endDate, oldOwnerUserId, newOwnerUserId } = message;
    if (!planStore.currentPlan) return;
    let dashboardNeedsRefresh = false;
    switch(type) {
        case 'MEMBER_JOINED': if (planStore.currentPlan.members && !planStore.currentPlan.members.some(m => m.userId === member.userId)) { planStore.currentPlan.members.push(member); if (planStore.currentPlan.memberCount !== undefined) planStore.currentPlan.memberCount = planStore.currentPlan.members.length; console.log("RT Add Member:", member.userEmail); dashboardNeedsRefresh = true; } break;
        case 'MEMBER_REMOVED': if (planStore.currentPlan.members) { const index = planStore.currentPlan.members.findIndex(m => m.userId === userId); if (index !== -1) { planStore.currentPlan.members.splice(index, 1); if (planStore.currentPlan.memberCount !== undefined && planStore.currentPlan.memberCount > 0) planStore.currentPlan.memberCount -= 1; console.log("RT Remove Member:", userId); dashboardNeedsRefresh = true; } } break;
        case 'STATUS_CHANGED': planStore.currentPlan.status = status; planStore.currentPlan.displayStatus = displayStatus; console.log("RT Status Change:", status); break;
        case 'PLAN_INFO_UPDATED': if (title !== undefined) planStore.currentPlan.title = title; if (description !== undefined) planStore.currentPlan.description = description; if (durationInDays !== undefined) planStore.currentPlan.durationInDays = durationInDays; if (dailyGoal !== undefined) planStore.currentPlan.dailyGoal = dailyGoal; if (startDate !== undefined) planStore.currentPlan.startDate = startDate; if (endDate !== undefined) planStore.currentPlan.endDate = endDate; console.log("RT Plan Info Update."); dashboardNeedsRefresh = true; break;
        // *** THÊM CASE OWNERSHIP_TRANSFERRED ***
        case 'OWNERSHIP_TRANSFERRED':
            if (planStore.currentPlan.members) {
                const oldOwner = planStore.currentPlan.members.find(m => m.userId === oldOwnerUserId);
                const newOwner = planStore.currentPlan.members.find(m => m.userId === newOwnerUserId);
                if (oldOwner) oldOwner.role = 'MEMBER';
                if (newOwner) newOwner.role = 'OWNER';
                console.log(`RT Ownership Transfer: ${oldOwnerUserId} -> ${newOwnerUserId}`);
                 // Không cần fetch dashboard vì vai trò không ảnh hưởng dashboard progress
            }
            break;
    }
    if (dashboardNeedsRefresh && planStore.currentPlan?.shareableLink) { console.log("RT: Fetching dashboard due to plan details change..."); progressStore.fetchDashboard(planStore.currentPlan.shareableLink); }
};

const handleTaskUpdate = (message) => {
    console.log("WS Received task:", message);
    const { type, task, taskId, comment, commentId, attachment, attachmentId, orderedTaskIds } = message;
    if (!planStore.currentPlan?.dailyTasks) return;
    const taskStore = useTaskStore();
    const taskIndex = taskId ? planStore.currentPlan.dailyTasks.findIndex(t => t.id === taskId) : -1;
    let targetTask = taskIndex !== -1 ? planStore.currentPlan.dailyTasks[taskIndex] : null;

    switch (type) {
        case 'NEW_TASK': if (!planStore.currentPlan.dailyTasks.some(t => t.id === task.id)) { planStore.currentPlan.dailyTasks.push({ ...task, comments: [], attachments: [] }); planStore.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); console.log("RT Add Task:", task.description); } break;
        case 'UPDATE_TASK': if (targetTask) { const c = targetTask.comments || []; const a = targetTask.attachments || []; planStore.currentPlan.dailyTasks[taskIndex] = { ...task, comments: c, attachments: a }; planStore.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); console.log("RT Update Task:", task.description); } else { planStore.currentPlan.dailyTasks.push({ ...task, comments: [], attachments: [] }); planStore.currentPlan.dailyTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); console.warn("RT Update Non-existing Task:", task.description); } break;
        case 'DELETE_TASK': if (targetTask) { const order = targetTask.order; planStore.currentPlan.dailyTasks.splice(taskIndex, 1); planStore.currentPlan.dailyTasks.forEach(t => { if (t.order > order) t.order -= 1; }); console.log("RT Delete Task:", taskId); if (taskStore.selectedTask?.id === taskId) { taskStore.clearSelectedTask(); communityStore.clearSelectedProgress(); showSnackbar('Công việc bạn đang xem đã bị xóa.', 'warning'); } } break;
        case 'REORDER_TASKS': if (orderedTaskIds?.length) { const map = new Map(planStore.currentPlan.dailyTasks.map(t => [t.id, t])); const reordered = orderedTaskIds.map((id, idx) => { const t = map.get(id); return t ? { ...t, order: idx } : null; }).filter(t => t); if (reordered.length === planStore.currentPlan.dailyTasks.length) { planStore.currentPlan.dailyTasks = reordered; console.log("RT Reorder Tasks."); } else { console.error("RT Reorder Mismatch. Fetching plan..."); planStore.fetchPlan(route.params.shareableLink); } } break;
        case 'NEW_TASK_COMMENT': if (targetTask) { if (!targetTask.comments) targetTask.comments = []; if (!targetTask.comments.some(c => c.id === comment.id)) { targetTask.comments.push(comment); console.log(`RT Add Task Comment ${comment.id}`); } } break;
        case 'UPDATE_TASK_COMMENT': if (targetTask?.comments) { const idx = targetTask.comments.findIndex(c => c.id === comment.id); if (idx !== -1) targetTask.comments[idx] = comment; else targetTask.comments.push(comment); console.log(`RT Update Task Comment ${comment.id}`); } break;
        case 'DELETE_TASK_COMMENT': if (targetTask?.comments) { const len = targetTask.comments.length; targetTask.comments = targetTask.comments.filter(c => c.id !== commentId); if (targetTask.comments.length < len) console.log(`RT Delete Task Comment ${commentId}`); } break;
        case 'NEW_TASK_ATTACHMENT': if (targetTask) { if (!targetTask.attachments) targetTask.attachments = []; if (!targetTask.attachments.some(a => a.id === attachment.id)) { targetTask.attachments.push(attachment); console.log(`RT Add Task Attachment ${attachment.id}`); } } break;
        case 'DELETE_TASK_ATTACHMENT': if (targetTask?.attachments) { const len = targetTask.attachments.length; targetTask.attachments = targetTask.attachments.filter(a => a.id !== attachmentId); if (targetTask.attachments.length < len) console.log(`RT Delete Task Attachment ${attachmentId}`); } break;
    }
     if (taskStore.selectedTask?.id === taskId && targetTask) { console.log(`RT Updating selectedTask (ID: ${taskId})`); taskStore.selectTask(JSON.parse(JSON.stringify(targetTask))); }
};


// Helper cập nhật reaction summary
const updateReactionSummary = (progressData, reactingUserId, newReactionType) => {
    if (!progressData || !progressData.reactions) { if (progressData) progressData.reactions = []; else return; }
    const isCurrentUserReacting = reactingUserId === authStore.currentUser?.id; let previousReactionType = null;
    progressData.reactions.forEach(summary => { if (!Array.isArray(summary.reactingUserIds)) summary.reactingUserIds = []; const userIndex = summary.reactingUserIds.indexOf(reactingUserId); if (userIndex !== -1) { previousReactionType = summary.type; summary.count = Math.max(0, summary.count - 1); summary.reactingUserIds.splice(userIndex, 1); if (isCurrentUserReacting) summary.hasCurrentUserReacted = false; } });
    if (newReactionType && newReactionType !== previousReactionType) {
        let newSummary = progressData.reactions.find(r => r.type === newReactionType); if (!newSummary) { newSummary = { type: newReactionType, count: 0, hasCurrentUserReacted: false, reactingUserIds: [] }; progressData.reactions.push(newSummary); }
        if (!Array.isArray(newSummary.reactingUserIds)) newSummary.reactingUserIds = []; if (!newSummary.reactingUserIds.includes(reactingUserId)) { newSummary.count += 1; newSummary.reactingUserIds.push(reactingUserId); if (isCurrentUserReacting) newSummary.hasCurrentUserReacted = true; }
    }
    progressData.reactions = progressData.reactions.filter(summary => summary.count > 0);
};

// --- Các hàm xử lý khác ---
const handleJoinPlan = async () => { const link = route.params.shareableLink; if (!link) { joinError.value="Mã mời không hợp lệ."; return; } isJoining.value=true; joinError.value=''; try { await planStore.joinCurrentPlan(link); setupWebSocket(link); } catch (e) { joinError.value = planStore.error || 'Lỗi tham gia.'; } finally { isJoining.value=false; } };
const copyInviteLink = () => { if(linkCopied.value) return; navigator.clipboard.writeText(window.location.href).then(() => { linkCopyText.value='Đã copy!'; linkCopied.value=true; showSnackbar('Đã copy link mời!', 'success'); setTimeout(() => { linkCopyText.value='Copy link mời'; linkCopied.value=false; }, 2000); }).catch(err => { console.error(err); showSnackbar('Lỗi copy link.', 'error'); }); };
const displayStatusText = computed(() => { if (!planStore.currentPlan?.displayStatus) return 'N/A'; switch (planStore.currentPlan.displayStatus) { case 'ACTIVE': return 'Đang diễn ra'; case 'COMPLETED': return 'Hoàn thành'; case 'ARCHIVED': return 'Lưu trữ'; default: return planStore.currentPlan.displayStatus; } });
const statusColor = computed(() => { if (!planStore.currentPlan?.displayStatus) return 'grey'; switch (planStore.currentPlan.displayStatus) { case 'ACTIVE': return 'success'; case 'COMPLETED': return 'primary'; case 'ARCHIVED': return 'grey'; default: return 'grey'; } });
const openAddTaskDialog = () => { editingTask.value = null; taskForm.description = ''; taskForm.deadlineTime = null; taskDialogError.value = ''; taskDialog.value = true; nextTick(() => taskFormRef.value?.resetValidation()); };
const openEditTaskDialog = (task) => { editingTask.value = { ...task }; taskForm.description = task.description; taskForm.deadlineTime = task.deadlineTime || null; taskDialogError.value = ''; taskDialog.value = true; nextTick(() => taskFormRef.value?.resetValidation()); };
const closeTaskDialog = () => { taskDialog.value = false; editingTask.value = null; };
const saveTask = async () => { if (!taskFormRef.value) return; const { valid } = await taskFormRef.value.validate(); if (!valid) return; let time = null; if (taskForm.deadlineTime?.match(/^[0-2][0-9]:[0-5][0-9]$/)) time = taskForm.deadlineTime; const data = { description: taskForm.description, deadlineTime: time }; taskDialogError.value = ''; try { if (editingTask.value) { await planStore.updateTaskInCurrentPlan(editingTask.value.id, data); showSnackbar('Đã gửi yêu cầu cập nhật.', 'success'); } else { await planStore.addTaskToCurrentPlan(data); showSnackbar('Đã gửi yêu cầu thêm.', 'success'); } closeTaskDialog(); } catch (e) { taskDialogError.value = planStore.taskError || 'Lỗi lưu công việc.'; } };
const confirmDeleteTask = (task) => { taskToDelete.value = task; deleteTaskConfirmDialog.value = true; };
const executeDeleteTask = async () => { if (!taskToDelete.value) return; const desc = taskToDelete.value.description; const id = taskToDelete.value.id; deleteTaskConfirmDialog.value = false; taskToDelete.value = null; try { await planStore.deleteTaskFromCurrentPlan(id); showSnackbar(`Đã gửi yêu cầu xóa "${desc}".`, 'success'); } catch (e) { showSnackbar(planStore.taskError || `Lỗi xóa "${desc}".`, 'error'); console.error(e); } };
const confirmRemoveMember = (member) => { memberToDelete.value = member; deleteMemberConfirmDialog.value = true; };
const executeRemoveMember = async () => { if (!memberToDelete.value?.userId) return; const name = memberToDelete.value.userFullName; const id = memberToDelete.value.userId; deleteMemberConfirmDialog.value = false; memberToDelete.value = null; try { await planStore.removeMemberFromCurrentPlan(id); showSnackbar(`Đã gửi yêu cầu loại bỏ ${name}.`, 'success'); } catch (e) { console.error(e); showSnackbar(planStore.error || 'Lỗi loại bỏ.', 'error'); } };
const confirmArchiveAction = (archive) => { isArchiving.value = archive; archiveConfirmDialog.value = true; };
const executeArchiveAction = async () => { archiveConfirmDialog.value = false; try { let msg = ''; if (isArchiving.value) { await planStore.archiveCurrentPlan(); msg = 'Đã gửi yêu cầu lưu trữ.'; showSnackbar(msg, 'info'); } else { await planStore.unarchiveCurrentPlan(); msg = 'Đã gửi yêu cầu khôi phục.'; showSnackbar(msg, 'success'); } } catch (e) { showSnackbar(planStore.error || `Lỗi khi ${isArchiving.value ? 'lưu trữ' : 'khôi phục'}.`, 'error'); console.error(e); } };
const showSnackbar = (text, color = 'success') => { snackbarText.value = text; snackbarColor.value = color; snackbar.value = true; };
const onDragEnd = (event) => { console.log('Drag ended:', draggableTasks.value.map(t=>t.id)); const newOrder = [...draggableTasks.value]; const oldIds=(planStore.currentPlanTasks||[]).map(t=>t.id).join(','); const newIds=newOrder.map(t=>t.id).join(','); if(oldIds===newIds){console.log("No order change.");return;} planStore.reorderTasksInCurrentPlan(newOrder).then(()=>{showSnackbar('Đã gửi yêu cầu cập nhật thứ tự.', 'success');}).catch((e)=>{showSnackbar(planStore.taskError||'Lỗi cập nhật thứ tự.', 'error');console.error("Reorder failed:",e);}); };

// *** FUNCTIONS MỚI CHO TRANSFER OWNERSHIP ***
const openTransferOwnershipDialog = () => {
    selectedNewOwnerId.value = null; // Reset lựa chọn cũ
    transferOwnershipError.value = ''; // Reset lỗi cũ
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
    transferOwnershipError.value = ''; // Clear error

    try {
        await planStore.transferPlanOwnership(selectedNewOwnerId.value);
        showSnackbar('Đã gửi yêu cầu chuyển quyền sở hữu.', 'success');
        closeTransferOwnershipDialog();
        // UI sẽ cập nhật qua WebSocket message
    } catch (error) {
         transferOwnershipError.value = planStore.error || 'Có lỗi xảy ra, vui lòng thử lại.';
         console.error("Transfer ownership error:", error);
         // Giữ dialog mở để hiển thị lỗi
    }
};
// *** KẾT THÚC FUNCTIONS MỚI ***

</script>

<style scoped>
.text-wrap { white-space: normal; }
.task-list-item { border-bottom: 1px solid #eee; }
.task-list-item:last-child { border-bottom: none; }
.task-list-item:not(.draggable-item) { cursor: default !important; } /* Con trỏ mặc định nếu không kéo được */
/* .draggable-item { padding-left: 0 !important; } */ /* Có thể bỏ nếu không bị lệch */
.drag-handle { cursor: move; color: #bdbdbd; margin-right: 8px; align-self: center; }
.drag-handle:hover { color: #757575; }
.ghost-item { opacity: 0.5; background: #c8ebfb; }
</style>