// File: src/features/plan/services/taskService.js
import apiClient from '@/services/axios';

export default {
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

  addTaskComment(taskId, content) {
    return apiClient.post(`/tasks/${taskId}/comments`, { content });
  },

  deleteTaskComment(commentId) {
    return apiClient.delete(`/tasks/comments/${commentId}`);
  },

  updateTaskComment(commentId, content) {
     return apiClient.put(`/tasks/comments/${commentId}`, { content });
  },

  addTaskAttachment(taskId, fileInfo) {
    return apiClient.post(`/tasks/${taskId}/attachments`, fileInfo);
  },

  deleteTaskAttachment(attachmentId) {
    return apiClient.delete(`/tasks/attachments/${attachmentId}`);
  },
};