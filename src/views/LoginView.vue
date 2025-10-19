<template>
  <v-card class="elevation-3 pa-5"> 
    <v-card-title class="text-center text-h5 mb-6">Đăng nhập</v-card-title>
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

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-email-outline"
          placeholder="nhapdiachi@email.com"
          :rules="[rules.required, rules.email]" 
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="Mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          placeholder="••••••••"
          :rules="[rules.required]"
          class="mb-3"
        ></v-text-field>

        <v-btn
          type="submit"
          color="primary"
          block
          size="large" 
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-4"
        >
          Đăng nhập
        </v-btn>
      </v-form>

      <v-divider class="my-4"> 
        <span class="text-caption text-grey px-2">HOẶC</span>
      </v-divider>

       
      <div class="d-flex justify-center mb-4">
        <GoogleLoginButton />
      </div>

      <div class="text-center">
        <p class="text-body-2"> 
          Chưa có tài khoản?
          <RouterLink to="/register" class="text-primary text-decoration-none"> Đăng ký ngay</RouterLink>
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
// Import các component Vuetify đã dùng trong template
import { VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VDivider } from 'vuetify/components';

const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

// Basic validation rules (có thể tách ra file riêng)
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Email không hợp lệ.'
  },
};

const handleLogin = async () => {
  // Kiểm tra validation trước khi submit (Vuetify form tự xử lý nếu dùng đúng cách)
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(form);
    // Router điều hướng trong store
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* CSS tùy chỉnh nếu cần, ví dụ: */
.v-card {
  max-width: 500px; /* Giới hạn chiều rộng card */
  margin: auto;
}
.text-decoration-none {
  text-decoration: none;
}
</style>