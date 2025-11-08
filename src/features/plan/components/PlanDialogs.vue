<template>
  <EditPlanModal 
      v-model="uiStore.modals.editPlan" 
      :current-plan="planStore.currentPlan"
      @plan-updated="emit('show-snackbar', 'Cập nhật kế hoạch thành công!')"
  />

  <TaskDialog
      v-model="uiStore.modals.task"
      :task="uiStore.selectedTask"
      @saved="onTaskSaved"
  />

  <CheckInModal
      v-model="uiStore.modals.checkIn"
      :is-editing="!!uiStore.selectedCheckIn"
      :existing-check-in="uiStore.selectedCheckIn"
  />

  <TransferOwnershipDialog
      v-model="uiStore.modals.transferOwnership"
      :members="otherMembers"
      @transfer-success="emit('show-snackbar', 'Đã gửi yêu cầu chuyển quyền.')"
  />

  <!-- [SỬA ĐỔI] Tên component đã được cập nhật thành AppConfirmDialog -->
  <AppConfirmDialog
      v-model="uiStore.modals.deleteConfirm"
      :itemType="uiStore.confirmDialogType"
      @confirm="onGenericConfirm"
  />

  <v-dialog v-model="uiStore.modals.deleteTask" persistent max-width="400px">
      <v-card class="glass-effect">
        <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn chắc chắn muốn xóa công việc 
          "<b>{{ uiStore.taskToDelete?.description }}</b>"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="medium-emphasis" text 
            @click="uiStore.closeDeleteTask()"
            :disabled="planTaskStore.isTaskActionLoading"
          >Hủy</v-btn>
          <v-btn 
            color="error" text 
            @click="executeDeleteTask" 
            :loading="planTaskStore.isTaskActionLoading"
          >Xóa</v-btn>
        </v-card-actions>
      </v-card>
  </v-dialog>

  <ProgressDetailModal 
      v-if="communityStore.selectedProgress"
      :shareable-link="planStore.currentPlan?.shareableLink"
  />

</template>

<script setup>
import { computed } from 'vue';
// [CẬP NHẬT] Stores
import { usePlanUiStore } from '@/features/plan/stores/planUiStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { usePlanTaskStore } from '@/features/plan/stores/planTaskStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCommunityStore } from '@/features/community/stores/communityStore';
// [THÊM] Import progress store để lấy ngày đang chọn
import { useProgressStore } from '@/features/progress/stores/progressStore';


// [CẬP NHẬT] Components con
import EditPlanModal from './dialogs/EditPlanModal.vue';
import TransferOwnershipDialog from './dialogs/TransferOwnershipDialog.vue';
import TaskDialog from './dialogs/TaskDialog.vue';

// [CẬP NHẬT] Components từ feature khác hoặc common
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue';
import CheckInModal from '@/features/progress/components/checkin/CheckInModal.vue';
import ProgressDetailModal from '@/features/progress/components/ProgressDetailModal.vue';

const emit = defineEmits(['show-snackbar', 'confirm-action']);

const uiStore = usePlanUiStore();
const planStore = usePlanStore();
const planTaskStore = usePlanTaskStore();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const progressStore = useProgressStore(); // [THÊM] Khởi tạo store

// Computed cho Transfer Dialog
const otherMembers = computed(() => {
    if (!planStore.currentPlan?.members || !authStore.currentUser?.id) return [];
    return planStore.currentPlan.members.filter(m => m.userId !== authStore.currentUser.id && m.role !== 'OWNER');
});

// --- Handlers ---
const onTaskSaved = () => {
    const msg = uiStore.selectedTask ? 'Đã cập nhật công việc.' : 'Đã thêm công việc mới.';
    emit('show-snackbar', msg, 'success');
};

const executeDeleteTask = async () => {
    if (!uiStore.taskToDelete) return;
    try {
        // [SỬA LỖI] Dùng ngày đang chọn (selectedDate) làm fallback nếu taskDate không có
        const dateToDelete = uiStore.taskToDelete.taskDate || progressStore.selectedDate;

        await planTaskStore.deleteTask(
            planStore.currentPlan.shareableLink,
            uiStore.taskToDelete.id,
            dateToDelete // Truyền ngày đã có fallback
        );
        emit('show-snackbar', 'Đã xóa công việc.', 'success');
        uiStore.closeDeleteTask();
    } catch (e) {
        emit('show-snackbar', planTaskStore.taskActionError || 'Lỗi khi xóa.', 'error');
    }
};

// Proxy sự kiện confirm từ dialog con lên View cha để xử lý
const onGenericConfirm = () => {
    emit('confirm-action', { 
        type: uiStore.confirmDialogType, 
        item: uiStore.itemToProcess 
    });
};
</script>