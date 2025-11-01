import api from './axios';

const fileUploadService = {
  /**
   * Upload một hoặc nhiều file.
   * @param {FormData} formData - Đối tượng FormData chứa các file (dưới key 'files')
   * @param {string} context - (Tùy chọn) Thư mục con để lưu file (ví dụ: 'checkin', 'avatar')
   * @returns {Promise<Array<Object>>} - Một mảng các đối tượng FileUploadResponse
   */
  uploadFiles: async (formData, context = 'default') => {
    try {
      // *** SỬA LỖI: Đã BỎ /api/v1/ ở đây ***
      // vì 'api' (từ axios.js) đã có baseURL là '/api/v1'
      const response = await api.post(`/files/upload?context=${context}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Backend của bạn trả về List<FileUploadResponse>
      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },
};

export default fileUploadService;