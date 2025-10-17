<template>
  <h2 class="text-center mb-4">Đăng nhập</h2>

  <div v-if="errorMessage" class="alert alert-danger" role="alert">
    {{ errorMessage }}
  </div>

  <form @submit.prevent="handleLogin">
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input
        type="email"
        class="form-control"
        id="email"
        v-model="form.email"
        required
        placeholder="nhapdiachi@email.com"
      />
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Mật khẩu</label>
      <input
        type="password"
        class="form-control"
        id="password"
        v-model="form.password"
        required
        placeholder="••••••••"
      />
    </div>
    <div class="d-grid mb-3">
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span v-else>Đăng nhập</span>
      </button>
    </div>
  </form>

  <div class="d-flex align-items-center mb-3">
    <hr class="flex-grow-1">
    <span class="px-3 text-muted">HOẶC</span>
    <hr class="flex-grow-1">
  </div>

  <div class="d-grid">
    <GoogleLoginButton />
  </div>

  <div class="text-center mt-3">
    <p>
      Chưa có tài khoản?
      <RouterLink to="/register">Đăng ký ngay</RouterLink>
    </p>
    <RouterLink to="/forgot-password">Quên mật khẩu?</RouterLink>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue'; // <-- IMPORT COMPONENT

const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(form);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
hr {
  color: #adb5bd;
}
</style>