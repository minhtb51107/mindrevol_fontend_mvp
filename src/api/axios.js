// File: src/api/axios.js
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

        if (token && !config.headers.Authorization) {
             if (!config.url?.includes('/auth/refresh-token')) {
                  config.headers.Authorization = `Bearer ${token}`;
             }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Tạo một promise để quản lý việc refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const getAuthStore = () => useAuthStore(); // Hàm lấy store

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
             console.log("Received 401, path:", originalRequest.url);

            if (isRefreshing) {
                console.log("Already refreshing, adding request to queue...");
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    console.log("Retrying request from queue with new token...");
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err); // Propagate refresh error
                });
            }

             originalRequest._retry = true;
             isRefreshing = true;
             console.log("Attempting token refresh...");

             const authStore = getAuthStore();

            return new Promise(async (resolve, reject) => {
                try {
                    const newAccessToken = await authStore.refreshAccessToken();
                    console.log("Refresh successful, processing queue...");
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    processQueue(null, newAccessToken); // Xử lý queue thành công
                    resolve(apiClient(originalRequest)); // Thử lại request gốc
                } catch (refreshError) {
                     console.error("Refresh token failed:", refreshError);
                     processQueue(refreshError, null); // Xử lý queue thất bại
                     // Logout đã được gọi trong refreshAccessToken nếu thất bại
                     reject(refreshError || error);
                } finally {
                    isRefreshing = false;
                    console.log("Refresh process finished.");
                }
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;