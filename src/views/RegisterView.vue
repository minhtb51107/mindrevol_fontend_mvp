<template>
  <div v-if="!isSuccess">
    <h2 class="text-center mb-4">Tạo tài khoản</h2>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleRegister">
      <div class="mb-3">
        <label for="fullname" class="form-label">Họ và tên</label>
        <input type="text" class="form-control" id="fullname" v-model="form.fullname" required />
      </div>
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" v-model="form.email" required />
      </div>
      <div class="mb-3">
        <label for="phoneNumber" class="form-label">Số điện thoại</label>
        <input type="tel" class="form-control" id="phoneNumber" v-model="form.phoneNumber" required />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Mật khẩu</label>
        <input type="password" class="form-control" id="password" v-model="form.password" required minlength="8" />
      </div>
      <div class="d-grid">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>Đăng ký</span>
        </button>
      </div>
    </form>
    <div class="text-center mt-3">
      <p>
        Đã có tài khoản?
        <RouterLink to="/login">Đăng nhập</RouterLink>
      </p>
    </div>
  </div>

  <div v-else class="text-center">
    <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
    <h3 class="mt-3">Đăng ký thành công!</h3>
    <p class="text-muted">
      Chúng tôi đã gửi một liên kết kích hoạt đến email <strong>{{ form.email }}</strong>.
      Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam) để hoàn tất.
    </p>
    <RouterLink to="/login" class="btn btn-primary mt-2">Về trang đăng nhập</RouterLink>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const form = reactive({
  fullname: '',
  email: '',
  phoneNumber: '',
  password: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

const handleRegister = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // Dữ liệu form khớp với RegisterRequest.java
    await authStore.register(form); 
    isSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>