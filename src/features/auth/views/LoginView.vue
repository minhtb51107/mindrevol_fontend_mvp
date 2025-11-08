<template>
  <v-card class="pa-5 pa-md-6">
    <v-card-title class="text-center text-h5 mb-6">Đăng nhập</v-card-title>
    <v-card-text>
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

      <v-form @submit.prevent="handleLogin" ref="loginFormRef">
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          placeholder="nhapdiachi@email.com"
          :rules="[rules.required, rules.email]"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="Mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          placeholder="••••••••"
          :rules="[rules.required]"
          class="mb-4"
        ></v-text-field>

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-5"
          rounded="lg"
          elevation="2"
        >
          Đăng nhập
        </v-btn>
      </v-form>

      <v-divider class="my-5">
        <span class="text-caption text-grey px-2">HOẶC</span>
      </v-divider>

      <div class="d-flex justify-center mb-5">
        <GoogleLoginButton />
      </div>

      <div class="text-center">
        <p class="text-body-2 mb-1">
          Chưa có tài khoản?
          <RouterLink to="/register" class="text-primary text-decoration-none font-weight-medium"> Đăng ký ngay</RouterLink>
        </p>
        <RouterLink to="/forgot-password" class="text-body-2 text-primary text-decoration-none">Quên mật khẩu?</RouterLink>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';
import { VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VDivider } from 'vuetify/components';

const authStore = useAuthStore();
const loginFormRef = ref(null);

const form = reactive({
  email: '',
  password: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Email không hợp lệ.'
  },
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  const { valid } = await loginFormRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(form);
  } catch (error) {
    // --- (PHẦN SỬA ĐỔI) ---
    if (error.response) {
      // Lỗi có phản hồi từ server (sai pass, 401, 500, chưa kích hoạt)
      errorMessage.value = error.response.data?.message || 'Email hoặc mật khẩu không chính xác.';
    } else if (error.request) {
      // Lỗi request (không kết nối được server, timeout)
      errorMessage.value = 'Không thể kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
    } else {
      // Lỗi khác (lỗi logic JS)
      errorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
    // --- (KẾT THÚC SỬA ĐỔI) ---
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
}
:deep(#google-btn > div) {
  border-radius: 8px !important;
  border: 1px solid var(--v-theme-border) !important;
}
:deep(#google-btn > div:hover) {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>