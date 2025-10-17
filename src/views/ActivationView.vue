<template>
  <div class="text-center">
    <div v-if="status === 'activating'">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h3 class="mt-3">Đang kích hoạt tài khoản...</h3>
      <p class="text-muted">Vui lòng đợi trong giây lát.</p>
    </div>

    <div v-if="status === 'success'">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
      <h3 class="mt-3">Kích hoạt thành công!</h3>
      <p class="text-muted">{{ message }}</p>
      <RouterLink to="/login" class="btn btn-primary mt-2">Tiến đến đăng nhập</RouterLink>
    </div>

    <div v-if="status === 'error'">
      <i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>
      <h3 class="mt-3">Kích hoạt thất bại</h3>
      <p class="text-danger">{{ message }}</p>
      <RouterLink to="/register" class="btn btn-secondary mt-2">Thử đăng ký lại</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const status = ref('activating'); // 'activating', 'success', 'error'
const message = ref('');

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    status.value = 'error';
    message.value = 'Liên kết kích hoạt không hợp lệ hoặc đã thiếu token.';
    return;
  }

  try {
    const response = await authStore.activateAccount(token);
    status.value = 'success';
    message.value = response.data; // Lấy thông báo từ backend
  } catch (error) {
    status.value = 'error';
    message.value = error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.';
  }
});
</script>