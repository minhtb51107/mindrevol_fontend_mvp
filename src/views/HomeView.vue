<template>
  <div class="text-center p-5 bg-light rounded-3">
    <h1 class="display-5">Chào mừng, {{ userFullName }}!</h1>
    <p class="lead">Sẵn sàng để bắt đầu một hành trình học tập mới cùng bạn bè?</p>
    <hr class="my-4">
    <p>Tạo một kế hoạch, mời bạn bè, và cùng nhau theo dõi tiến độ mỗi ngày.</p>
    <RouterLink to="/plans/create" class="btn btn-primary btn-lg">
      <i class="bi bi-plus-circle me-2"></i>Tạo kế hoạch học ngay
    </RouterLink>
  </div>

  <div class="mt-5">
    <h3 class="mb-3">Các kế hoạch bạn đang tham gia</h3>
    <p class="text-muted">Bạn chưa tham gia kế hoạch nào.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const userFullName = computed(() => {
  return authStore.currentUser?.fullname || 'bạn';
});
</script>