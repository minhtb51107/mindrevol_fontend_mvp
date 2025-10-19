import { defineStore } from 'pinia';
import authService from '@/api/authService';
import router from '@/router';
import apiClient from '@/api/axios'; // Import apiClient for direct use in refresh
import { usePlanStore } from './plan'; // Import planStore
import { useNotificationStore } from './notificationStore'; // Import notificationStore

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null, // Ensure refreshToken is loaded
        user: JSON.parse(localStorage.getItem('user')) || null,
        returnUrl: null,
        isRefreshing: false, // Flag to prevent multiple refresh attempts
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        currentUser: (state) => state.user,
    },

    actions: {
        async login(credentials) {
            try {
                const response = await authService.login(credentials);
                this.accessToken = response.data.accessToken;
                this.refreshToken = response.data.refreshToken;
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                await this.fetchCurrentUser();
                // Navigate to intended url or home
                 const redirectPath = this.returnUrl || '/';
                 this.returnUrl = null; // Clear returnUrl after use
                 router.push(redirectPath);
            } catch (error) {
                console.error("Login failed:", error);
                // Clear tokens on failed login attempt if needed? Maybe not.
                throw error;
            }
        },

        async fetchCurrentUser() {
            if (!this.accessToken) return;
            try {
                const response = await authService.getCurrentUser();
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                console.error("Failed to fetch user:", error);
                 // If fetching user fails due to auth error, logout might be too aggressive
                 // Only logout if error is definitively an invalid token (e.g., specific 401/403)
                 if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                     console.log("Token invalid fetching user, logging out.");
                     this.logout();
                 }
            }
        },

        async register(userInfo) {
            return authService.register(userInfo);
        },

        async activateAccount(token) {
            return authService.activate(token);
        },

        async handleForgotPassword(email) {
            return authService.forgotPassword(email);
        },
        async handleResetPassword(data) {
            return authService.resetPassword(data);
        },
        async handleChangePassword(passwords) {
            return authService.changePassword(passwords);
        },
        async handleGoogleLogin(googleToken) {
            try {
                const response = await authService.loginWithGoogle(googleToken);
                this.accessToken = response.data.accessToken;
                this.refreshToken = response.data.refreshToken;
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                await this.fetchCurrentUser();
                 const redirectPath = this.returnUrl || '/';
                 this.returnUrl = null;
                 router.push(redirectPath);
            } catch (error) {
                console.error("Google Login failed:", error);
                throw error;
            }
        },

        async logout() {
          const planStore = usePlanStore(); // Lấy plan store
            const notificationStore = useNotificationStore(); // Lấy notification store
            // Optional: Call backend logout endpoint if it exists and needs the refresh token
            // try {
            //   if (this.refreshToken) {
            //     await authService.logout(this.refreshToken);
            //   }
            // } catch (error) {
            //   console.error("Backend logout failed:", error);
            // }

            // Clear local state and storage
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            this.isRefreshing = false; // Reset refresh flag
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Redirect to login
            // Use replace to prevent going back to the logged-in state
            // --- GỌI CLEAR ACTIONS ---
            planStore.clearUserPlans(); // Xóa dữ liệu plans
            notificationStore.clearNotifications(); // Xóa dữ liệu notifications
            // --- KẾT THÚC ---
            router.replace('/login');
        },

        async refreshAccessToken() {
            if (!this.refreshToken) {
                console.log("No refresh token available, logging out.");
                this.logout();
                return Promise.reject(new Error("No refresh token"));
            }
            if (this.isRefreshing) {
                 // Avoid concurrent refresh attempts
                 return Promise.reject(new Error("Token refresh already in progress"));
            }

            this.isRefreshing = true;
            console.log("Attempting to refresh access token...");

            try {
                 // Directly use apiClient or authService call
                const response = await apiClient.post('/auth/refresh-token', {}, {
                   headers: {
                       // Send the refresh token as a Bearer token for this specific request
                       'Authorization': `Bearer ${this.refreshToken}`
                   }
                });

                this.accessToken = response.data.accessToken;
                // Optionally update refresh token if backend sends a new one
                if (response.data.refreshToken) {
                     this.refreshToken = response.data.refreshToken;
                     localStorage.setItem('refreshToken', this.refreshToken);
                }
                localStorage.setItem('accessToken', this.accessToken);
                console.log("Access token refreshed successfully.");
                this.isRefreshing = false;
                return this.accessToken; // Return the new token
            } catch (error) {
                console.error("Failed to refresh token:", error);
                this.isRefreshing = false;
                // If refresh fails (e.g., refresh token expired), log out
                this.logout();
                return Promise.reject(error);
            }
        },
    }
});