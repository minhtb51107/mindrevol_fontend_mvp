<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Ghi nhận tiến độ hôm nay</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="date" class="form-label">Ngày check-in</label>
              <input type="date" class="form-control" id="date" v-model="form.date" required />
            </div>
            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="completed" v-model="form.completed" />
              <label class="form-check-label" for="completed">Tôi đã hoàn thành mục tiêu ngày hôm nay</label>
            </div>
            <div class="mb-3">
              <label for="notes" class="form-label">Ghi chú (Cảm nhận, khó khăn...)</label>
              <textarea class="form-control" id="notes" v-model="form.notes" rows="3"></textarea>
            </div>
            <div class="mb-3">
              <label for="evidence" class="form-label">Link bằng chứng (Github, Figma, ảnh...)</label>
              <input type="text" class="form-control" id="evidence" v-model="form.evidence" placeholder="https://..." />
            </div>
            <div class="modal-footer pe-0">
              <button type="button" class="btn btn-secondary" @click="close">Hủy</button>
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                <span v-else>Lưu tiến độ</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useProgressStore } from '@/stores/progress';

const props = defineProps({
  shareableLink: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const progressStore = useProgressStore();

const form = reactive({
  date: '',
  completed: true,
  notes: '',
  evidence: '',
});

const isLoading = ref(false);
const errorMessage = ref('');

onMounted(() => {
  form.date = new Date().toISOString().split('T')[0];
});

const close = () => {
  emit('close');
};

const handleSubmit = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await progressStore.logDailyProgress(props.shareableLink, form);
    close(); // Đóng modal sau khi thành công
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể ghi nhận, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.d-block {
    display: block;
}
</style>