<template>
  <v-card class="elevation-3 pa-8 text-center">
    <div v-if="status === 'activating'">
      <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
      <h3 class="text-h6 mb-2">Đang kích hoạt tài khoản...</h3>
      <p class="text-body-2 text-medium-emphasis">Vui lòng đợi trong giây lát.</p>
    </div>

    <div v-if="status === 'success'">
      <v-icon icon="mdi-check-circle-outline" color="success" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Kích hoạt thành công!</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ message }}</p>
      <v-btn color="primary" to="/login" variant="flat">Tiến đến đăng nhập</v-btn>
    </div>

    <div v-if="status === 'error'">
       <v-icon icon="mdi-close-circle-outline" color="error" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Kích hoạt thất bại</h3>
      <p class="text-body-2 text-red mb-4">{{ message }}</p>
      <v-btn color="grey" to="/register" variant="outlined">Thử đăng ký lại</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { VCard, VProgressCircular, VIcon, VBtn } from 'vuetify/components';

const route = useRoute();
const authStore = useAuthStore();

const status = ref('activating');
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
    message.value = response.data || "Tài khoản đã được kích hoạt.";
  } catch (error) {
    status.value = 'error';
    message.value = error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.';
  }
});
</script>

<style scoped>
.v-card {
  max-width: 500px;
  margin: auto;
}
</style>