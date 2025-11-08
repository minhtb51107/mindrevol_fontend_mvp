<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card class="neo-dialog-card" rounded="lg">
      <v-form ref="form" @submit.prevent="transferOwnership">
        <v-card-title class="font-weight-medium">
          <v-icon start color="grey-lighten-1"
            >mdi-account-cowboy-hat-outline</v-icon
          >
          Chuyển quyền sở hữu
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-2 mb-3 text-medium-emphasis">
            Chọn một thành viên để chuyển quyền sở hữu kế hoạch này.
            <strong class="text-warning-darken-1"
              >Lưu ý: Bạn sẽ mất quyền sở hữu</strong
            >
            và trở thành thành viên bình thường (MEMBER).
          </p>
          <v-autocomplete
            v-model="selectedUserId"
            :items="members"
            item-title="userFullName"
            item-value="userId"
            label="Chọn chủ sở hữu mới"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.userFullName">
                <template v-slot:prepend>
                  <v-avatar size="32" class="mr-3">
                    <span class="text-caption font-weight-medium">{{ getInitials(item.raw.userFullName) }}</span>
                  </v-avatar>
                </template>
                <v-list-item-subtitle>{{
                  item.raw.userEmail
                }}</v-list-item-subtitle>
              </v-list-item>
            </template>

            <template v-slot:selection="{ item }">
              <v-chip size="small">
                <v-avatar start>
                  <span class="text-caption font-weight-medium">{{ getInitials(item.raw.userFullName) }}</span>
                </v-avatar>
                {{ item.raw.userFullName }}
              </v-chip>
            </template>
          </v-autocomplete>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog" :disabled="isLoading">
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            type="submit"
            :loading="isLoading"
          >
            Xác nhận chuyển
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue'; // THÊM COMPUTED
import { usePlanStore } from '@/stores/plan';
import { toast } from 'vue-sonner'; 

const props = defineProps({
  modelValue: Boolean,
  // Sửa: Bỏ planId, vì store đã có currentPlan
  // planId: {
  //   type: String,
  //   required: true,
  // },
  members: { // Sửa: Nhận members từ prop
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'transfer-success']);

// --- Store và State ---
const planStore = usePlanStore();
const form = ref(null);
const isLoading = ref(false);
const selectedUserId = ref(null);

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || 'Bạn phải chọn một thành viên.',
};

// --- Methods ---
// Hàm lấy initials (giống PlanInfoPanel)
const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 0) return '?';
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
}

const closeDialog = () => {
  emit('update:modelValue', false);
};

const transferOwnership = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;

  isLoading.value = true;
  try {
    // Sửa: Gọi action mới
    await planStore.transferPlanOwnership(selectedUserId.value);
    
    toast.success('Đã gửi yêu cầu chuyển quyền sở hữu'); // Sửa: UI sẽ cập nhật qua WebSocket
    emit('transfer-success');
    closeDialog();
  } catch (error) {
    console.error('Lỗi khi chuyển quyền sở hữu:', error);
    toast.error('Lỗi', {
      description: error.message || 'Không thể chuyển quyền sở hữu.',
    });
  } finally {
    isLoading.value = false;
  }
};

// --- Watcher ---
watchEffect(() => {
  if (props.modelValue) {
    selectedUserId.value = null;
    if (form.value) {
      form.value.resetValidation();
    }
  }
});
</script>

<style scoped>
.neo-dialog-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.3) !important;
}
</style>