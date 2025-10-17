// File: src/api/planService.js
import apiClient from './axios';

export default {
  createPlan(planData) {
    // planData khớp với CreatePlanRequest.java
    return apiClient.post('/plans', planData);
  },

  // THÊM HÀM MỚI
  getPlanByShareableLink(shareableLink) {
    return apiClient.get(`/plans/${shareableLink}`);
  },

  // THÊM HÀM MỚI
  joinPlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/join`);
  },
};