// File: src/api/axios.js
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// --- (PHẦN SỬA ĐỔI V4) ---
// Sửa request interceptor để LUÔN ghi đè token cũ
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const token = authStore.accessToken;

        // Luôn gắn token mới nhất, trừ khi đó là request refresh
        if (token && !config.url?.includes('/auth/refresh-token')) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
// --- (KẾT THÚC PHẦN SỬA ĐỔI V4) ---


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
        const getAuthStore = () => useAuthStore(); 

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
            console.log("Received 401, path:", originalRequest.url);

            if (isRefreshing) {
                console.log("Already refreshing, adding request to queue...");
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    console.log("Retrying request from queue with new token...");
                    
                    // --- (PHẦN SỬA ĐỔI V4) ---
                    // Gắn token MỚI (từ promise) vào request đang chờ
                    originalRequest.headers['Authorization'] = 'Bearer ' + token; 
                    // --- (KẾT THÚC PHẦN SỬA ĐỔI V4) ---
                    
                    return apiClient(originalRequest); 
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true; 
            isRefreshing = true;
            console.log("Attempting token refresh...");

            const authStore = getAuthStore();

            try {
                const newAccessToken = await authStore.refreshAccessToken();
                console.log("Refresh successful, processing queue and retrying original request...");

                // (Dòng này của bạn đã đúng)
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken); // Xử lý các request đang chờ trong queue
                return apiClient(originalRequest); // Thử lại request gốc

            } catch (refreshError) {
                console.error("Refresh token failed:", refreshError);
                processQueue(refreshError, null); 
                authStore.logout(); 
                return Promise.reject(refreshError || error); 
            } finally {
                isRefreshing = false;
                console.log("Refresh process finished.");
            }
        }

        return Promise.reject(error);
    }
);


export default apiClient;