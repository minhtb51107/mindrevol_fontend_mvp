// File: src/api/taskService.js
import apiClient from './axios';

export default {
  // === Task CRUD (Chuyển từ planService sang) ===
  getTasksByDate(shareableLink, date) {
    return apiClient.get(`/plans/${shareableLink}/tasks`, {
      params: { date }
    });
  },

  createTask(shareableLink, taskData) {
    return apiClient.post(`/plans/${shareableLink}/tasks`, taskData);
  },

  updateTask(shareableLink, taskId, taskData) {
    return apiClient.put(`/plans/${shareableLink}/tasks/${taskId}`, taskData);
  },

  deleteTask(shareableLink, taskId) {
    return apiClient.delete(`/plans/${shareableLink}/tasks/${taskId}`);
  },

  reorderTasks(shareableLink, taskDate, orderedTaskIds) {
    return apiClient.patch(`/plans/${shareableLink}/tasks/reorder`, {
      taskDate,
      orderedTaskIds
    });
  },

  // === Comments (Giữ nguyên) ===
  addTaskComment(taskId, content) {
    return apiClient.post(`/tasks/${taskId}/comments`, { content });
  },

  deleteTaskComment(commentId) {
    return apiClient.delete(`/tasks/comments/${commentId}`);
  },

  updateTaskComment(commentId, content) {
     return apiClient.put(`/tasks/comments/${commentId}`, { content });
  },

  // === Attachments (Giữ nguyên) ===
  addTaskAttachment(taskId, fileInfo) {
    return apiClient.post(`/tasks/${taskId}/attachments`, fileInfo);
  },

  deleteTaskAttachment(attachmentId) {
    return apiClient.delete(`/tasks/attachments/${attachmentId}`);
  },
};