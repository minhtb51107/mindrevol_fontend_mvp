// Đường dẫn: src/api/planService.js
import api from './axios';

export default {
  // --- Plan Creation ---
  createPlan(planData) {
    return api.post('/plans', planData);
  },

  createPlanWithSchedule(planData) {
    return api.post('/plans/with-schedule', planData);
  },

  // --- Plan Retrieval ---
  getMyPlans(searchTerm = '') {
    return api.get('/plans/my-plans', {
      params: { search: searchTerm }
    });
  },
  
  getPlanByShareableLink(shareableLink) {
    return api.get(`/plans/${shareableLink}`);
  },
  
  // --- Plan Membership & Status ---
  joinPlan(shareableLink) {
    return api.post(`/plans/${shareableLink}/join`);
  },
  
  leavePlan(shareableLink) {
    return api.post(`/plans/${shareableLink}/leave`);
  },

  archivePlan(shareableLink) {
    return api.post(`/plans/${shareableLink}/archive`);
  },

  unarchivePlan(shareableLink) {
    return api.post(`/plans/${shareableLink}/unarchive`);
  },

  deletePlanPermanently(shareableLink) {
    return api.delete(`/plans/${shareableLink}/permanent-delete`);
  },
  
  // --- Plan Management ---
  removeMember(shareableLink, userId) {
    return api.delete(`/plans/${shareableLink}/members/${userId}`);
  },
  
  transferOwnership(shareableLink, newOwnerUserId) {
    return api.patch(`/plans/${shareableLink}/transfer-ownership`, { newOwnerUserId });
  },

  updatePlanDetails(shareableLink, planDetails) {
    return api.patch(`/plans/${shareableLink}/details`, planDetails);
  },

  nudgeMember(shareableLink, targetUserId) {
      return api.post(`/plans/${shareableLink}/nudge/${targetUserId}`);
  },
};