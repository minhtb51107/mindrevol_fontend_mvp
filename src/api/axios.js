// File: src/api/axios.js (Bản sửa lỗi cuối cùng)

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

        // **THAY ĐỔI LOGIC KIỂM TRA**
        // 1. Kiểm tra có phải lỗi 403 không
        // 2. Kiểm tra xem request gốc có phải là đến 'refresh-token' không (để tránh vòng lặp)
        // 3. Kiểm tra xem đã thử lại lần nào chưa
        if (error.response?.status === 403 && originalRequest.url !== '/auth/refresh-token' && !originalRequest._retry) {
            originalRequest._retry = true;

            const authStore = useAuthStore();
            try {
                const newAccessToken = await authStore.refreshAccessToken();
                // Cập nhật token cho axios default header và request gốc
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

                return apiClient(originalRequest);
            } catch (refreshError) {
                authStore.logout();
                return Promise.reject(refreshError);
            }
        }

        // Xử lý các lỗi khác
        return Promise.reject(error);
    }
);

export default apiClient;