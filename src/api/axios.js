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

        // Chỉ thêm header Authorization nếu có token VÀ header chưa được đặt
        // Ngoại trừ request refresh token
        if (token && !config.headers.Authorization && !config.url?.includes('/auth/refresh-token')) {
             config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
        const getAuthStore = () => useAuthStore(); // Hàm lấy store động

        // Chỉ xử lý 401, không phải request refresh, và chưa thử lại
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
             console.log("Received 401, path:", originalRequest.url);

            if (isRefreshing) {
                console.log("Already refreshing, adding request to queue...");
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    console.log("Retrying request from queue with new token...");
                    originalRequest.headers['Authorization'] = 'Bearer ' + token; // Gắn token mới vào request đang chờ
                    return apiClient(originalRequest); // Thử lại request đang chờ
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

             originalRequest._retry = true; // Đánh dấu đã thử lại
             isRefreshing = true;
             console.log("Attempting token refresh...");

             const authStore = getAuthStore();

            try {
                const newAccessToken = await authStore.refreshAccessToken();
                console.log("Refresh successful, processing queue and retrying original request...");

                // *** SỬA LỖI QUAN TRỌNG: Gắn token mới vào request gốc TRƯỚC KHI thử lại ***
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken); // Xử lý các request đang chờ trong queue

                // Thử lại request gốc với token đã được cập nhật
                return apiClient(originalRequest);

            } catch (refreshError) {
                 console.error("Refresh token failed:", refreshError);
                 processQueue(refreshError, null); // Xử lý queue thất bại
                 // Quan trọng: Logout user nếu refresh thất bại
                 authStore.logout(); // Hoặc gọi action tương ứng
                 // Redirect về trang login
                 // window.location.href = '/login'; // Hoặc dùng router nếu có thể truy cập
                 return Promise.reject(refreshError || error); // Ném lỗi cuối cùng
            } finally {
                isRefreshing = false;
                console.log("Refresh process finished.");
            }
        }

        // Trả về lỗi nếu không phải 401 hoặc các điều kiện khác không khớp
        return Promise.reject(error);
    }
);


export default apiClient;