// File: src/api/planService.js
import apiClient from './axios';
import dayjs from 'dayjs'; // Import dayjs

export default {
  createPlan(planData) {
    return apiClient.post('/plans', planData);
  },

  getPlanByShareableLink(shareableLink) {
    // API này không còn trả về danh sách task mặc định nữa
    return apiClient.get(`/plans/${shareableLink}`);
  },

  joinPlan(shareableLink) {
    return apiClient.post(`/plans/${shareableLink}/join`);
  },

  getMyPlans(searchTerm = '') {
    // Trim searchTerm để tránh gửi khoảng trắng thừa
    const trimmedSearchTerm = searchTerm?.trim();
    const params = trimmedSearchTerm ? { search: trimmedSearchTerm } : {};
    return apiClient.get('/plans/my-plans', { params });
  },

  // --- THÊM MỚI 1: HÀM SỬA CHI TIẾT KẾ HOẠCH ---
  updatePlanDetails(shareableLink, planDetails) {
    // planDetails: { title: "...", description: "...", dailyGoal: "..." }
    return apiClient.put(`/plans/${shareableLink}/details`, planDetails);
  },
  // --- KẾT THÚC THÊM MỚI 1 ---

  // --- THÊM MỚI 2: HÀM RỜI KẾ HOẠCH ---
  leavePlan(shareableLink) {
    return apiClient.delete(`/plans/${shareableLink}/leave`);
  },
  // --- KẾT THÚC THÊM MỚI 2 ---


  // --- Task Management (ĐÃ CẬP NHẬT THEO LOGIC MỚI) ---

  // --- HÀM MỚI: Lấy danh sách task theo ngày ---
  getTasksByDate(shareableLink, date) {
    // Format date sang 'YYYY-MM-DD'
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return apiClient.get(`/plans/${shareableLink}/tasks-by-date`, {
      params: { date: formattedDate }
    });
  },

  // --- HÀM CẬP NHẬT: Thêm task (cần taskDate) ---
  addTask(shareableLink, taskData) {
    // taskData bây giờ phải chứa { description: '...', deadlineTime: 'HH:mm' (optional), taskDate: 'YYYY-MM-DD' }
    if (!taskData.taskDate || !dayjs(taskData.taskDate, 'YYYY-MM-DD', true).isValid()) {
        console.error("addTask: taskDate is required and must be in YYYY-MM-DD format!", taskData.taskDate);
        return Promise.reject(new Error("Ngày thực hiện công việc không hợp lệ hoặc bị thiếu."));
    }
    // Format lại deadlineTime nếu có (đảm bảo HH:mm)
    if (taskData.deadlineTime) {
        taskData.deadlineTime = dayjs(taskData.deadlineTime, 'HH:mm').format('HH:mm');
    }
    return apiClient.post(`/plans/${shareableLink}/tasks`, taskData);
  },

  // --- HÀM CẬP NHẬT: Sửa task (có thể bao gồm taskDate mới) ---
  updateTask(shareableLink, taskId, taskData) {
    // taskData có thể chứa taskDate mới nếu muốn chuyển task sang ngày khác
    // { description: '...', deadlineTime: 'HH:mm' (optional), taskDate: 'YYYY-MM-DD' (optional) }
    if (taskData.taskDate && !dayjs(taskData.taskDate, 'YYYY-MM-DD', true).isValid()) {
         console.error("updateTask: Invalid taskDate format!", taskData.taskDate);
         return Promise.reject(new Error("Ngày thực hiện công việc mới không hợp lệ."));
    }
     // Format lại deadlineTime nếu có
    if (taskData.deadlineTime) {
        taskData.deadlineTime = dayjs(taskData.deadlineTime, 'HH:mm').format('HH:mm');
    }
    return apiClient.put(`/plans/${shareableLink}/tasks/${taskId}`, taskData);
  },

  // --- HÀM Xóa task (không đổi) ---
  deleteTask(shareableLink, taskId) {
    return apiClient.delete(`/plans/${shareableLink}/tasks/${taskId}`);
  },

  // --- HÀM CẬP NHẬT: Sắp xếp task (cần taskDate) ---
  reorderTasks(shareableLink, taskDate, orderedTaskIds) {
    // API yêu cầu gửi cả taskDate và orderedTaskIds trong body
    const formattedDate = dayjs(taskDate).format('YYYY-MM-DD');
    if (!dayjs(formattedDate, 'YYYY-MM-DD', true).isValid()) {
        console.error("reorderTasks: Invalid taskDate format!", taskDate);
        return Promise.reject(new Error("Ngày của công việc không hợp lệ."));
    }
    if (!Array.isArray(orderedTaskIds)) {
        console.error("reorderTasks: orderedTaskIds must be an array!", orderedTaskIds);
        return Promise.reject(new Error("Danh sách ID công việc không hợp lệ."));
    }
    return apiClient.put(`/plans/${shareableLink}/task-order`, {
        taskDate: formattedDate,
        orderedTaskIds: orderedTaskIds // Backend nhận List<Long>
    });
  },

  // --- Member Management (không thay đổi) ---
  removeMember(shareableLink, userId) {
    return apiClient.delete(`/plans/${shareableLink}/members/${userId}`);
  },
  transferOwnership(shareableLink, newOwnerUserId) {
    // Đảm bảo newOwnerUserId là số nguyên
    if (typeof newOwnerUserId !== 'number' || !Number.isInteger(newOwnerUserId)) {
        console.error("transferOwnership: newOwnerUserId must be an integer!", newOwnerUserId);
        return Promise.reject(new Error("ID người dùng mới không hợp lệ."));
    }
    return apiClient.patch(`/plans/${shareableLink}/transfer-ownership`, { newOwnerUserId });
  },

  // --- Status Management (không thay đổi) ---
  archivePlan(shareableLink) {
    return apiClient.patch(`/plans/${shareableLink}/archive`);
  },
  unarchivePlan(shareableLink) {
    return apiClient.patch(`/plans/${shareableLink}/unarchive`);
  },
};