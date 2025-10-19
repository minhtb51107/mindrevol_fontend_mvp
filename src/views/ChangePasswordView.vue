<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-2 pa-5">
          <v-card-title class="text-h5 mb-6">Đổi mật khẩu</v-card-title>
          <v-card-text>
            <v-alert
              v-if="successMessage"
              type="success"
              density="compact"
              class="mb-4"
              closable
              @click:close="successMessage = ''"
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
            >
              {{ errorMessage }}
            </v-alert>

            <v-form @submit.prevent="performChange" ref="changePasswordForm">
              <v-text-field
                v-model="form.oldPassword"
                label="Mật khẩu cũ"
                :type="showOldPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showOldPassword = !showOldPassword"
                :rules="[rules.required]"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="form.newPassword"
                label="Mật khẩu mới"
                :type="showNewPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-lock-plus-outline"
                :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showNewPassword = !showNewPassword"
                :rules="[rules.required, rules.minLength(8)]"
                class="mb-3"
                hint="Ít nhất 8 ký tự"
                persistent-hint
              ></v-text-field>

              <v-text-field
                v-model="confirmPassword"
                label="Xác nhận mật khẩu mới"
                :type="showConfirmPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-lock-check-outline"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                :rules="[rules.required, rules.passwordMatch]"
                class="mb-3"
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                class="mt-4"
              >
                Lưu thay đổi
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert } from 'vuetify/components';

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

const performChange = async () => {
  const { valid } = await changePasswordForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await authStore.handleChangePassword(form);
    successMessage.value = "Đổi mật khẩu thành công!";
    form.oldPassword = '';
    form.newPassword = '';
    confirmPassword.value = '';
    changePasswordForm.value.resetValidation(); // Reset trạng thái validation
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Thêm CSS nếu cần */
</style>