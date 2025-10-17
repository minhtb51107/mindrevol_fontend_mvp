<template>
  <div v-if="!isSuccess">
    <h2 class="text-center mb-4">Đặt lại mật khẩu mới</h2>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <form @submit.prevent="performReset">
      <div class="mb-3">
        <label for="password" class="form-label">Mật khẩu mới</label>
        <input type="password" class="form-control" id="password" v-model="form.newPassword" required minlength="8" />
      </div>
      <div class="mb-3">
        <label for="confirmPassword" class="form-label">Xác nhận mật khẩu mới</label>
        <input type="password" class="form-control" id="confirmPassword" v-model="confirmPassword" required />
      </div>
      <div class="d-grid">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
          <span v-else>Lưu mật khẩu</span>
        </button>
      </div>
    </form>
  </div>
  <div v-else class="text-center">
    <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
    <h3 class="mt-3">Thành công!</h3>
    <p class="text-muted">Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.</p>
    <RouterLink to="/login" class="btn btn-primary mt-2">Đến trang đăng nhập</RouterLink>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  token: '',
  newPassword: '',
});
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

onMounted(() => {
  form.token = route.query.token;
  if (!form.token) {
    errorMessage.value = "Token không hợp lệ hoặc đã hết hạn.";
  }
});

const performReset = async () => {
  if (form.newPassword !== confirmPassword.value) {
    errorMessage.value = "Mật khẩu xác nhận không khớp.";
    return;
  }
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