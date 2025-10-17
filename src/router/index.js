// File: src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true } // Trang này yêu cầu đăng nhập
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { layout: 'AuthLayout' } // Sử dụng layout riêng cho trang login
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { layout: 'AuthLayout' } // Sử dụng layout riêng cho trang register
    },
    {
      path: '/activate',
      name: 'activate',
      component: () => import('../views/ActivationView.vue'),
      meta: { layout: 'AuthLayout' } // Sử dụng layout riêng
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
    meta: { requiresAuth: true } // Yêu cầu đăng nhập để vào trang này
  },
  {
    path: '/plans/create',
    name: 'create-plan',
    component: () => import('../views/CreatePlanView.vue'),
    meta: { requiresAuth: true }
  },
  {
    // Route động với tham số là link chia sẻ
    path: '/plan/:shareableLink', 
    name: 'plan-details',
    // Component cho trang này sẽ được tạo ở giai đoạn tiếp theo
    component: () => import('../views/PlanDetailView.vue'), 
    meta: { requiresAuth: true }
  },
  ]
})

// Navigation Guard: Chạy trước mỗi lần chuyển route
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Nếu route yêu cầu đăng nhập mà user chưa đăng nhập
    // Lưu lại URL mà user muốn vào để có thể redirect lại sau khi login thành công
    authStore.returnUrl = to.fullPath;
    next('/login');
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    // Nếu đã đăng nhập thì không cho vào trang login/register nữa
    next('/');
  } else {
    next(); // Cho phép đi tiếp
  }
});

export default router