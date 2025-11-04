// File: src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'
import { usePlanCreatorStore } from '@/stores/planCreator';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/activate',
      name: 'activate',
      component: () => import('../views/ActivationView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plans/create',
      name: 'create-plan',
      component: () => import('../views/CreatePlanView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plan/:shareableLink',
      name: 'plan-details',
      component: () => import('../views/PlanDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/create-plan/schedule',
      name: 'plan-schedule', // Đây là Bước 2
      component: () => import('@/views/SchedulePlanView.vue'),
      meta: { requiresAuth: true, layout: 'default' },
      beforeEnter: (to, from, next) => {
        // Guard: Chỉ cho phép vào Bước 2 nếu có dữ liệu từ Bước 1
        const creatorStore = usePlanCreatorStore();
        if (creatorStore.durationInDays > 0 && creatorStore.startDate) {
          next(); // Cho phép truy cập
        } else {
          // Không có dữ liệu, đá về Bước 1
          console.warn('Truy cập /schedule không hợp lệ, chuyển về /create-plan');
          next({ name: 'create-plan' });
        }
      }
    },
    // *** THÊM ROUTE PROFILE ***
    {
      path: '/profile', // Đường dẫn cho trang profile
      name: 'profile',
      component: () => import('../views/ProfileView.vue'), // Trỏ đến component ProfileView
      meta: { requiresAuth: true } // Yêu cầu đăng nhập
    },
    // *** KẾT THÚC THÊM ***
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => { // Mark as async
  const authStore = useAuthStore();

  // Ensure initial data (including profile) is loaded if authenticated
  // This helps prevent flickering or missing data on direct navigation/refresh
  if (authStore.isAuthenticated && !authStore.profile && !authStore.isLoadingProfile) {
    // Don't await here if fetchUserProfile updates state reactively
    // But if subsequent logic *depends* on profile being loaded, you might need to await
    // For now, let it run in the background
     authStore.loadInitialData(); // Call the combined load function
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    authStore.returnUrl = to.fullPath;
    next('/login');
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router