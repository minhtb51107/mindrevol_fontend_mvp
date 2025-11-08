<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="450px"
    persistent
  >
    <v-card class="neo-dialog-card" rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon
          :color="dialogConfig.color"
          start
          class="mr-2"
          size="small"
          >{{ dialogConfig.icon }}</v-icon
        >
        <span class="text-h6 font-weight-medium">{{
          dialogConfig.title
        }}</span>
      </v-card-title>

      <v-card-text class="py-3">
        <p class="text-body-1">{{ dialogConfig.message }}</p>
        <p
          v-if="dialogConfig.warning"
          class="text-body-2 text-medium-emphasis mt-2"
        >
          {{ dialogConfig.warning }}
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeDialog"> Hủy </v-btn>
        <v-btn
          :color="dialogConfig.color"
          variant="elevated"
          @click="confirmAction"
        >
          {{ dialogConfig.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  itemType: {
    type: String,
    required: true,
    // ( 'task', 'remove-member', 'archive-plan', 'delete-plan', 'leave-plan' )
  },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

// --- Dialog Configuration ---
// Dùng computed để thay đổi nội dung dialog dựa trên itemType
const dialogConfig = computed(() => {
  switch (props.itemType) {
    case 'task':
      return {
        title: 'Xóa công việc?',
        message: 'Bạn có chắc chắn muốn xóa công việc này không?',
        warning: 'Hành động này không thể hoàn tác.',
        icon: 'mdi-delete-outline',
        color: 'error',
        confirmText: 'Xóa',
      };
    case 'remove-member':
      return {
        title: 'Xóa thành viên?',
        message:
          'Bạn có chắc chắn muốn xóa thành viên này khỏi kế hoạch không?',
        warning: 'Họ sẽ mất quyền truy cập vào kế hoạch này.',
        icon: 'mdi-account-remove-outline',
        color: 'error',
        confirmText: 'Xóa',
      };
    case 'archive-plan':
      return {
        title: 'Lưu trữ kế hoạch?',
        message:
          'Bạn có muốn lưu trữ kế hoạch này không? Kế hoạch sẽ bị ẩn khỏi danh sách chính.',
        warning: 'Bạn có thể khôi phục lại sau.',
        icon: 'mdi-archive-outline',
        color: 'orange',
        confirmText: 'Lưu trữ',
      };
    case 'leave-plan': // Thêm case này
      return {
        title: 'Rời khỏi kế hoạch?',
        message:
          'Bạn có chắc chắn muốn rời khỏi kế hoạch này không?',
        warning: 'Bạn sẽ mất quyền truy cập, nhưng thành quả của bạn vẫn được giữ lại cho nhóm.',
        icon: 'mdi-logout',
        color: 'error',
        confirmText: 'Rời đi',
      };
    case 'delete-plan':
      return {
        title: 'XÓA VĨNH VIỄN KẾ HOẠCH?',
        message:
          'Bạn có hoàn toàn chắc chắn muốn xóa vĩnh viễn kế hoạch này không?',
        warning:
          'Tất cả dữ liệu liên quan (công việc, thành viên, check-in, comment...) sẽ bị mất. HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC.',
        icon: 'mdi-alert-octagon-outline',
        color: 'error',
        confirmText: 'Tôi hiểu, Xóa vĩnh viễn',
      };
    default:
      return {
        title: 'Xác nhận?',
        message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
        warning: '',
        icon: 'mdi-help-circle-outline',
        color: 'primary',
        confirmText: 'Xác nhận',
      };
  }
});

// --- Methods ---
const closeDialog = () => {
  emit('update:modelValue', false);
};

const confirmAction = () => {
  emit('confirm');
  // Component cha (PlanDetailView) sẽ xử lý việc đóng dialog sau khi hành động hoàn tất
};
</script>

<style scoped>
/* Style "Neo" cho dialog */
.neo-dialog-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.3) !important;
}
</style>