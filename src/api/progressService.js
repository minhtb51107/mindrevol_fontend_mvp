// File: src/api/progressService.js
import apiClient from './axios';

export default {
  getDashboard(shareableLink) {
    return apiClient.get(`/plans/${shareableLink}/progress/dashboard`);
  },

  logProgress(shareableLink, progressData) {
    // progressData khớp với LogProgressRequest.java
    return apiClient.post(`/plans/${shareableLink}/progress`, progressData);
  },
};