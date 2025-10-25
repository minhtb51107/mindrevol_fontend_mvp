// File: src/stores/auth.js
import { defineStore } from 'pinia';
import authService from '@/api/authService';
import userService from '@/api/userService'; // *** THÊM IMPORT userService ***
import router from '@/router';
import apiClient from '@/api/axios';
import { usePlanStore } from './plan';
import { useNotificationStore } from './notificationStore';
import { useProgressStore } from './progress';
import { useFeedStore } from '@/stores/feedStore';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
        user: JSON.parse(localStorage.getItem('user')) || null, // Stores UserDetailsResponse initially
        profile: null, // *** THÊM STATE ĐỂ LƯU ProfileResponse ***
        returnUrl: null,
        isRefreshing: false,
        isLoadingProfile: false, // *** THÊM STATE LOADING CHO PROFILE ***
        profileError: null,      // *** THÊM STATE ERROR CHO PROFILE ***
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        currentUser: (state) => state.user, // Vẫn giữ user ban đầu (UserDetailsResponse)
        userProfile: (state) => state.profile, // Getter cho profile chi tiết
        // *** SỬA GETTER userFullName ĐỂ ƯU TIÊN PROFILE ***
        userFullName: (state) => state.profile?.fullname || state.user?.fullname || 'bạn',
        // *** THÊM GETTER userAvatarUrl ***
        userAvatarUrl: (state) => state.profile?.photoUrl || null, // Lấy avatar từ profile
        // *** SỬA GETTER userInitial ĐỂ ƯU TIÊN PROFILE FULLNAME ***
        userInitial: (state) => {
            const name = state.profile?.fullname || state.user?.fullname;
            return name ? name.charAt(0).toUpperCase() : '?';
        }
    },

    actions: {
        async login(credentials) {
            try {
                const response = await authService.login(credentials);
                this.accessToken = response.data.accessToken;
                this.refreshToken = response.data.refreshToken;
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                // Fetch UserDetailsResponse sau khi login (để lấy roles/permissions nhanh)
                await this.fetchCurrentUserDetails();
                // Fetch ProfileResponse sau đó (để có avatar, etc.) - chạy ngầm
                this.fetchUserProfile(); // Không cần await ở đây

                const redirectPath = this.returnUrl || '/';
                this.returnUrl = null;
                router.push(redirectPath);
            } catch (error) {
                console.error("Login failed:", error);
                this.profile = null; // Reset profile nếu login fail
                this.user = null; // Reset user details nếu login fail
                localStorage.removeItem('user');
                throw error;
            }
        },

        // Đổi tên hàm này để rõ ràng hơn
        async fetchCurrentUserDetails() {
            if (!this.accessToken) return;
            // Không cần set loading ở đây vì thường chạy ngầm
            try {
                // API /auth/me trả về UserDetailsResponse
                const response = await authService.getCurrentUser();
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                console.error("Failed to fetch user details:", error);
                 if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                     console.log("Token invalid fetching user details, logging out.");
                     await this.logout(); // Sử dụng await nếu logout là async
                 }
            }
        },

        // *** HÀM MỚI ĐỂ FETCH PROFILE ***
        async fetchUserProfile() {
            if (!this.accessToken) {
                this.profile = null; // Clear profile if not authenticated
                return;
            }
            this.isLoadingProfile = true;
            this.profileError = null;
            try {
                // API /users/profile trả về ProfileResponse
                const response = await userService.getMyProfile();
                this.profile = response.data;
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                this.profileError = "Không thể tải thông tin cá nhân.";
                this.profile = null; // Clear profile on error
                 // Không logout ở đây, user có thể vẫn dùng được các chức năng khác
                 if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.log("Token invalid fetching profile, logging out.");
                    await this.logout();
                 }
            } finally {
                this.isLoadingProfile = false;
            }
        },

        // *** HÀM MỚI ĐỂ UPDATE PROFILE ***
        async updateUserProfile(profileData) {
             if (!this.accessToken) throw new Error("Chưa đăng nhập.");
             this.isLoadingProfile = true; // Sử dụng loading riêng cho update
             this.profileError = null;
             try {
                 const response = await userService.updateMyProfile(profileData);
                 this.profile = response.data; // Cập nhật state profile

                 // Cập nhật lại fullname trong user (UserDetailsResponse) nếu có
                 // Điều này đảm bảo các getter dùng user cũng có fullname mới nhất
                 if (this.user && this.profile?.fullname) {
                    this.user.fullname = this.profile.fullname;
                    localStorage.setItem('user', JSON.stringify(this.user)); // Cập nhật local storage
                 }
                 return this.profile; // Trả về profile đã cập nhật
             } catch (error) {
                 console.error("Failed to update profile:", error);
                 this.profileError = error.response?.data?.message || "Cập nhật thông tin thất bại.";
                 throw error; // Ném lỗi để component xử lý
             } finally {
                 this.isLoadingProfile = false;
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

                await this.fetchCurrentUserDetails();
                await this.fetchUserProfile(); // Fetch profile sau khi login Google (await để đảm bảo có trước khi redirect)

                 const redirectPath = this.returnUrl || '/';
                 this.returnUrl = null;
                 router.push(redirectPath);
            } catch (error) {
                console.error("Google Login failed:", error);
                this.profile = null; // Reset profile on failed login
                this.user = null; // Reset user details on failed login
                localStorage.removeItem('user');
                throw error;
            }
        },

        async logout() {
          const planStore = usePlanStore();
          const notificationStore = useNotificationStore();
          const feedStore = useFeedStore(); // *** LẤY feedStore ***

            // Clear local state and storage FIRST
            const refreshTokenToInvalidate = this.refreshToken; // Store token before clearing state
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            this.profile = null; // *** CLEAR PROFILE ***
            this.isRefreshing = false;
            this.isLoadingProfile = false; // *** CLEAR LOADING ***
            this.profileError = null;      // *** CLEAR ERROR ***
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            this.accessToken = null;

            // Clear other stores
            planStore.clearUserPlans();
            notificationStore.clearNotifications();
            progressStore.clearDashboard(); // *** CÓ THỂ GỘP clearUserStats VÀO ĐÂY ***
            progressStore.clearUserStats(); // *** GỌI HÀM CLEAR STATS ***
            feedStore.clearFeed(); // *** GỌI CLEAR FEED ***

             // Redirect BEFORE calling backend logout (improves UX)
            // Use replace to avoid back button issues
            if (router.currentRoute.value.name !== 'login') { // Avoid redirect loop if already on login
               router.replace('/login');
            }

            // Optional: Call backend logout endpoint AFTER clearing local state
            // This invalidates the refresh token on the server
            if (refreshTokenToInvalidate) {
                try {
                    await authService.logout(refreshTokenToInvalidate);
                    console.log("Backend logout successful.");
                } catch (error) {
                    // Log error but don't block logout UX
                    console.error("Backend logout failed:", error.response?.data || error.message);
                }
            } else {
                 console.warn("No refresh token found to invalidate on backend during logout.");
            }
        },

        async refreshAccessToken() {
            if (!this.refreshToken) {
                console.log("No refresh token available, logging out.");
                await this.logout(); // Ensure logout completes
                return Promise.reject(new Error("No refresh token"));
            }
            if (this.isRefreshing) {
                 console.log("Token refresh already in progress, returning promise");
                 // Return a promise that resolves when the current refresh completes
                 return new Promise((resolve, reject) => {
                     // Need a mechanism to notify waiting promises, e.g., an event emitter or checking isRefreshing in intervals
                     // Simplified: reject immediately to avoid complex queueing here
                     reject(new Error("Token refresh already in progress"));
                 });
            }

            this.isRefreshing = true;
            console.log("Attempting to refresh access token...");

            try {
                const response = await apiClient.post('/auth/refresh-token', {}, {
                   // Send refresh token in Authorization header for this specific request
                   headers: { 'Authorization': `Bearer ${this.refreshToken}` }
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
                console.error("Failed to refresh token:", error.response?.data || error.message);
                this.isRefreshing = false;
                // If refresh fails (e.g., refresh token expired or invalid), log out
                await this.logout(); // Use await here
                return Promise.reject(error); // Reject the promise
            }
        },

        // *** ACTION ĐỂ LOAD PROFILE KHI APP KHỞI ĐỘNG (NẾU ĐÃ LOGIN) ***
        async loadInitialData() {
            console.log("loadInitialData called. isAuthenticated:", this.isAuthenticated);
            if (this.isAuthenticated) {
                // Fetch user details first (roles, etc.) if not already in state
                // This might be redundant if localStorage 'user' is reliable, but safer
                if (!this.user) {
                   console.log("No user details in state, fetching...");
                   await this.fetchCurrentUserDetails();
                } else {
                   console.log("User details already in state.");
                }
                // Always attempt to fetch the latest profile data
                console.log("Fetching user profile...");
                await this.fetchUserProfile();
            } else {
                 console.log("Not authenticated, skipping initial data load.");
            }
        },
    }
});