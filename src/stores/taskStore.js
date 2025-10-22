// File: src/stores/taskStore.js
import { defineStore } from 'pinia';
import taskService from '@/api/taskService';
import { usePlanStore } from './plan'; // Để cập nhật dữ liệu Task trong planStore

export const useTaskStore = defineStore('task', {
  state: () => ({
    // Task đang được chọn để tương tác (ví dụ: trong modal)
    selectedTask: null, // Sẽ chứa object TaskResponse đầy đủ (bao gồm comments, attachments)
    isLoading: false, // Loading chung cho các thao tác trên task (comment, attach)
    error: null,
    // State riêng cho việc upload file vào task (nếu cần)
    isUploadingAttachment: false,
    uploadAttachmentError: null,
    // --- THÊM STATE CHO SỬA COMMENT TASK ---
    editingTaskCommentId: null, // ID của comment đang sửa
    editingTaskCommentContent: '', // Nội dung đang sửa
    // --- KẾT THÚC THÊM ---
  }),

  actions: {
    /**
     * Chọn một Task để bắt đầu tương tác.
     * Dữ liệu task này nên được lấy từ planStore.currentPlan.dailyTasks
     * @param {object} task TaskResponse object
     */
    selectTask(task) {
      // Tạo bản sao để tránh thay đổi trực tiếp state của planStore
      this.selectedTask = task ? { ...task } : null;
      this.error = null;
      this.uploadAttachmentError = null;
      // Reset trạng thái sửa comment khi chọn task mới
      this.cancelEditingTaskComment();
      console.log("Selected Task:", this.selectedTask); // Debug log
    },

    /**
     * Bỏ chọn Task
     */
    clearSelectedTask() {
      this.selectedTask = null;
      this.error = null;
      this.uploadAttachmentError = null;
      this.cancelEditingTaskComment(); // Reset cả trạng thái sửa
    },

    /**
     * Thêm bình luận vào Task đang được chọn (selectedTask).
     * @param {string} content Nội dung bình luận
     */
    async addTaskComment(content) {
      if (!this.selectedTask) {
        this.error = "Chưa chọn công việc để bình luận.";
        return;
      }
      if (!content || !content.trim()) {
        this.error = "Nội dung bình luận không được để trống.";
        return;
      }

      this.isLoading = true;
      this.error = null;
      try {
        const response = await taskService.addTaskComment(this.selectedTask.id, content.trim());
        const newComment = response.data;

        // Cập nhật state nội bộ
        if (this.selectedTask.comments) {
          this.selectedTask.comments.push(newComment);
        } else {
          this.selectedTask.comments = [newComment];
        }

        // Cập nhật lại cả trong planStore để dữ liệu đồng bộ
        const planStore = usePlanStore();
        if (planStore.currentPlan?.dailyTasks) {
          const taskIndex = planStore.currentPlan.dailyTasks.findIndex(t => t.id === this.selectedTask.id);
          if (taskIndex !== -1) {
            // Đảm bảo comments là array trước khi push
            if (!Array.isArray(planStore.currentPlan.dailyTasks[taskIndex].comments)) {
                 planStore.currentPlan.dailyTasks[taskIndex].comments = [];
            }
            planStore.currentPlan.dailyTasks[taskIndex].comments.push(newComment);
          }
        }

      } catch (error) {
        console.error("Lỗi khi thêm bình luận Task:", error);
        this.error = error.response?.data?.message || "Thêm bình luận thất bại.";
        throw error; // Ném lỗi để component xử lý
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Xóa bình luận khỏi Task đang được chọn.
     * @param {number} commentId ID bình luận cần xóa
     */
    async deleteTaskComment(commentId) {
       if (!this.selectedTask) return;

       this.isLoading = true;
       this.error = null;
       try {
         await taskService.deleteTaskComment(commentId);

         // Cập nhật state nội bộ
         if (this.selectedTask.comments) {
            this.selectedTask.comments = this.selectedTask.comments.filter(c => c.id !== commentId);
         }

         // Cập nhật lại cả trong planStore
         const planStore = usePlanStore();
         if (planStore.currentPlan?.dailyTasks) {
            const taskIndex = planStore.currentPlan.dailyTasks.findIndex(t => t.id === this.selectedTask.id);
            if (taskIndex !== -1 && planStore.currentPlan.dailyTasks[taskIndex].comments) {
               planStore.currentPlan.dailyTasks[taskIndex].comments =
                  planStore.currentPlan.dailyTasks[taskIndex].comments.filter(c => c.id !== commentId);
            }
         }

       } catch (error) {
          console.error("Lỗi khi xóa bình luận Task:", error);
          this.error = error.response?.data?.message || "Xóa bình luận thất bại.";
          throw error;
       } finally {
         this.isLoading = false;
       }
    },

    // --- THÊM CÁC ACTIONS NÀY ---
    /**
     * Bắt đầu chỉnh sửa một bình luận Task.
     * @param {object} comment TaskCommentResponse object
     */
    startEditingTaskComment(comment) {
        this.editingTaskCommentId = comment.id;
        this.editingTaskCommentContent = comment.content;
        this.error = null; // Xóa lỗi cũ
    },

    /**
     * Hủy bỏ chỉnh sửa bình luận Task.
     */
    cancelEditingTaskComment() {
        this.editingTaskCommentId = null;
        this.editingTaskCommentContent = '';
    },

    /**
     * Lưu bình luận Task đã chỉnh sửa.
     */
    async saveEditedTaskComment() {
        if (!this.editingTaskCommentId || !this.editingTaskCommentContent.trim()) {
            this.error = "Nội dung bình luận không được để trống.";
            return;
        }
        this.isLoading = true; // Sử dụng loading chung
        this.error = null;
        try {
            const response = await taskService.updateTaskComment(this.editingTaskCommentId, this.editingTaskCommentContent.trim());
            const updatedComment = response.data;

            // Cập nhật state nội bộ (selectedTask)
            if (this.selectedTask && this.selectedTask.comments) {
                const index = this.selectedTask.comments.findIndex(c => c.id === this.editingTaskCommentId);
                if (index !== -1) {
                    // Cập nhật object comment trong mảng
                    this.selectedTask.comments[index] = updatedComment;
                }
            }

            // Cập nhật lại cả trong planStore
            const planStore = usePlanStore();
            if (planStore.currentPlan?.dailyTasks) {
                const taskIndex = planStore.currentPlan.dailyTasks.findIndex(t => t.id === updatedComment.taskId); // Dùng taskId từ response
                if (taskIndex !== -1 && planStore.currentPlan.dailyTasks[taskIndex].comments) {
                   const commentIndex = planStore.currentPlan.dailyTasks[taskIndex].comments.findIndex(c => c.id === this.editingTaskCommentId);
                   if(commentIndex !== -1) {
                       // Cập nhật object comment trong mảng của planStore
                       planStore.currentPlan.dailyTasks[taskIndex].comments[commentIndex] = updatedComment;
                   }
                }
            }

            // Kết thúc chỉnh sửa
            this.cancelEditingTaskComment();

        } catch (error) {
            console.error("Lỗi khi cập nhật bình luận Task:", error);
            this.error = error.response?.data?.message || "Cập nhật bình luận thất bại.";
            // Không cancel editing để người dùng có thể thử lại
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
    // --- KẾT THÚC THÊM ACTIONS ---


    // --- Actions Attachments ---
    /**
     * Đính kèm file vào Task đang được chọn.
     * @param {object} fileInfo Thông tin file từ API upload (FileUploadResponse)
     */
    async addTaskAttachment(fileInfo) {
        if (!this.selectedTask) {
            this.uploadAttachmentError = "Chưa chọn công việc để đính kèm file.";
            return;
        }
        if (!fileInfo || !fileInfo.storedFilename) {
             this.uploadAttachmentError = "Thông tin file upload không hợp lệ.";
             return;
        }

        this.isUploadingAttachment = true; // Sử dụng state riêng cho attach
        this.uploadAttachmentError = null;
        try {
            const response = await taskService.addTaskAttachment(this.selectedTask.id, fileInfo);
            const newAttachment = response.data;

            // Cập nhật state nội bộ
            if (!Array.isArray(this.selectedTask.attachments)) { // Đảm bảo là mảng
                this.selectedTask.attachments = [];
            }
            this.selectedTask.attachments.push(newAttachment);


            // Cập nhật lại cả trong planStore
            const planStore = usePlanStore();
            if (planStore.currentPlan?.dailyTasks) {
                const taskIndex = planStore.currentPlan.dailyTasks.findIndex(t => t.id === this.selectedTask.id);
                if (taskIndex !== -1) {
                   if (!Array.isArray(planStore.currentPlan.dailyTasks[taskIndex].attachments)) { // Đảm bảo là mảng
                      planStore.currentPlan.dailyTasks[taskIndex].attachments = [];
                   }
                   planStore.currentPlan.dailyTasks[taskIndex].attachments.push(newAttachment);
                }
            }

        } catch (error) {
            console.error("Lỗi khi đính kèm file Task:", error);
            this.uploadAttachmentError = error.response?.data?.message || "Đính kèm file thất bại.";
            throw error;
        } finally {
            this.isUploadingAttachment = false;
        }
    },

    /**
     * Xóa file đính kèm khỏi Task đang được chọn.
     * @param {number} attachmentId ID file đính kèm cần xóa
     */
    async deleteTaskAttachment(attachmentId) {
        if (!this.selectedTask) return;

        this.isLoading = true; // Có thể dùng loading riêng
        this.error = null;
        try {
            await taskService.deleteTaskAttachment(attachmentId);

            // Cập nhật state nội bộ
            if (this.selectedTask.attachments) {
                this.selectedTask.attachments = this.selectedTask.attachments.filter(a => a.id !== attachmentId);
            }

            // Cập nhật lại cả trong planStore
            const planStore = usePlanStore();
            if (planStore.currentPlan?.dailyTasks) {
                const taskIndex = planStore.currentPlan.dailyTasks.findIndex(t => t.id === this.selectedTask.id);
                if (taskIndex !== -1 && planStore.currentPlan.dailyTasks[taskIndex].attachments) {
                   planStore.currentPlan.dailyTasks[taskIndex].attachments =
                      planStore.currentPlan.dailyTasks[taskIndex].attachments.filter(a => a.id !== attachmentId);
                }
            }

        } catch (error) {
            console.error("Lỗi khi xóa file đính kèm Task:", error);
            this.error = error.response?.data?.message || "Xóa file đính kèm thất bại.";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
  },
});