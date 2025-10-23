// File: src/stores/taskStore.js
import { defineStore } from 'pinia';
import taskService from '@/api/taskService';
// *** BỎ IMPORT planStore ***
// import { usePlanStore } from './plan';

export const useTaskStore = defineStore('task', {
  state: () => ({
    selectedTask: null, // Sẽ chứa object TaskResponse đầy đủ (bao gồm comments, attachments)
    isLoading: false,
    error: null,
    isUploadingAttachment: false,
    uploadAttachmentError: null,
    editingTaskCommentId: null,
    editingTaskCommentContent: '',
  }),

  actions: {
    selectTask(task) {
      // Tạo bản sao sâu để tránh thay đổi không mong muốn
      this.selectedTask = task ? JSON.parse(JSON.stringify(task)) : null;
       // Đảm bảo comments và attachments luôn là mảng khi select
       if (this.selectedTask) {
           if (!Array.isArray(this.selectedTask.comments)) this.selectedTask.comments = [];
           if (!Array.isArray(this.selectedTask.attachments)) this.selectedTask.attachments = [];
       }
      this.error = null;
      this.uploadAttachmentError = null;
      this.cancelEditingTaskComment();
      console.log("Selected Task:", this.selectedTask);
    },

    clearSelectedTask() {
      this.selectedTask = null;
      this.error = null;
      this.uploadAttachmentError = null;
      this.cancelEditingTaskComment();
    },

    async addTaskComment(content) {
      if (!this.selectedTask) { /* ... giữ nguyên validation ... */ return; }
      if (!content || !content.trim()) { /* ... giữ nguyên validation ... */ return; }

      this.isLoading = true;
      this.error = null;
      try {
        const response = await taskService.addTaskComment(this.selectedTask.id, content.trim());
        const newComment = response.data;

        // *** CHỈ CẬP NHẬT STATE NỘI BỘ (selectedTask) ***
        if (this.selectedTask.comments) {
          // Kiểm tra xem comment đã tồn tại chưa (phòng trường hợp WS về trước)
          if (!this.selectedTask.comments.some(c => c.id === newComment.id)) {
               this.selectedTask.comments.push(newComment);
          }
        } else {
          this.selectedTask.comments = [newComment];
        }
        // *** BỎ CẬP NHẬT planStore TỪ ĐÂY ***
        /*
        const planStore = usePlanStore();
        // ... logic cập nhật planStore bị loại bỏ ...
        */
       return newComment; // Trả về comment mới để component có thể dùng (vd: focus)

      } catch (error) {
        console.error("Lỗi khi thêm bình luận Task:", error);
        this.error = error.response?.data?.message || "Thêm bình luận thất bại.";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteTaskComment(commentId) {
       if (!this.selectedTask) return;

       this.isLoading = true;
       this.error = null;
       try {
         await taskService.deleteTaskComment(commentId);

         // *** CHỈ CẬP NHẬT STATE NỘI BỘ (selectedTask) ***
         if (this.selectedTask.comments) {
            const initialLength = this.selectedTask.comments.length;
            this.selectedTask.comments = this.selectedTask.comments.filter(c => c.id !== commentId);
            // Có thể kiểm tra initialLength !== this.selectedTask.comments.length để biết xóa thành công không
         }
         // *** BỎ CẬP NHẬT planStore TỪ ĐÂY ***

       } catch (error) {
          console.error("Lỗi khi xóa bình luận Task:", error);
          this.error = error.response?.data?.message || "Xóa bình luận thất bại.";
          throw error;
       } finally {
         this.isLoading = false;
       }
    },

    startEditingTaskComment(comment) {
        this.editingTaskCommentId = comment.id;
        this.editingTaskCommentContent = comment.content;
        this.error = null;
    },

    cancelEditingTaskComment() {
        this.editingTaskCommentId = null;
        this.editingTaskCommentContent = '';
    },

    async saveEditedTaskComment() {
        if (!this.editingTaskCommentId || !this.editingTaskCommentContent.trim()) { /* ... giữ nguyên validation ... */ return; }

        this.isLoading = true;
        this.error = null;
        try {
            const response = await taskService.updateTaskComment(this.editingTaskCommentId, this.editingTaskCommentContent.trim());
            const updatedComment = response.data;

            // *** CHỈ CẬP NHẬT STATE NỘI BỘ (selectedTask) ***
            if (this.selectedTask && this.selectedTask.comments) {
                const index = this.selectedTask.comments.findIndex(c => c.id === this.editingTaskCommentId);
                if (index !== -1) {
                    this.selectedTask.comments[index] = updatedComment;
                } else {
                    // Trường hợp hiếm: comment bị xóa bởi user khác trong lúc sửa? Thêm lại vào list.
                    this.selectedTask.comments.push(updatedComment);
                }
            }
            // *** BỎ CẬP NHẬT planStore TỪ ĐÂY ***

            this.cancelEditingTaskComment(); // Kết thúc chỉnh sửa
            return updatedComment;

        } catch (error) {
            console.error("Lỗi khi cập nhật bình luận Task:", error);
            this.error = error.response?.data?.message || "Cập nhật bình luận thất bại.";
            // Không cancel editing để người dùng thử lại
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async addTaskAttachment(fileInfo) {
        if (!this.selectedTask) { /* ... giữ nguyên validation ... */ return; }
        if (!fileInfo || !fileInfo.storedFilename) { /* ... giữ nguyên validation ... */ return; }

        // Không cần set isUploadingAttachment ở đây vì component tự quản lý loading upload file
        this.uploadAttachmentError = null; // Chỉ reset lỗi
        try {
            const response = await taskService.addTaskAttachment(this.selectedTask.id, fileInfo);
            const newAttachment = response.data;

            // *** CHỈ CẬP NHẬT STATE NỘI BỘ (selectedTask) ***
            if (!Array.isArray(this.selectedTask.attachments)) { // Đảm bảo là mảng
                this.selectedTask.attachments = [];
            }
             // Kiểm tra trùng lặp trước khi push (phòng WS về trước)
             if (!this.selectedTask.attachments.some(a => a.id === newAttachment.id)) {
                  this.selectedTask.attachments.push(newAttachment);
             }
            // *** BỎ CẬP NHẬT planStore TỪ ĐÂY ***
            return newAttachment;

        } catch (error) {
            console.error("Lỗi khi đính kèm file Task:", error);
            this.uploadAttachmentError = error.response?.data?.message || "Đính kèm file thất bại.";
            throw error;
        } finally {
            // isUploadingAttachment được quản lý ở component
        }
    },

    async deleteTaskAttachment(attachmentId) {
        if (!this.selectedTask) return;

        this.isLoading = true; // Dùng loading chung cho việc xóa attachment khỏi task
        this.error = null;
        try {
            await taskService.deleteTaskAttachment(attachmentId);

            // *** CHỈ CẬP NHẬT STATE NỘI BỘ (selectedTask) ***
            if (this.selectedTask.attachments) {
                 const initialLength = this.selectedTask.attachments.length;
                this.selectedTask.attachments = this.selectedTask.attachments.filter(a => a.id !== attachmentId);
                 // Check if deletion was successful based on length change
            }
            // *** BỎ CẬP NHẬT planStore TỪ ĐÂY ***

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