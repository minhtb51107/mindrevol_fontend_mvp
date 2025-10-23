<template>
  <v-container fluid>
    <div v-if="planStore.isLoading && !planStore.currentPlan" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Đang tải thông tin kế hoạch...</p>
    </div>
    <v-alert
      v-else-if="planStore.error && !planStore.currentPlan"
      type="error" variant="tonal" class="my-5" closable @click:close="planStore.error = null" rounded="lg">
      {{ planStore.error }}
    </v-alert>

    <div v-else-if="planStore.currentPlan && !planStore.isCurrentUserMember">
        <v-card class="text-center pa-6 pa-md-8 mx-auto" max-width="600" rounded="lg">
            <v-card-item class="mb-4">
               <v-icon icon="mdi-account-group-outline" size="56" color="primary" class="mb-4"></v-icon>
               <v-card-title class="text-h5 font-weight-bold mb-2">Bạn được mời tham gia!</v-card-title>
            </v-card-item>
             <v-card-text>
               <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2>
               <p class="text-medium-emphasis mb-6">{{ planStore.currentPlan.description || 'Kế hoạch này chưa có mô tả.' }}</p>
               <v-list lines="one" density="compact" class="text-left mx-auto bg-transparent" max-width="350">
                  <v-list-item prepend-icon="mdi-account-outline" class="px-0">
                    <v-list-item-title class="font-weight-medium">Người tạo:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.creatorFullName }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-divider inset class="my-2"></v-divider>
                  <v-list-item prepend-icon="mdi-calendar-clock-outline" class="px-0">
                    <v-list-item-title class="font-weight-medium">Thời lượng:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.durationInDays }} ngày</v-list-item-subtitle>
                  </v-list-item>
                  <v-divider inset class="my-2"></v-divider>
                  <v-list-item prepend-icon="mdi-account-multiple-outline" class="px-0">
                    <v-list-item-title class="font-weight-medium">Đã có:</v-list-item-title>
                    <v-list-item-subtitle>{{ planStore.currentPlan.memberCount }} thành viên</v-list-item-subtitle>
                  </v-list-item>
               </v-list>
               <v-btn @click="handleJoinPlan" color="primary" size="large" :loading="isJoining" :disabled="isJoining" class="mt-8" prepend-icon="mdi-account-plus-outline" rounded="lg" elevation="2">
                 Tham gia ngay
               </v-btn>
               <v-alert v-if="joinError" type="error" density="compact" class="mt-4 mx-auto" max-width="400" closable @click:close="joinError = ''" rounded="lg">
                 {{ joinError }}
               </v-alert>
             </v-card-text>
        </v-card>
    </div>

    <div v-else-if="planStore.currentPlan">
      <v-row :dense="$vuetify.display.mdAndUp">
        <v-col cols="12" lg="4">
           <v-card class="mb-4">
                <v-card-item>
                   <v-card-title class="text-h6 font-weight-bold text-wrap">{{ planStore.currentPlan.title }}</v-card-title>
                   <v-card-subtitle class="text-wrap mt-1">{{ planStore.currentPlan.description || 'Không có mô tả' }}</v-card-subtitle>
                </v-card-item>
                 <v-divider></v-divider>
                <v-card-text>
                  <v-list density="compact" class="bg-transparent">
                     <v-list-item prepend-icon="mdi-calendar-check-outline" title="Bắt đầu" :subtitle="formatDate(planStore.currentPlan.startDate)" class="px-1"></v-list-item>
                     <v-list-item prepend-icon="mdi-calendar-end-outline" title="Kết thúc" :subtitle="formatDate(planStore.currentPlan.endDate)" class="px-1"></v-list-item>
                     <v-list-item prepend-icon="mdi-flag-outline" title="Mục tiêu ngày" class="px-1">
                        <v-list-item-subtitle class="text-wrap">{{ planStore.currentPlan.dailyGoal || 'Chưa có' }}</v-list-item-subtitle>
                     </v-list-item>
                     <v-list-item prepend-icon="mdi-progress-check" title="Trạng thái" class="px-1">
                        <template v-slot:subtitle>
                           <v-chip :color="statusColor" size="small" label rounded="lg">{{ displayStatusText }}</v-chip>
                        </template>
                     </v-list-item>
                  </v-list>

                  <v-btn @click="copyInviteLink" variant="outlined" color="success" block class="mt-4" :prepend-icon="linkCopied ? 'mdi-check' : 'mdi-clipboard-plus-outline'" :disabled="linkCopied" rounded="lg">
                     {{ linkCopyText }}
                  </v-btn>

                  <template v-if="planStore.isCurrentUserOwner">
                      <v-btn v-if="planStore.currentPlan.status !== 'ARCHIVED'" @click="confirmArchiveAction(true)" variant="outlined" color="orange" block class="mt-2" prepend-icon="mdi-archive-arrow-down-outline" :loading="planStore.isLoading && isArchiving === true" :disabled="planStore.isLoading" rounded="lg">
                        Lưu trữ
                      </v-btn>
                      <v-btn v-else @click="confirmArchiveAction(false)" variant="outlined" color="blue" block class="mt-2" prepend-icon="mdi-archive-arrow-up-outline" :loading="planStore.isLoading && isArchiving === false" :disabled="planStore.isLoading" rounded="lg">
                        Khôi phục
                      </v-btn>
                      <v-btn
                          v-if="otherMembers.length > 0"
                          @click="openTransferOwnershipDialog"
                          variant="outlined" color="deep-purple" block class="mt-2" prepend-icon="mdi-crown-outline"
                          :disabled="planStore.isLoading" rounded="lg"
                      >
                          Chuyển quyền sở hữu
                      </v-btn>
                  </template>
                </v-card-text>
              </v-card>

              <v-card class="mb-4">
                <v-list-subheader class="font-weight-medium">Công việc hàng ngày ({{ planStore.currentPlanTasks.length }})</v-list-subheader>
                <v-list lines="two" density="compact" class="py-0 task-draggable-list">
                    <draggable
                      :list="draggableTasks"
                      item-key="id"
                      ghost-class="ghost-item"
                      handle=".drag-handle"
                      :component-data="{ style: 'min-height: 40px;' }"
                      :disabled="!planStore.isCurrentUserOwner || planStore.isTaskLoading"
                      @end="onDragEnd"
                    >
                        <template #item="{ element: task, index }">
                            <v-list-item :key="task.id || `task-${index}`" class="task-list-item" :class="{'draggable-item': planStore.isCurrentUserOwner}">
                                <template v-slot:prepend v-if="planStore.isCurrentUserOwner">
                                   <v-icon class="drag-handle me-2" size="small">mdi-drag-vertical</v-icon>
                                </template>
                                <div class="w-100">
                                    <v-list-item-title class="text-wrap font-weight-regular">{{ index + 1 }}. {{ task.description }}</v-list-item-title>
                                    <v-list-item-subtitle v-if="task.deadlineTime" class="mt-1">
                                      <v-icon size="xs" class="me-1">mdi-clock-time-eight-outline</v-icon>Deadline: {{ task.deadlineTime }}
                                    </v-list-item-subtitle>
                                </div>
                                <template v-slot:append v-if="planStore.isCurrentUserOwner">
                                  <div class="d-flex align-center ms-1">
                                     <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="grey-darken-1" @click="openEditTaskDialog(task)" :disabled="planStore.isTaskLoading"></v-btn>
                                     <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="grey-darken-1" @click="confirmDeleteTask(task)" :disabled="planStore.isTaskLoading"></v-btn>
                                  </div>
                                </template>
                            </v-list-item>
                        </template>
                        <template #header v-if="!planStore.currentPlanTasks.length">
                          <v-list-item class="text-medium-emphasis text-caption py-4 text-center">
                            Chưa có công việc nào được định nghĩa.
                          </v-list-item>
                        </template>
                    </draggable>
                 </v-list>
                <v-card-actions v-if="planStore.isCurrentUserOwner" class="pa-3">
                   <v-spacer></v-spacer>
                   <v-btn color="primary" variant="text" @click="openAddTaskDialog" prepend-icon="mdi-plus" size="small" :disabled="planStore.isTaskLoading">Thêm công việc</v-btn>
                </v-card-actions>
                 <v-alert v-if="planStore.taskError" type="error" density="compact" class="ma-2" closable @click:close="planStore.taskError = null" rounded="lg">
                   {{ planStore.taskError }}
                 </v-alert>
              </v-card>

              <v-card>
                <v-list-subheader class="font-weight-medium">Thành viên ({{ planStore.currentPlan.members.length }})</v-list-subheader>
                <v-list lines="one" density="compact" class="py-0">
                  <v-list-item v-for="member in planStore.currentPlan.members" :key="member.userEmail" class="py-1 member-list-item">
                     <template v-slot:prepend>
                        <v-avatar size="32" color="blue-grey-lighten-4" class="me-3">
                           <span class="text-caption font-weight-medium">{{ member.userFullName ? member.userFullName.charAt(0).toUpperCase() : '?' }}</span>
                        </v-avatar>
                     </template>
                     <v-list-item-title class="font-weight-regular">{{ member.userFullName }}</v-list-item-title>
                     <v-list-item-subtitle>{{ member.userEmail }}</v-list-item-subtitle>
                     <template v-slot:append>
                        <v-chip v-if="member.role === 'OWNER'" color="primary" size="small" label variant="flat" rounded="lg">Chủ kế hoạch</v-chip>
                        <v-btn v-if="planStore.isCurrentUserOwner && member.role !== 'OWNER'" icon="mdi-account-remove-outline" size="x-small" variant="text" color="grey-darken-1" @click="confirmRemoveMember(member)" :loading="planStore.isLoading && memberToDelete?.userId === member.userId" :disabled="planStore.isLoading"></v-btn>
                     </template>
                  </v-list-item>
                </v-list>
                 <v-alert v-if="planStore.error && !planStore.taskError" type="error" density="compact" class="ma-2" closable @click:close="planStore.error = null" rounded="lg">
                    {{ planStore.error }}
                 </v-alert>
              </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <ProgressDashboard v-if="planStore.currentPlan?.shareableLink" :shareable-link="planStore.currentPlan.shareableLink" :key="dashboardKey" />
           <div v-else-if="!planStore.isLoading" class="text-center pa-5 text-medium-emphasis">
              Không thể tải bảng tiến độ (thiếu thông tin link).
           </div>
        </v-col>
      </v-row>
    </div>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right" rounded="lg">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Đóng</v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="taskDialog" persistent max-width="500px">
       <v-card rounded="lg">
         <v-card-title class="text-h6 pa-4 bg-grey-lighten-3">{{ editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới' }}</v-card-title>
         <v-card-text class="pt-4">
           <v-alert v-if="taskDialogError" type="error" density="compact" class="mb-3" closable @click:close="taskDialogError = ''" rounded="lg">
             {{ taskDialogError }}
           </v-alert>
           <v-form ref="taskFormRef" @submit.prevent="saveTask">
             <v-textarea v-model="taskForm.description" label="Mô tả công việc *" rows="3" variant="outlined" density="compact" :rules="[rules.required]" class="mb-3" autofocus rounded="lg"> </v-textarea>
             <v-text-field v-model="taskForm.deadlineTime" label="Deadline (HH:mm - tùy chọn)" type="time" variant="outlined" density="compact" clearable rounded="lg"> </v-text-field>
           </v-form>
         </v-card-text>
         <v-card-actions class="pa-4 bg-grey-lighten-4">
           <v-spacer></v-spacer>
           <v-btn color="grey-darken-1" variant="text" @click="closeTaskDialog" :disabled="planStore.isTaskLoading">Hủy</v-btn>
           <v-btn color="primary" variant="flat" @click="saveTask" :loading="planStore.isTaskLoading" rounded="lg">Lưu</v-btn>
         </v-card-actions>
       </v-card>
    </v-dialog>

     <v-dialog v-model="deleteTaskConfirmDialog" persistent max-width="400px">
       <v-card rounded="lg">
         <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
         <v-card-text>Bạn có chắc chắn muốn xóa công việc "<span class="font-weight-medium">{{ taskToDelete?.description }}</span>"? Hành động này không thể hoàn tác.</v-card-text>
         <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn color="grey-darken-1" text @click="deleteTaskConfirmDialog = false" :disabled="planStore.isTaskLoading">Hủy</v-btn>
           <v-btn color="error" text @click="executeDeleteTask" :loading="planStore.isTaskLoading">Xóa</v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>

     <v-dialog v-model="deleteMemberConfirmDialog" persistent max-width="450px">
       <v-card rounded="lg">
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
       <v-card rounded="lg">
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
        <v-card rounded="lg">
            <v-card-title class="text-h6 pa-4 bg-grey-lighten-3">Chuyển quyền sở hữu kế hoạch</v-card-title>
            <v-card-text class="pt-4">
                <p class="text-body-1 mb-4">Chọn thành viên bạn muốn chuyển quyền sở hữu kế hoạch này. Bạn sẽ trở thành thành viên bình thường sau khi chuyển.</p>
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
                    rounded="lg"
                    clearable
                >
                    <template v-slot:item="{ props, item }">
                         <v-list-item v-bind="props" :subtitle="item.raw.userEmail" rounded="lg"></v-list-item>
                    </template>
                </v-select>
            </v-card-text>
            <v-card-actions class="pa-4 bg-grey-lighten-4">
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="closeTransferOwnershipDialog" :disabled="planStore.isLoading">Hủy</v-btn>
                <v-btn color="deep-purple" variant="flat" @click="confirmTransferOwnership" :loading="planStore.isLoading" :disabled="!selectedNewOwnerId" rounded="lg">Xác nhận chuyển</v-btn>
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
  VCardActions, VSpacer, VDialog, VForm, VTextarea, VTextField, VSelect, VAvatar
} from 'vuetify/components';
import { useDisplay } from 'vuetify'; // Import useDisplay

function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func.apply(this, args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const progressStore = useProgressStore();
const taskStore = useTaskStore();
const { $vuetify } = { $vuetify: { display: useDisplay() } }; // Get display information

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
const transferOwnershipDialog = ref(false);
const selectedNewOwnerId = ref(null);
const transferOwnershipError = ref('');

const communityTopic = ref('');
const progressTopic = ref('');
const taskTopic = ref('');
const planDetailsTopic = ref('');

const fetchDashboardDebounced = ref(null);

const draggableTasks = computed({
    get() { return planStore.currentPlanTasks; },
    set(newTaskList) { }
});

const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    return planStore.currentPlan.members.filter(member => member.role !== 'OWNER' && member.userId !== authStore.currentUser.id);
});

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Lỗi format ngày:", e);
        return dateString;
    }
};

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

const setupWebSocket = (shareableLink) => {
     if (!shareableLink) return;
    const subscribeAndLog = (topic, handler) => { websocketService.subscribe(topic, handler) .then(() => console.log(`WS Subscribed: ${topic}`)) .catch(err => console.error(`WS Subscribe Error ${topic}:`, err)); };
    communityTopic.value = `/topic/plan/${shareableLink}/community`; subscribeAndLog(communityTopic.value, handleCommunityUpdate);
    progressTopic.value = `/topic/plan/${shareableLink}/progress`; subscribeAndLog(progressTopic.value, handleProgressUpdate);
    taskTopic.value = `/topic/plan/${shareableLink}/tasks`; subscribeAndLog(taskTopic.value, handleTaskUpdate);
    planDetailsTopic.value = `/topic/plan/${shareableLink}/details`; subscribeAndLog(planDetailsTopic.value, handlePlanDetailsUpdate);
};

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
        communityStore.selectedProgress.comments = comments;
    }
    if (['NEW_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT', 'UPDATE_REACTION', 'REMOVE_REACTION'].includes(type)) { if(fetchDashboardDebounced.value) fetchDashboardDebounced.value(); else if (planStore.currentPlan?.shareableLink) progressStore.fetchDashboard(planStore.currentPlan.shareableLink); }
};

const handleProgressUpdate = (message) => {
    console.log("WS Received progress:", message);
    const { type, date, memberEmail, progressSummary } = message;
    if (type === 'PROGRESS_UPDATE' && progressStore.dashboard?.membersProgress) {
        progressStore.updateDashboardFromWebSocket(message);
        dashboardKey.value++; // Force re-render dashboard
    }
};

const handlePlanDetailsUpdate = (message) => {
    console.log("WS Received plan details:", message);
    const { type, member, userId, status, displayStatus, title, description, durationInDays, dailyGoal, startDate, endDate, oldOwnerUserId, newOwnerUserId } = message;
    if (!planStore.currentPlan) return;
    let dashboardNeedsRefresh = false;
    let planInfoChanged = false;
    switch(type) {
        case 'MEMBER_JOINED':
            if (planStore.currentPlan.members && !planStore.currentPlan.members.some(m => m.userId === member.userId)) {
                planStore.currentPlan.members.push(member);
                if (planStore.currentPlan.memberCount !== undefined) planStore.currentPlan.memberCount = planStore.currentPlan.members.length;
                console.log("RT Add Member:", member.userEmail);
                dashboardNeedsRefresh = true;
            }
            break;
        case 'MEMBER_REMOVED':
            if (planStore.currentPlan.members) {
                 const index = planStore.currentPlan.members.findIndex(m => m.userId === userId);
                 if (index !== -1) {
                     planStore.currentPlan.members.splice(index, 1);
                     if (planStore.currentPlan.memberCount !== undefined && planStore.currentPlan.memberCount > 0) planStore.currentPlan.memberCount -= 1;
                     console.log("RT Remove Member:", userId);
                     dashboardNeedsRefresh = true;
                 }
            }
            break;
        case 'STATUS_CHANGED':
            planStore.currentPlan.status = status;
            planStore.currentPlan.displayStatus = displayStatus;
            console.log("RT Status Change:", status);
            planInfoChanged = true;
            break;
        case 'PLAN_INFO_UPDATED':
            if (title !== undefined) planStore.currentPlan.title = title;
            if (description !== undefined) planStore.currentPlan.description = description;
            if (durationInDays !== undefined) planStore.currentPlan.durationInDays = durationInDays;
            if (dailyGoal !== undefined) planStore.currentPlan.dailyGoal = dailyGoal;
            if (startDate !== undefined) planStore.currentPlan.startDate = startDate;
            if (endDate !== undefined) planStore.currentPlan.endDate = endDate;
            console.log("RT Plan Info Update.");
            dashboardNeedsRefresh = true; // Refresh dashboard because dates/duration might change
            planInfoChanged = true;
            break;
        case 'OWNERSHIP_TRANSFERRED':
            if (planStore.currentPlan.members) {
                const oldOwner = planStore.currentPlan.members.find(m => m.userId === oldOwnerUserId);
                const newOwner = planStore.currentPlan.members.find(m => m.userId === newOwnerUserId);
                if (oldOwner) oldOwner.role = 'MEMBER';
                if (newOwner) newOwner.role = 'OWNER';
                console.log(`RT Ownership Transfer: ${oldOwnerUserId} -> ${newOwnerUserId}`);
                planInfoChanged = true; // Rerender member list
            }
            break;
    }
    if (dashboardNeedsRefresh && planStore.currentPlan?.shareableLink) {
        console.log("RT: Fetching dashboard due to plan details change...");
        progressStore.fetchDashboard(planStore.currentPlan.shareableLink);
    }
    if (planInfoChanged) {
        // Trigger reactivity for computed properties based on plan data
        planStore.currentPlan = { ...planStore.currentPlan };
    }
};

const handleTaskUpdate = (message) => {
    console.log("WS Received task:", message);
    const { type, task, taskId, comment, commentId, attachment, attachmentId, orderedTaskIds } = message;
    if (!planStore.currentPlan?.dailyTasks) return;

    const currentTasks = planStore.currentPlan.dailyTasks;
    const taskIndex = taskId ? currentTasks.findIndex(t => t.id === taskId) : -1;
    let targetTask = taskIndex !== -1 ? currentTasks[taskIndex] : null;

    switch (type) {
        case 'NEW_TASK':
            if (!currentTasks.some(t => t.id === task.id)) {
                currentTasks.push({ ...task, comments: [], attachments: [] });
                currentTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                console.log("RT Add Task:", task.description);
            }
            break;
        case 'UPDATE_TASK':
            if (targetTask) {
                const existingComments = targetTask.comments || [];
                const existingAttachments = targetTask.attachments || [];
                currentTasks[taskIndex] = { ...task, comments: existingComments, attachments: existingAttachments };
                currentTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                console.log("RT Update Task:", task.description);
            } else {
                 currentTasks.push({ ...task, comments: [], attachments: [] });
                 currentTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                 console.warn("RT Update Non-existing Task:", task.description);
            }
            break;
        case 'DELETE_TASK':
            if (targetTask) {
                const removedOrder = targetTask.order;
                currentTasks.splice(taskIndex, 1);
                currentTasks.forEach(t => { if (t.order > removedOrder) t.order -= 1; });
                console.log("RT Delete Task:", taskId);
                if (taskStore.selectedTask?.id === taskId) {
                    taskStore.clearSelectedTask();
                    communityStore.clearSelectedProgress(); // Also close detail modal if it was open for this task's day
                    showSnackbar('Công việc bạn đang xem đã bị xóa.', 'warning');
                }
            }
            break;
        case 'REORDER_TASKS':
             if (orderedTaskIds?.length === currentTasks.length) {
                 const taskMap = new Map(currentTasks.map(t => [t.id, t]));
                 const reorderedTasks = orderedTaskIds.map((id, index) => {
                     const t = taskMap.get(id);
                     if (t) return { ...t, order: index };
                     return null; // Should not happen if validation is correct
                 }).filter(t => t !== null);

                 if (reorderedTasks.length === currentTasks.length) {
                     planStore.currentPlan.dailyTasks = reorderedTasks; // Directly assign the new sorted array
                     console.log("RT Reorder Tasks applied.");
                 } else {
                      console.error("RT Reorder Mismatch after mapping. Fetching plan...");
                      planStore.fetchPlan(route.params.shareableLink);
                 }
             } else {
                  console.error("RT Reorder Mismatch in length. Fetching plan...");
                  planStore.fetchPlan(route.params.shareableLink);
             }
             break;
        case 'NEW_TASK_COMMENT':
            if (targetTask) {
                if (!targetTask.comments) targetTask.comments = [];
                if (!targetTask.comments.some(c => c.id === comment.id)) {
                    targetTask.comments.push(comment);
                    console.log(`RT Add Task Comment ${comment.id}`);
                }
            }
            break;
        case 'UPDATE_TASK_COMMENT':
            if (targetTask?.comments) {
                const idx = targetTask.comments.findIndex(c => c.id === comment.id);
                if (idx !== -1) targetTask.comments[idx] = comment;
                else targetTask.comments.push(comment);
                console.log(`RT Update Task Comment ${comment.id}`);
            }
            break;
        case 'DELETE_TASK_COMMENT':
            if (targetTask?.comments) {
                const initialLength = targetTask.comments.length;
                targetTask.comments = targetTask.comments.filter(c => c.id !== commentId);
                if(targetTask.comments.length < initialLength) console.log(`RT Delete Task Comment ${commentId}`);
            }
            break;
        case 'NEW_TASK_ATTACHMENT':
            if (targetTask) {
                if (!targetTask.attachments) targetTask.attachments = [];
                if (!targetTask.attachments.some(a => a.id === attachment.id)) {
                    targetTask.attachments.push(attachment);
                    console.log(`RT Add Task Attachment ${attachment.id}`);
                }
            }
            break;
        case 'DELETE_TASK_ATTACHMENT':
            if (targetTask?.attachments) {
                 const initialLength = targetTask.attachments.length;
                 targetTask.attachments = targetTask.attachments.filter(a => a.id !== attachmentId);
                 if(targetTask.attachments.length < initialLength) console.log(`RT Delete Task Attachment ${attachmentId}`);
            }
            break;
    }
    if (taskStore.selectedTask?.id === taskId && targetTask) {
        console.log(`RT Updating selectedTask (ID: ${taskId})`);
        taskStore.selectTask(JSON.parse(JSON.stringify(targetTask))); // Update selected task in its store
    }
     // Force reactivity update for the task list
    planStore.currentPlan.dailyTasks = [...planStore.currentPlan.dailyTasks];
};


const updateReactionSummary = (progressData, reactingUserId, newReactionType) => {
    if (!progressData || !progressData.reactions) { if (progressData) progressData.reactions = []; else return; }
    const isCurrentUserReacting = reactingUserId === authStore.currentUser?.id;
    let previousReactionType = null;
    progressData.reactions.forEach(summary => {
        if (!Array.isArray(summary.reactingUserIds)) summary.reactingUserIds = [];
        const userIndex = summary.reactingUserIds.indexOf(reactingUserId);
        if (userIndex !== -1) {
            previousReactionType = summary.type;
            summary.count = Math.max(0, summary.count - 1);
            summary.reactingUserIds.splice(userIndex, 1);
            if (isCurrentUserReacting) summary.hasCurrentUserReacted = false;
        }
    });
    if (newReactionType && newReactionType !== previousReactionType) {
        let newSummary = progressData.reactions.find(r => r.type === newReactionType);
        if (!newSummary) {
            newSummary = { type: newReactionType, count: 0, hasCurrentUserReacted: false, reactingUserIds: [] };
            progressData.reactions.push(newSummary);
        }
        if (!Array.isArray(newSummary.reactingUserIds)) newSummary.reactingUserIds = [];
        if (!newSummary.reactingUserIds.includes(reactingUserId)) {
            newSummary.count += 1;
            newSummary.reactingUserIds.push(reactingUserId);
            if (isCurrentUserReacting) newSummary.hasCurrentUserReacted = true;
        }
    }
    progressData.reactions = progressData.reactions.filter(summary => summary.count > 0);
};

const handleJoinPlan = async () => {
    const link = route.params.shareableLink;
    if (!link) {
      joinError.value="Mã mời không hợp lệ.";
      return;
    }
    isJoining.value=true;
    joinError.value='';
    try {
      await planStore.joinCurrentPlan(link);
      setupWebSocket(link);
    } catch (e) {
      joinError.value = planStore.error || 'Lỗi tham gia.';
    } finally {
      isJoining.value=false;
    }
};

const copyInviteLink = () => {
    if(linkCopied.value) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
        linkCopyText.value='Đã copy!';
        linkCopied.value=true;
        showSnackbar('Đã copy link mời!', 'success');
        setTimeout(() => {
            linkCopyText.value='Copy link mời';
            linkCopied.value=false;
        }, 2000);
    }).catch(err => {
        console.error(err);
        showSnackbar('Lỗi copy link.', 'error');
    });
};

const displayStatusText = computed(() => {
    if (!planStore.currentPlan?.displayStatus) return 'N/A';
    switch (planStore.currentPlan.displayStatus) {
        case 'ACTIVE': return 'Đang diễn ra';
        case 'COMPLETED': return 'Hoàn thành';
        case 'ARCHIVED': return 'Lưu trữ';
        default: return planStore.currentPlan.displayStatus;
    }
});

const statusColor = computed(() => {
    if (!planStore.currentPlan?.displayStatus) return 'grey';
    switch (planStore.currentPlan.displayStatus) {
        case 'ACTIVE': return 'success';
        case 'COMPLETED': return 'primary';
        case 'ARCHIVED': return 'grey';
        default: return 'grey';
    }
});

const openAddTaskDialog = () => {
    editingTask.value = null;
    taskForm.description = '';
    taskForm.deadlineTime = null;
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const openEditTaskDialog = (task) => {
    editingTask.value = { ...task };
    taskForm.description = task.description;
    taskForm.deadlineTime = task.deadlineTime || null;
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
    if (taskForm.deadlineTime?.match(/^[0-2][0-9]:[0-5][0-9]$/)) {
        time = taskForm.deadlineTime;
    } else if (taskForm.deadlineTime) {
        // Basic validation if time is entered but not valid
        taskDialogError.value = 'Định dạng Deadline không hợp lệ (HH:mm).';
        return;
    }

    const data = { description: taskForm.description, deadlineTime: time };
    taskDialogError.value = '';
    try {
        if (editingTask.value) {
            await planStore.updateTaskInCurrentPlan(editingTask.value.id, data);
            showSnackbar('Đã gửi yêu cầu cập nhật công việc.', 'success');
        } else {
            await planStore.addTaskToCurrentPlan(data);
            showSnackbar('Đã gửi yêu cầu thêm công việc.', 'success');
        }
        closeTaskDialog();
    } catch (e) {
        taskDialogError.value = planStore.taskError || 'Lỗi lưu công việc.';
    }
};

const confirmDeleteTask = (task) => {
    taskToDelete.value = task;
    deleteTaskConfirmDialog.value = true;
};

const executeDeleteTask = async () => {
    if (!taskToDelete.value) return;
    const desc = taskToDelete.value.description;
    const id = taskToDelete.value.id;
    deleteTaskConfirmDialog.value = false;
    taskToDelete.value = null;
    try {
        await planStore.deleteTaskFromCurrentPlan(id);
        showSnackbar(`Đã gửi yêu cầu xóa "${desc}".`, 'success');
    } catch (e) {
        showSnackbar(planStore.taskError || `Lỗi xóa "${desc}".`, 'error');
        console.error(e);
    }
};

const confirmRemoveMember = (member) => {
    memberToDelete.value = member;
    deleteMemberConfirmDialog.value = true;
};

const executeRemoveMember = async () => {
    if (!memberToDelete.value?.userId) return;
    const name = memberToDelete.value.userFullName;
    const id = memberToDelete.value.userId;
    deleteMemberConfirmDialog.value = false;
    memberToDelete.value = null;
    try {
        await planStore.removeMemberFromCurrentPlan(id);
        showSnackbar(`Đã gửi yêu cầu loại bỏ ${name}.`, 'success');
    } catch (e) {
        console.error(e);
        showSnackbar(planStore.error || 'Lỗi loại bỏ.', 'error');
    }
};

const confirmArchiveAction = (archive) => {
    isArchiving.value = archive;
    archiveConfirmDialog.value = true;
};

const executeArchiveAction = async () => {
    archiveConfirmDialog.value = false;
    try {
        let msg = '';
        if (isArchiving.value) {
            await planStore.archiveCurrentPlan();
            msg = 'Đã gửi yêu cầu lưu trữ.';
            showSnackbar(msg, 'info');
        } else {
            await planStore.unarchiveCurrentPlan();
            msg = 'Đã gửi yêu cầu khôi phục.';
            showSnackbar(msg, 'success');
        }
    } catch (e) {
        showSnackbar(planStore.error || `Lỗi khi ${isArchiving.value ? 'lưu trữ' : 'khôi phục'}.`, 'error');
        console.error(e);
    }
};

const showSnackbar = (text, color = 'success') => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
};

const onDragEnd = (event) => {
    console.log('Drag ended, new order IDs:', draggableTasks.value.map(t=>t.id));
    const newOrderedList = [...draggableTasks.value]; // Lấy danh sách task đầy đủ sau khi kéo
    const oldIds = (planStore.currentPlan?.dailyTasks || []).map(t => t.id).join(',');
    const newIds = newOrderedList.map(t => t.id).join(',');

    if (oldIds === newIds) {
        console.log("No order change detected.");
        return;
    }

    planStore.reorderTasksInCurrentPlan(newOrderedList)
        .then(() => {
            showSnackbar('Đã gửi yêu cầu cập nhật thứ tự công việc.', 'success');
        })
        .catch((e) => {
            showSnackbar(planStore.taskError || 'Lỗi cập nhật thứ tự công việc.', 'error');
            console.error("Reorder failed:", e);
            // Rollback UI (Vuetify draggable might handle this, or force re-fetch)
            // planStore.fetchPlan(route.params.shareableLink);
        });
};

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
        showSnackbar('Đã gửi yêu cầu chuyển quyền sở hữu.', 'success');
        closeTransferOwnershipDialog();
    } catch (error) {
         transferOwnershipError.value = planStore.error || 'Có lỗi xảy ra, vui lòng thử lại.';
         console.error("Transfer ownership error:", error);
    }
};
</script>

<style scoped>
.text-wrap { white-space: normal; word-break: break-word; }
.task-list-item { border-bottom: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity)); }
.task-list-item:last-child { border-bottom: none; }
.task-list-item:not(.draggable-item) { cursor: default !important; }
.drag-handle { cursor: move; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); }
.drag-handle:hover { color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); }
.ghost-item { opacity: 0.5; background: rgba(var(--v-theme-primary), 0.1); border-radius: 8px; }
.member-list-item { border-bottom: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity)); }
.member-list-item:last-child { border-bottom: none; }
.task-draggable-list .v-list-item { padding-left: 16px; padding-right: 16px; }
.task-draggable-list .v-list-item--density-compact.v-list-item--one-line { min-height: 48px;}
.task-draggable-list .v-list-item--density-compact.v-list-item--two-line { min-height: 64px;}
</style>