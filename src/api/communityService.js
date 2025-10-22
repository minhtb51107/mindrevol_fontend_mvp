import apiClient from './axios';

export default {
  postComment(progressId, content) {
    return apiClient.post(`/progress/${progressId}/comments`, { content });
  },

  addOrUpdateReaction(progressId, reactionType) {
    return apiClient.post(`/progress/${progressId}/reactions`, { reactionType });
  },

  removeReaction(progressId) {
      return apiClient.delete(`/progress/${progressId}/reactions`);
  },

  updateComment(commentId, content) {
    return apiClient.put(`/comments/${commentId}`, { content });
  },

  deleteComment(commentId) {
    return apiClient.delete(`/comments/${commentId}`);
  }
};