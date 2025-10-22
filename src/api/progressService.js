// File: src/api/progressService.js
import apiClient from './axios';

export default {
  getDashboard(shareableLink) {
    return apiClient.get(`/plans/${shareableLink}/progress/dashboard`);
  },

  logProgress(shareableLink, progressData) {
    // progressData bây giờ chứa cả attachments [{storedFilename, fileUrl,...}]
    return apiClient.post(`/plans/${shareableLink}/progress`, progressData);
  },

  // --- THÊM HÀM NÀY ---
  uploadEvidenceFile(file) {
    const formData = new FormData();
    formData.append('file', file); // 'file' phải khớp với @RequestParam("file") ở backend

    // Gửi request với FormData, Axios sẽ tự đặt Content-Type là multipart/form-data
    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // Có thể chỉ định rõ ràng nếu muốn
      }
      // Có thể thêm onUploadProgress để theo dõi tiến trình upload
      // onUploadProgress: progressEvent => {
      //   console.log(progressEvent.loaded / progressEvent.total)
      // }
    });
  }
  // --- KẾT THÚC THÊM ---
};