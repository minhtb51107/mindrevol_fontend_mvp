// File: src/api/planService.js
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

  getMyPlans(searchTerm = '') {
    const params = {};
    if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
    }
    return apiClient.get('/plans/my-plans', { params });
  },

  // Task Management
  addTask(shareableLink, taskData) {
    return apiClient.post(`/plans/${shareableLink}/tasks`, taskData);
  },

  updateTask(shareableLink, taskId, taskData) {
    return apiClient.put(`/plans/${shareableLink}/tasks/${taskId}`, taskData);
  },

  deleteTask(shareableLink, taskId) {
    return apiClient.delete(`/plans/${shareableLink}/tasks/${taskId}`);
  },

  reorderTasks(shareableLink, orderedTaskIds) {
    return apiClient.put(`/plans/${shareableLink}/task-order`, { orderedTaskIds });
  },

  // Member Management
  removeMember(shareableLink, userId) {
    return apiClient.delete(`/plans/${shareableLink}/members/${userId}`);
  },

  // *** THÊM HÀM TRANSFER OWNERSHIP ***
  transferOwnership(shareableLink, newOwnerUserId) {
    return apiClient.patch(`/plans/${shareableLink}/transfer-ownership`, { newOwnerUserId });
  },
  // *** KẾT THÚC THÊM ***

  // Status Management
  archivePlan(shareableLink) {
    return apiClient.patch(`/plans/${shareableLink}/archive`);
  },

  unarchivePlan(shareableLink) {
    return apiClient.patch(`/plans/${shareableLink}/unarchive`);
  },
};