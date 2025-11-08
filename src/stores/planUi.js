// File: src/stores/planUi.js
import { defineStore } from 'pinia';

export const usePlanUiStore = defineStore('planUi', {
  state: () => ({
    // Trạng thái đóng/mở của các modal
    modals: {
      editPlan: false,
      task: false,              // Dùng chung cho Thêm và Sửa Task
      deleteTask: false,        // Confirm xóa Task
      checkIn: false,           // Dùng chung cho Thêm và Sửa Check-in
      transferOwnership: false,
      deleteConfirm: false,     // Dialog xác nhận chung (rời plan, xóa plan, xóa thành viên...)
    },
    // Dữ liệu đi kèm khi mở modal
    selectedTask: null,         // Task đang chọn để sửa
    taskToDelete: null,         // Task đang chọn để xóa
    selectedCheckIn: null,      // Check-in đang chọn để sửa
    
    // Dữ liệu cho DeleteConfirmDialog chung
    confirmDialogType: '',      // Loại hành động: 'leave-plan', 'archive-plan', 'remove-member'...
    itemToProcess: null,        // Item đi kèm (ví dụ: thông tin thành viên cần xóa)
  }),

  actions: {
    // --- RESET ALL (Dùng khi rời trang) ---
    resetAll() {
        Object.keys(this.modals).forEach(key => this.modals[key] = false);
        this.selectedTask = null;
        this.taskToDelete = null;
        this.selectedCheckIn = null;
        this.confirmDialogType = '';
        this.itemToProcess = null;
    },

    // --- Edit Plan Modal ---
    openEditPlan() { this.modals.editPlan = true; },
    closeEditPlan() { this.modals.editPlan = false; },

    // --- Task Modal (Add/Edit) ---
    openAddTask() {
        this.selectedTask = null; // Null nghĩa là thêm mới
        this.modals.task = true;
    },
    openEditTask(task) {
        this.selectedTask = task; // Có dữ liệu nghĩa là sửa
        this.modals.task = true;
    },
    closeTaskDialog() {
        this.modals.task = false;
        setTimeout(() => { this.selectedTask = null; }, 300); // Delay clear để tránh UI giật khi đóng
    },

    // --- Delete Task Confirm ---
    openDeleteTask(task) {
        this.taskToDelete = task;
        this.modals.deleteTask = true;
    },
    closeDeleteTask() {
        this.modals.deleteTask = false;
        setTimeout(() => { this.taskToDelete = null; }, 300);
    },

    // --- Check-in Modal ---
    openNewCheckIn() {
        this.selectedCheckIn = null;
        this.modals.checkIn = true;
    },
    openEditCheckIn(checkInEvent) {
        this.selectedCheckIn = checkInEvent;
        this.modals.checkIn = true;
    },
    closeCheckInDialog() {
        this.modals.checkIn = false;
        setTimeout(() => { this.selectedCheckIn = null; }, 300);
    },

    // --- Transfer Ownership ---
    openTransferOwnership() { this.modals.transferOwnership = true; },
    closeTransferOwnership() { this.modals.transferOwnership = false; },

    // --- Generic Delete Confirm ---
    openConfirmDialog(type, item = null) {
        this.confirmDialogType = type;
        this.itemToProcess = item;
        this.modals.deleteConfirm = true;
    },
    closeConfirmDialog() {
        this.modals.deleteConfirm = false;
        setTimeout(() => {
            this.confirmDialogType = '';
            this.itemToProcess = null;
        }, 300);
    }
  }
});