<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" persistent max-width="600px">
    <v-card class="glass-effect">
      <v-card-title>
        <span class="text-h5">Chỉnh sửa chi tiết Hành trình</span>
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
                  label="Tên hành trình *"
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
                  rows="3"
                  variant="outlined"
                  density="compact"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-textarea
                    v-model="formData.motivation"
                    label="Động lực (Tại sao bạn bắt đầu?)"
                    :rules="[rules.maxLength(1000)]"
                    counter="1000"
                    rows="3"
                    variant="outlined"
                    density="compact"
                    bg-color="amber-lighten-5"
                    hint="Thay đổi lý do nếu mục tiêu của bạn đã chuyển hướng."
                    persistent-hint
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
          <small class="text-medium-emphasis">* là trường bắt buộc</small>
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
import { usePlanStore } from '@/features/plan/stores/planStore';
import {
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VContainer, VRow, VCol,
  VTextField, VTextarea, VForm, VBtn, VSpacer, VAlert
} from 'vuetify/components';

const props = defineProps({
  modelValue: {
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
  motivation: '', // <-- THÊM VÀO STATE
  dailyGoal: '',
});

const rules = {
  required: (v) => !!v || 'Thông tin bắt buộc.',
  maxLength: (max) => (v) => (!v || v.length <= max) || `Tối đa ${max} ký tự.`,
};

const resetForm = () => {
  const plan = planStore.currentPlan;
  if (plan) {
    formData.title = plan.title || '';
    formData.description = plan.description || '';
    formData.motivation = plan.motivation || ''; // <-- ĐIỀN DỮ LIỆU
    formData.dailyGoal = plan.dailyGoal || '';
  }
  error.value = null;
  nextTick(() => {
    formRef.value?.resetValidation();
  });
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm();
  }
});

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const submit = async () => {
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  error.value = null;
  try {
    // GỌI ĐÚNG 1 THAM SỐ LÀ OBJECT DỮ LIỆU
    await planStore.updatePlanDetails({
      title: formData.title,
      description: formData.description,
      motivation: formData.motivation, // <-- GỬI LÊN SERVER
      dailyGoal: formData.dailyGoal,
    });
    
    emit('plan-updated');
    close();

  } catch (e) {
    console.error("Lỗi khi cập nhật chi tiết hành trình:", e);
    error.value = planStore.error || 'Đã xảy ra lỗi không xác định.';
  }
};
</script>

<style scoped>
/* .glass-effect { ... } */
</style>