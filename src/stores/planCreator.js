// Đường dẫn: src/stores/planCreator.js

import { defineStore } from 'pinia';

export const usePlanCreatorStore = defineStore('planCreator', {
  state: () => ({
    // Dữ liệu từ Bước 1
    title: '',
    description: '',
    durationInDays: 7,
    dailyGoal: '',
    startDate: '',
  }),
  actions: {
    setPlanDetails(details) {
      this.title = details.title;
      this.description = details.description;
      this.durationInDays = details.durationInDays;
      this.dailyGoal = details.dailyGoal;
      this.startDate = details.startDate;
    },
    clearPlanDetails() {
      this.title = '';
      this.description = '';
      this.durationInDays = 7;
      this.dailyGoal = '';
      this.startDate = '';
    },
  },
  // Lưu vào sessionStorage để không mất khi F5 giữa chừng
  // YÊU CẦU: bạn cần cài pinia-plugin-persistedstate
  // npm install pinia-plugin-persistedstate
  // và đăng ký nó trong main.js
  persist: {
    storage: sessionStorage, 
  },
});