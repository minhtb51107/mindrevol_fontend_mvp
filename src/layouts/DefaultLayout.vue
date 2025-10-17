<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom shadow-sm">
      <div class="container">
        <RouterLink class="navbar-brand" to="/">
          <i class="bi bi-robot"></i> MindRevol
        </RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavDropdown">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/">Dashboard</RouterLink>
            </li>
            </ul>
          <div v-if="authStore.isAuthenticated" class="dropdown">
            <a href="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
              <span class="me-2">Chào, {{ userFullName }}</span>
              <i class="bi bi-person-circle fs-4"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end text-small" aria-labelledby="dropdownUser1">
              <li><a class="dropdown-item" href="#">Trang cá nhân</a></li>
              <li><RouterLink class="dropdown-item" to="/change-password">Đổi mật khẩu</RouterLink></li>
              <li><a class="dropdown-item" href="#">Cài đặt</a></li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                  <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <main class="container my-4">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const userFullName = computed(() => {
  return authStore.currentUser?.fullname || 'bạn';
});

const handleLogout = () => {
  authStore.logout();
};
</script>

<style scoped>
.my-4 {
  margin-top: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}
</style>