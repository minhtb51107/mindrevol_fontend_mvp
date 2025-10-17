<template>
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const route = useRoute();

// Dựa vào meta.layout của route để quyết định dùng layout nào
const layoutComponent = computed(() => {
  switch (route.meta.layout) {
    case 'AuthLayout':
      return AuthLayout;
    default:
      return DefaultLayout;
  }
});
</script>