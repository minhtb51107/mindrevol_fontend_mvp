// File: src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/authStore'
// [CHANGED] Import Home từ vị trí mới
import HomeView from '@/features/dashboard/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    // === AUTH ROUTES ===
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/features/auth/views/RegisterView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/activate',
      name: 'activate',
      component: () => import('@/features/auth/views/ActivationView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/features/auth/views/ResetPasswordView.vue'),
      meta: { layout: 'AuthLayout' }
    },
    {
      path: '/change-password', // (Có thể giữ hoặc bỏ nếu đã tích hợp vào ProfileModal)
      name: 'change-password',
      component: () => import('@/features/auth/views/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/features/auth/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('@/features/community/views/FriendsView.vue'), // Hoặc đường dẫn bạn vừa tạo
      meta: { requiresAuth: true }
    },

    // === PLAN ROUTES ===
    {
      path: '/plans/create',
      name: 'create-plan', // Giữ nguyên path và name (vì file vẫn tên cũ)
      component: () => import('@/features/plan/views/CreatePlanView.vue'), // File này đã bị dán đè
      meta: { requiresAuth: true }
    },
    // (Route 'plan-schedule' đã bị xóa)
    {
      path: '/plan/:shareableLink',
      name: 'plan-details', // Giữ nguyên path và name
      component: () => import('@/features/plan/views/PlanDetailView.vue'), // File này đã bị dán đè
      meta: { requiresAuth: true }
    },
    // {
    //   path: '/create-plan/schedule',
    //   name: 'plan-schedule',
    //   component: () => import('@/features/plan/views/SchedulePlanView.vue'),
    //   meta: { requiresAuth: true },
    //   beforeEnter: (to, from, next) => {
    //     // [CHANGED] Cập nhật đường dẫn import store trong navigation guard
    //     import('@/features/plan/stores/planCreatorStore').then(({ usePlanCreatorStore }) => {
    //         const creatorStore = usePlanCreatorStore();
    //         if (creatorStore.durationInDays > 0 && creatorStore.startDate) {
    //             next();
    //         } else {
    //             next({ name: 'create-plan' });
    //         }
    //     });
    //   }
    // },
    
    {
      path: '/plan/:shareableLink',
      name: 'plan-details',
      component: () => import('@/features/plan/views/PlanDetailView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (authStore.isAuthenticated && !authStore.profile && !authStore.isLoadingProfile) {
     authStore.loadInitialData();
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