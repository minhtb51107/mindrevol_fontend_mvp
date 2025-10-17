<template>
  <div v-if="!isSuccess">
    <h2 class="text-center mb-3">Quên Mật khẩu</h2>
    <p class="text-center text-muted mb-4">Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.</p>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <form @submit.prevent="requestReset">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" v-model="email" required placeholder="email@example.com"/>
      </div>
      <div class="d-grid">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
          <span v-else>Gửi liên kết</span>
        </button>
      </div>
    </form>
    <div class="text-center mt-3">
      <RouterLink to="/login">Quay lại đăng nhập</RouterLink>
    </div>
  </div>
  <div v-else class="text-center">
    <i class="bi bi-envelope-check-fill text-success" style="font-size: 4rem;"></i>
    <h3 class="mt-3">Kiểm tra Email của bạn</h3>
    <p class="text-muted">
      Nếu email <strong>{{ email }}</strong> tồn tại trong hệ thống, bạn sẽ nhận được một liên kết để đặt lại mật khẩu trong vài phút tới.
    </p>
    <RouterLink to="/login" class="btn btn-primary mt-2">Về trang đăng nhập</RouterLink>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

const requestReset = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.handleForgotPassword(email.value);
    isSuccess.value = true;
  } catch (error) {
    // Vẫn hiển thị thành công để bảo mật, không cho hacker biết email nào tồn tại
    isSuccess.value = true; 
  } finally {
    isLoading.value = false;
  }
};
</script>