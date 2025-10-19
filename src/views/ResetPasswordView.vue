<template>
  <v-card class="elevation-3 pa-5">
    <div v-if="!isSuccess">
      <v-card-title class="text-center text-h5 mb-6">Đặt lại mật khẩu mới</v-card-title>
      <v-card-text>
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

        <v-form @submit.prevent="performReset" ref="resetPasswordForm">
          <v-text-field
            v-model="form.newPassword"
            label="Mật khẩu mới"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
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
            block
            size="large"
            :loading="isLoading"
            :disabled="isLoading"
            class="mt-4"
          >
            Lưu mật khẩu
          </v-btn>
        </v-form>
      </v-card-text>
    </div>
    <div v-else class="text-center pa-5">
      <v-icon icon="mdi-check-circle-outline" color="success" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Thành công!</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
      </p>
      <v-btn color="primary" to="/login" variant="flat">Đến trang đăng nhập</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VIcon } from 'vuetify/components';

const route = useRoute();
const authStore = useAuthStore();
const resetPasswordForm = ref(null);

const form = reactive({
  token: '',
  newPassword: '',
});
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

onMounted(() => {
  form.token = route.query.token;
  if (!form.token) {
    errorMessage.value = "Token không hợp lệ hoặc đã hết hạn.";
    // Có thể điều hướng người dùng về trang forgot-password
    // router.push('/forgot-password');
  }
});

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minLength: (length) => value => (value && value.length >= length) || `Ít nhất ${length} ký tự.`,
  passwordMatch: value => value === form.newPassword || 'Mật khẩu xác nhận không khớp.',
};

const performReset = async () => {
  const { valid } = await resetPasswordForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.handleResetPassword(form);
    isSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.v-card {
  max-width: 500px;
  margin: auto;
}
</style>