<template>
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
      <h2 class="mb-4">Đổi mật khẩu</h2>

      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

      <form @submit.prevent="performChange">
        <div class="mb-3">
          <label for="oldPassword" class="form-label">Mật khẩu cũ</label>
          <input type="password" class="form-control" id="oldPassword" v-model="form.oldPassword" required />
        </div>
        <div class="mb-3">
          <label for="newPassword" class="form-label">Mật khẩu mới</label>
          <input type="password" class="form-control" id="newPassword" v-model="form.newPassword" required minlength="8" />
        </div>
        <div class="mb-3">
          <label for="confirmPassword" class="form-label">Xác nhận mật khẩu mới</label>
          <input type="password" class="form-control" id="confirmPassword" v-model="confirmPassword" required />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
          <span v-else>Lưu thay đổi</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const form = reactive({
  oldPassword: '',
  newPassword: '',
});
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const performChange = async () => {
  if (form.newPassword !== confirmPassword.value) {
    errorMessage.value = "Mật khẩu xác nhận không khớp.";
    successMessage.value = '';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await authStore.handleChangePassword(form);
    successMessage.value = "Đổi mật khẩu thành công!";
    // Xóa form sau khi thành công
    form.oldPassword = '';
    form.newPassword = '';
    confirmPassword.value = '';
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>