import apiClient from './axios';

export default {
  postComment(progressId, content) {
    // Backend Controller nhận 'progressId' này và coi nó là 'checkInEventId'
    return apiClient.post(`/progress/${progressId}/comments`, { content });
  },

  addOrUpdateReaction(progressId, reactionType) {
    return apiClient.post(`/progress/${progressId}/reactions`, { reactionType });
  },

  removeReaction(progressId) {
      return apiClient.delete(`/progress/${progressId}/reactions`);
  },

  updateComment(commentId, content) {
    // Backend CommentController sử dụng /comments/{commentId}
    return apiClient.put(`/comments/${commentId}`, { content });
  },

  deleteComment(commentId) {
    // Backend CommentController sử dụng /comments/{commentId}
    return apiClient.delete(`/comments/${commentId}`);
  }
};