<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" persistent max-width="600px">
    <v-card class="glass-effect">
      <v-card-title>
        <span class="text-h5">Chỉnh sửa chi tiết kế hoạch</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>
        <v-form ref="formRef" @submit.prevent="submit">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.title"
                  label="Tên kế hoạch *"
                  :rules="[rules.required, rules.maxLength(100)]"
                  counter="100"
                  variant="outlined"
                  density="compact"
                  autofocus
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Mô tả"
                  :rules="[rules.maxLength(500)]"
                  counter="500"
                  rows="4"
                  variant="outlined"
                  density="compact"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.dailyGoal"
                  label="Mục tiêu hàng ngày"
                  :rules="[rules.maxLength(100)]"
                  counter="100"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
          <small>* là trường bắt buộc</small>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="medium-emphasis" variant="text" @click="close" :disabled="planStore.isLoading">
          Hủy
        </v-btn>
        <v-btn color="primary" variant="flat" @click="submit" :loading="planStore.isLoading">
          Lưu thay đổi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue';
import { usePlanStore } from '@/stores/plan';
import {
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VContainer, VRow, VCol,
  VTextField, VTextarea, VForm, VBtn, VSpacer, VAlert
} from 'vuetify/components';

const props = defineProps({
  modelValue: { // Dùng để v-model dialog
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'close', 'plan-updated']);

const planStore = usePlanStore();
const formRef = ref(null);
const error = ref(null);

const formData = reactive({
  title: '',
  description: '',
  dailyGoal: '',
});

const rules = {
  required: (v) => !!v || 'Thông tin bắt buộc.',
  maxLength: (max) => (v) => (v || '').length <= max || `Tối đa ${max} ký tự.`,
};

// Hàm reset form với dữ liệu từ store
const resetForm = () => {
  const plan = planStore.currentPlan;
  if (plan) {
    formData.title = plan.title || '';
    formData.description = plan.description || '';
    formData.dailyGoal = plan.dailyGoal || '';
  }
  error.value = null;
  nextTick(() => {
    formRef.value?.resetValidation();
  });
};

// Theo dõi khi dialog mở (props.modelValue = true)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm(); // Tải dữ liệu vào form khi mở
  }
});

const close = () => {
  emit('update:modelValue', false);
  emit('close'); // Gửi sự kiện close riêng nếu cần
};

const submit = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  error.value = null;
  try {
    // Gọi action mới trong plan store
    await planStore.updatePlanDetails({
      title: formData.title,
      description: formData.description,
      dailyGoal: formData.dailyGoal,
    });
    
    emit('plan-updated'); // Báo cho PlanDetailView biết để hiển thị snackbar
    close();

  } catch (e) {
    console.error("Lỗi khi cập nhật chi tiết plan:", e);
    error.value = planStore.error || 'Đã xảy ra lỗi không xác định.';
  }
};
</script>

<style scoped>
.glass-effect {
  /* Bạn có thể thêm style "glassmorphism" ở đây nếu muốn */
}
</style>