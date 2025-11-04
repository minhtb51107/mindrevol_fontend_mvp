// Đường dẫn: src/api/planService.js

import api from './axios'; // <--- ĐÂY LÀ DÒNG BỊ THIẾU GÂY LỖI

export default {
  // Hàm này dùng cho "Tạo nhanh" (Bước 1 - Tạo nhanh)
  createPlan(planData) {
    return api.post('/plans', planData);
  },

  // === HÀM MỚI CHO WIZARD (BƯỚC 2) ===
  // Dòng 11 (bên dưới) chính là dòng báo lỗi
  // vì 'api' chưa được import
  createPlanWithSchedule(planData) {
    return api.post('/plans/with-schedule', planData);
  },
  // ---------------------------------

  getMyPlans(searchTerm = '') {
    return api.get('/plans/my-plans', {
      params: { search: searchTerm }
    });
  },
  
  getPlanByShareableLink(shareableLink) {
    return api.get(`/plans/${shareableLink}`);
  },
  
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
  
  removeMember(shareableLink, userId) {
    return api.delete(`/plans/${shareableLink}/members/${userId}`);
  },
  
  transferOwnership(shareableLink, newOwnerUserId) {
    return api.patch(`/plans/${shareableLink}/transfer-ownership`, { newOwnerUserId });
  },

  // Dùng cho modal "Chỉnh sửa thông tin"
  updatePlanDetails(shareableLink, planDetails) {
    return api.patch(`/plans/${shareableLink}/details`, planDetails);
  },

  // --- Task API ---
  getTasksByDate(shareableLink, date) {
    return api.get(`/plans/${shareableLink}/tasks`, {
      params: { date }
    });
  },
  
  addTask(shareableLink, taskData) {
    return api.post(`/plans/${shareableLink}/tasks`, taskData);
  },
  
  updateTask(shareableLink, taskId, taskData) {
    return api.put(`/plans/${shareableLink}/tasks/${taskId}`, taskData);
  },
  
  deleteTask(shareableLink, taskId) {
    return api.delete(`/plans/${shareableLink}/tasks/${taskId}`);
  },
  
  reorderTasks(shareableLink, taskDate, orderedTaskIds) {
    return api.patch(`/plans/${shareableLink}/tasks/reorder`, {
      taskDate,
      orderedTaskIds
    });
  }
};