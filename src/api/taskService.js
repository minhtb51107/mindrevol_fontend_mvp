// File: src/api/taskService.js
import apiClient from './axios';

export default {
  // === Comments ===

  /**
   * Thêm bình luận vào Task
   * @param {number} taskId ID của Task
   * @param {string} content Nội dung bình luận
   * @returns Promise<AxiosResponse<TaskCommentResponse>>
   */
  addTaskComment(taskId, content) {
    // POST /api/v1/tasks/{taskId}/comments
    return apiClient.post(`/tasks/${taskId}/comments`, { content });
  },

  /**
   * Xóa bình luận của Task
   * @param {number} commentId ID của bình luận
   * @returns Promise<AxiosResponse<void>>
   */
  deleteTaskComment(commentId) {
    // DELETE /api/v1/tasks/comments/{commentId}
    return apiClient.delete(`/tasks/comments/${commentId}`);
  },

  // === THÊM HÀM NÀY ===
  /**
   * Cập nhật bình luận của Task
   * @param {number} commentId ID của bình luận
   * @param {string} content Nội dung mới
   * @returns Promise<AxiosResponse<TaskCommentResponse>>
   */
  updateTaskComment(commentId, content) {
     // PUT /api/v1/tasks/comments/{commentId}
     return apiClient.put(`/tasks/comments/${commentId}`, { content });
  },
  // === KẾT THÚC THÊM ===

  // (Tùy chọn) Lấy danh sách bình luận cho Task (nếu cần load riêng)
  // getTaskComments(taskId) {
  //   // GET /api/v1/tasks/{taskId}/comments
  //   return apiClient.get(`/tasks/${taskId}/comments`);
  // },


  // === Attachments === (Giữ nguyên)

  addTaskAttachment(taskId, fileInfo) {
    // POST /api/v1/tasks/{taskId}/attachments
    return apiClient.post(`/tasks/${taskId}/attachments`, fileInfo);
  },

  deleteTaskAttachment(attachmentId) {
    // DELETE /api/v1/tasks/attachments/{attachmentId}
    return apiClient.delete(`/tasks/attachments/${attachmentId}`);
  },

};