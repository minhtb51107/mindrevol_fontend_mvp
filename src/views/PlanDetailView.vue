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

    <div v-else-if="planStore.currentPlan" class="fill-height w-100 d-flex flex-column">
      <!-- <v-alert
        v-if="planStore.currentPlan.motivation"
        color="amber-lighten-4"
        icon="mdi-lightbulb-on-outline"
        border="start"
        border-color="amber"
        class="mb-4 flex-grow-0"
        elevation="1"
        rounded="lg"
      >
        <div class="text-subtitle-2 font-weight-bold text-amber-darken-4 mb-1">
          Lý do bắt đầu hành trình này:
        </div>
        <div class="text-body-1 font-italic text-grey-darken-3">
          "{{ planStore.currentPlan.motivation }}"
        </div>
      </v-alert> -->
      <v-row class="main-layout-row flex-grow-1">
        
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
                @tasks-reordered="handleTasksReordered" 
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
      :current-plan="planStore.currentPlan"  @close="isEditPlanModalOpen = false"
      @plan-updated="showSnackbar('Cập nhật chi tiết hành trình thành công.', 'success')"
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
      v-if="communityStore.selectedProgress"
      :shareable-link="planStore.currentPlan?.shareableLink"
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
import { useCommunityStore } from '@/stores/community'; 
import websocketService from '@/api/websocketService';
import dayjs from 'dayjs'; 

// --- IMPORT COMPOSABLE MỚI ---
import { usePlanWebSocket } from '@/composables/usePlanWebSocket';

import PlanInfoPanel from '@/components/PlanInfoPanel.vue';
import TimelineDashboard from '@/components/TimelineDashboard.vue';
import DailyTaskList from '@/components/DailyTaskList.vue';
import CheckInModal from '@/components/CheckInModal.vue'; 
import ProgressDetailModal from '@/components/ProgressDetailModal.vue'; 

import EditPlanModal from '@/components/dialogs/EditPlanModal.vue'; 
import TransferOwnershipDialog from '@/components/dialogs/TransferOwnershipDialog.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';

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
const communityStore = useCommunityStore(); 

// --- SỬ DỤNG COMPOSABLE ---
// Tạo computed ref cho selectedDate để composable luôn có giá trị mới nhất
const selectedDateRef = computed(() => progressStore.getSelectedDate);
// Khởi tạo composable
const { connect: connectWS, disconnect: disconnectWS } = usePlanWebSocket(selectedDateRef);

const isJoining = ref(false);
const joinError = ref('');

const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const actionError = ref(null);
const isLoadingAction = ref(false);
const isEditPlanModalOpen = ref(false);
const showTransferDialog = ref(false);
const showConfirmDialog = ref(false);
const confirmDialogType = ref('');
const itemToProcess = ref(null);
const isArchiving = ref(null);
const isLeaving = ref(false);
const removingMemberId = ref(null);
const isDeleting = ref(false);

const taskDialog = ref(false);
const editingTask = ref(null);
const taskFormRef = ref(null);
const taskForm = reactive({ description: '', deadlineTime: null, taskDate: null });
const taskDialogError = ref('');
const deleteTaskConfirmDialog = ref(false);
const taskToDelete = ref(null);
const isReordering = ref(false); 

const isCheckInModalOpen = ref(false);
const checkInToEdit = ref(null); 
const deleteCheckInConfirmDialog = ref(false); 
const checkInToDelete = ref(null); 
const isDeletingCheckIn = ref(false); 

const selectedDate = computed(() => progressStore.getSelectedDate);
const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    return planStore.currentPlan.members.filter(member => member.userId !== authStore.currentUser.id && member.role !== 'OWNER');
}); 

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  date: value => !value || dayjs(value, 'YYYY-MM-DD', true).isValid() || 'Định dạng ngày YYYY-MM-DD.',
};

const fetchPlanAndInitialData = async (shareableLink) => {
    if (!shareableLink) {
        planStore.error = "URL không hợp lệ.";
        return;
    }
    actionError.value = null;
    await planStore.fetchPlan(shareableLink);
    if (planStore.currentPlan && planStore.isCurrentUserMember) {
        await fetchDataForSelectedDate(shareableLink, progressStore.selectedDate);
        // KẾT NỐI WEBSOCKET THÔNG QUA COMPOSABLE
        connectWS(shareableLink);
    } else if (planStore.currentPlan && !planStore.isCurrentUserMember) {
        console.log("PlanDetailView: User is not a member yet.");
    }
};

const fetchDataForSelectedDate = async (shareableLink, date) => {
    if (!shareableLink || !date) return;
    progressStore.timelineError = null;
    planStore.dailyTasksError = null;
    await Promise.allSettled([ 
        progressStore.fetchTimeline(shareableLink, date),
        planStore.fetchDailyTasks(shareableLink, date)
    ]);
};

// --- CÁC HÀM SETUP/HANDLE WEBSOCKET CŨ ĐÃ BỊ XÓA VÀ THAY BẰNG COMPOSABLE ---

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

const openEditPlanDialog = () => {
    isEditPlanModalOpen.value = true;
};

const openTransferOwnershipDialog = () => {
    showTransferDialog.value = true;
};

const confirmLeavePlan = () => {
    openConfirmDialog('leave-plan');
};

const confirmArchiveAction = (isArchivingFlag) => {
    openConfirmDialog(isArchivingFlag ? 'archive-plan' : 'unarchive-plan');
};

const confirmRemoveMember = (member) => {
    openConfirmDialog('remove-member', member);
};

const openDeletePlanDialog = () => {
    openConfirmDialog('delete-plan');
};

const openConfirmDialog = (type, item = null) => {
    confirmDialogType.value = type;
    itemToProcess.value = item;
    actionError.value = null;
    showConfirmDialog.value = true;
};

const onConfirmDialog = async () => {
  const type = confirmDialogType.value;
  const item = itemToProcess.value;
  showConfirmDialog.value = false;
  
  isLoadingAction.value = true;
  actionError.value = null;

  try {
    switch (type) {
      case 'leave-plan':
        isLeaving.value = true;
        await planStore.leaveCurrentPlan();
        showSnackbar('Bạn đã rời khỏi hành trình.');
        break;
        
      case 'archive-plan':
        isArchiving.value = true;
        await planStore.archiveCurrentPlan();
        showSnackbar('Hành trình đã được lưu trữ.');
        break;

      case 'unarchive-plan':
        isArchiving.value = false;
        await planStore.unarchiveCurrentPlan();
        showSnackbar('Hành trình đã được khôi phục.');
        await fetchPlanAndInitialData(route.params.shareableLink);
        break;
        
      case 'remove-member':
        if (item) {
          removingMemberId.value = item.userId;
          await planStore.removeMemberFromCurrentPlan(removingMemberId.value);
          showSnackbar(`Đã xóa thành viên: ${item.userFullName}`, 'success');
        }
        break;
        
      case 'delete-plan':
        isDeleting.value = true;
        await planStore.deletePlanPermanently();
        showSnackbar('Hành trình đã được xóa vĩnh viễn.');
        break;
    }
  } catch (err) {
    const errorMessage = err.message || 'Hành động thất bại. Vui lòng thử lại.';
    actionError.value = errorMessage;
    showSnackbar(errorMessage, 'error');
  } finally {
    isLoadingAction.value = false;
    isArchiving.value = null;
    isLeaving.value = false;
    removingMemberId.value = null;
    isDeleting.value = false;
    itemToProcess.value = null;
    confirmDialogType.value = '';
  }
};

const openAddTaskDialog = () => {
    editingTask.value = null;
    taskForm.description = '';
    taskForm.deadlineTime = null;
    taskForm.taskDate = progressStore.selectedDate;
    taskDialogError.value = '';
    taskDialog.value = true;
    nextTick(() => taskFormRef.value?.resetValidation());
};

const openEditTaskDialog = (task) => {
    editingTask.value = { ...task };
    if (!editingTask.value.taskDate) {
        editingTask.value.taskDate = progressStore.selectedDate;
    }
    taskForm.description = task.description;
    taskForm.deadlineTime = task.deadlineTime || null;
    taskForm.taskDate = null;
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
    }
};

const confirmDeleteTask = (task) => {
    const originalTaskDate = task.taskDate || progressStore.selectedDate;
    taskToDelete.value = { id: task.id, description: task.description, taskDate: originalTaskDate };
    deleteTaskConfirmDialog.value = true;
};

const executeDeleteTask = async () => {
    if (!taskToDelete.value?.id || !taskToDelete.value?.taskDate) {
       showSnackbar('Lỗi: Không xác định được ngày của công việc cần xóa.', 'error');
       deleteTaskConfirmDialog.value = false;
       return;
    }

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
        taskToDelete.value = taskBeingDeleted;
    }
};

const handleTasksReordered = async (orderedTasks) => {
    if (isReordering.value) return;
    
    const taskDate = progressStore.selectedDate;
    if (!taskDate) {
        console.error("Reorder failed: No selected date.");
        return;
    }

    isReordering.value = true;
    try {
        await planStore.reorderTasksInCurrentPlan(taskDate, orderedTasks);
    } catch (e) {
        showSnackbar(planStore.taskError || 'Lỗi khi sắp xếp công việc. Đã hoàn tác.', 'error');
    } finally {
        isReordering.value = false;
    }
};

const openCheckInModal = () => {
    if (planStore.isCurrentUserMember) {
         checkInToEdit.value = null;
         isCheckInModalOpen.value = true;
    } else {
         showSnackbar("Bạn phải là thành viên để check-in.", "error");
    }
};

const onCheckInModalClose = (value) => {
    if (!value) {
        isCheckInModalOpen.value = false;
        checkInToEdit.value = null;
    }
};

const openEditCheckInDialog = (checkInEvent) => {
    checkInToEdit.value = checkInEvent;
    isCheckInModalOpen.value = true;
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
    communityStore.selectProgress(checkInEvent);
};

watch(() => route.params.shareableLink, (newLink, oldLink) => {
  if (newLink && newLink !== oldLink) {
    // disconnectWS(); // Composable tự lo việc này khi gọi connect mới
    fetchPlanAndInitialData(newLink); 
  }
}, { immediate: true });

watch(selectedDate, (newDate, oldDate) => {
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
    progressStore.clearPlanProgressData();
    // disconnectWS(); // Composable tự lo việc này trong onUnmounted của nó
});
</script>

<style scoped>
.fill-height {
  height: 100%;
}
.w-100 {
  width: 100%;
}
/* Sửa lại layout flex để alert không bị đè */
.d-flex.flex-column {
    display: flex;
    flex-direction: column;
}
.flex-grow-0 {
    flex-grow: 0 !important;
}
.flex-grow-1 {
    flex-grow: 1 !important;
}

.main-layout-row {
  height: 100%; /* Vẫn giữ height 100% cho row chính */
  min-height: 0; /* Quan trọng để scroll hoạt động đúng trong flex child */
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
</style>