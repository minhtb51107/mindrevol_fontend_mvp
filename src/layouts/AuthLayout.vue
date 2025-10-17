<template>
  <div class="auth-layout-container">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm">
            <div class="card-body p-4">
              <RouterView />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
</script>

<style scoped>
.auth-layout-container {
  background-color: #f8f9fa; /* Màu nền xám nhạt */
}
.min-vh-100 {
  min-height: 100vh;
}
</style>