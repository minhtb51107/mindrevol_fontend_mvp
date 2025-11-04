<template>
  <v-card class="pa-5 pa-md-6">
    <div v-if="isLoading" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">Đang kích hoạt tài khoản...</p>
      <p class="text-medium-emphasis">Vui lòng chờ trong giây lát.</p>
    </div>

    <div v-else-if="isSuccess" class="text-center pa-5">
      <v-icon icon="mdi-check-circle-outline" color="success" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Kích hoạt thành công!</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập ngay bây giờ.
      </p>
      <v-btn color="primary" to="/login" variant="flat" rounded="lg">Về trang đăng nhập</v-btn>
    </div>

    <div v-else class="text-center pa-5">
      <v-icon icon="mdi-alert-circle-outline" color="error" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Kích hoạt thất bại</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ errorMessage }}
      </p>
      <v-btn color="primary" to="/register" variant="text" rounded="lg">Đăng ký lại?</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { VCard, VProgressCircular, VIcon, VBtn } from 'vuetify/components';

const route = useRoute();
const authStore = useAuthStore();
const isLoading = ref(true);
const errorMessage = ref('');
const isSuccess = ref(false);

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    errorMessage.value = 'Token kích hoạt không hợp lệ hoặc bị thiếu.';
    isLoading.value = false;
    isSuccess.value = false;
    return;
  }

  try {
    // Gọi action 'activateAccount' từ auth.js
    await authStore.activateAccount(token);
    isSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Kích hoạt thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* Thêm style nếu cần */
.v-card {
  max-width: 500px;
  margin: auto;
}
</style>