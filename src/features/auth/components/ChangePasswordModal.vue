<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue')" persistent max-width="500px">
    <v-card rounded="lg">
      <v-card-title class="pa-4 bg-grey-lighten-3">
        <span class="text-h6">Đổi mật khẩu</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeModal"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text class="pt-4">
        <v-alert
          v-if="successMessage"
          type="success"
          density="compact"
          class="mb-4"
          closable
          @click:close="successMessage = ''"
          rounded="lg"
        >
          {{ successMessage }}
        </v-alert>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
          rounded="lg"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form @submit.prevent="performChange" ref="changePasswordForm">
          <v-text-field
            v-model="form.oldPassword"
            label="Mật khẩu cũ *"
            :type="showOldPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showOldPassword = !showOldPassword"
            :rules="[rules.required]"
            class="mb-4"
            rounded="lg"
            autofocus
          ></v-text-field>

          <v-text-field
            v-model="form.newPassword"
            label="Mật khẩu mới *"
            :type="showNewPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-plus-outline"
            :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showNewPassword = !showNewPassword"
            :rules="[rules.required, rules.minLength(8)]"
            class="mb-4"
            hint="Ít nhất 8 ký tự"
            persistent-hint
            rounded="lg"
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            label="Xác nhận mật khẩu mới *"
            :type="showConfirmPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check-outline"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
            :rules="[rules.required, rules.passwordMatch]"
            class="mb-4"
            rounded="lg"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal" :disabled="isLoading">Hủy</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isLoading"
          :disabled="isLoading"
          @click="performChange"
          rounded="lg"
        >
          Lưu thay đổi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { VDialog, VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VSpacer, VDivider, VIcon } from 'vuetify/components';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const changePasswordForm = ref(null);

const form = reactive({
  oldPassword: '',
  newPassword: '',
});
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minLength: (length) => value => (value && value.length >= length) || `Ít nhất ${length} ký tự.`,
  passwordMatch: value => value === form.newPassword || 'Mật khẩu xác nhận không khớp.',
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const resetForm = () => {
  form.oldPassword = '';
  form.newPassword = '';
  confirmPassword.value = '';
  errorMessage.value = '';
  successMessage.value = '';
  changePasswordForm.value?.resetValidation();
};

const performChange = async () => {
  if (!changePasswordForm.value) return;
  const { valid } = await changePasswordForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await authStore.handleChangePassword(form);
    successMessage.value = "Đổi mật khẩu thành công!";
    resetForm();
    setTimeout(closeModal, 1500);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm();
  }
});
</script>

<style scoped>
</style>