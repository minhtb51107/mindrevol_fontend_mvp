import apiClient from './axios';

export default {
  createPlan(planData) {
    return apiClient.post('/plans', planData);
  },

  getPlanByShareableLink(shareableLink) {
    return apiClient.get(`/plans/${shareableLink}`);
  },

  joinPlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/join`);
  },

  // --- THÊM HÀM NÀY ---
  getMyPlans() {
    return apiClient.get('/plans/my-plans');
  },
  // --- KẾT THÚC THÊM ---
};