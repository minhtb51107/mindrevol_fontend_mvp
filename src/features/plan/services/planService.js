// File: src/features/plan/services/planService.js
import apiClient from '@/services/axios';

export default {
  createPlan(planData) {
    return apiClient.post('/plans', planData);
  },

  createPlanWithSchedule(planData) {
    return apiClient.post('/plans/with-schedule', planData);
  },

  getMyPlans(searchTerm = '') {
    return apiClient.get('/plans/my-plans', {
      params: { search: searchTerm }
    });
  },
  
  getPlanByShareableLink(shareableLink) {
    return apiClient.get(`/plans/${shareableLink}`);
  },
  
  joinPlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/join`);
  },
  
  leavePlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/leave`);
  },

  archivePlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/archive`);
  },

  unarchivePlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/unarchive`);
  },

  deletePlanPermanently(shareableLink) {
    return apiClient.delete(`/plans/${shareableLink}/permanent-delete`);
  },
  
  removeMember(shareableLink, userId) {
    return apiClient.delete(`/plans/${shareableLink}/members/${userId}`);
  },
  
  transferOwnership(shareableLink, newOwnerUserId) {
    return apiClient.patch(`/plans/${shareableLink}/transfer-ownership`, { newOwnerUserId });
  },

  updatePlanDetails(shareableLink, planDetails) {
    return apiClient.patch(`/plans/${shareableLink}/details`, planDetails);
  },

  nudgeMember(shareableLink, targetUserId) {
      return apiClient.post(`/plans/${shareableLink}/nudge/${targetUserId}`);
  },
};