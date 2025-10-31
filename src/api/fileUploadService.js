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
      // Thêm context vào query param
      const response = await api.post(`/api/v1/files/upload?context=${context}`, formData, {
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