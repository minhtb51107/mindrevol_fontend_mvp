// File: src/api/axios.js (PHIÊN BẢN AN TOÀN HƠN)

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(
    (config) => {
        // *** SỬA Ở ĐÂY ***
        // Chỉ thêm Access Token nếu request đó KHÔNG PHẢI là request refresh-token
        if (config.url.includes('/auth/refresh-token')) {
            return config; // Giữ nguyên config (với Refresh Token)
        }
        // *** HẾT PHẦN SỬA ***

        const authStore = useAuthStore();
        const token = authStore.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // *** SỬA Ở ĐÂY: Lắng nghe lỗi 401 thay vì 403 ***
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const authStore = useAuthStore();
            try {
                // ... code làm mới token ...
            } catch (refreshError) {
                authStore.logout();
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;