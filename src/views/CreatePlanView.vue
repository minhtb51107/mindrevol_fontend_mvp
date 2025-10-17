<template>
  <div class="row justify-content-center">
    <div class="col-md-10 col-lg-8">
      <div class="card">
        <div class="card-body p-4 p-md-5">
          <h2 class="card-title text-center mb-4">Tạo Kế hoạch học tập mới</h2>

          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <form @submit.prevent="handleCreatePlan">
            <div class="mb-3">
              <label for="title" class="form-label">Tên kế hoạch <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="title" v-model="form.title" required placeholder="Ví dụ: Học ReactJS trong 7 ngày"/>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">Mô tả ngắn</label>
              <textarea class="form-control" id="description" v-model="form.description" rows="3" placeholder="Mục tiêu chính của kế hoạch này là gì?"></textarea>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="durationInDays" class="form-label">Thời lượng (ngày) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="durationInDays" v-model.number="form.durationInDays" required min="1" />
              </div>
              <div class="col-md-6 mb-3">
                <label for="startDate" class="form-label">Ngày bắt đầu <span class="text-danger">*</span></label>
                <input type="date" class="form-control" id="startDate" v-model="form.startDate" required />
              </div>
            </div>

            <div class="mb-4">
              <label for="dailyGoal" class="form-label">Mục tiêu mỗi ngày (tùy chọn)</label>
              <input type="text" class="form-control" id="dailyGoal" v-model="form.dailyGoal" placeholder="Ví dụ: Hoàn thành 1 chương, code 1 component..."/>
            </div>

            <div class="d-grid">
              <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                <span v-else>Bắt đầu ngay!</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { usePlanStore } from '@/stores/plan';

const planStore = usePlanStore();

const form = reactive({
  title: '',
  description: '',
  durationInDays: 7,
  startDate: '',
  dailyGoal: ''
});

const isLoading = ref(false);
const errorMessage = ref('');

// Tự động điền ngày hôm nay vào ô ngày bắt đầu
onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  form.startDate = today;
});

const handleCreatePlan = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await planStore.createNewPlan(form);
    // Chuyển hướng đã được xử lý trong store
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo kế hoạch, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>