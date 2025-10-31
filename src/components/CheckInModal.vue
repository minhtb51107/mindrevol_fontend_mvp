<template>
  <v-dialog v-model="dialog" persistent max-width="650px">
    <v-card class="glass-effect">
      <v-card-title>
        <span class="text-h6">Check-in tiến độ hôm nay</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <p class="text-subtitle-1 mb-2 font-weight-medium">Công việc đã hoàn thành *</p>
          <div v-if="planStore.isLoadingDailyTasks && availableTasks.length === 0" class="text-center pa-4">
            <v-progress-circular indeterminate size="24"></v-progress-circular>
            <span class="text-medium-emphasis ml-2">Đang tải tasks...</span>
          </div>
          <v-alert v-else-if="planStore.taskError" type="warning" density="compact" class="mb-3">
            {{ planStore.taskError }}
          </v-alert>
          <div v-else-if="availableTasks.length === 0" class="text-medium-emphasis mb-3">
            Không có công việc nào khả dụng để check-in.
          </div>
          <v-chip-group v-else v-model="form.completedTaskIds" column multiple class="mb-3">
            <v-chip
              v-for="task in availableTasks"
              :key="task.id"
              :value="task.id"
              filter
              variant="outlined"
              color="primary"
            >
              {{ task.description }}
            </v-chip>
          </v-chip-group>
          <v-input :rules="[rules.requiredTasks]" :model-value="form.completedTaskIds" class="d-none"></v-input>

          <v-textarea
            v-model="form.notes"
            label="Ghi chú (Tùy chọn)"
            rows="3"
            variant="outlined"
            density="compact"
            class="mb-3"
          ></v-textarea>
          
          <p class="text-subtitle-1 mb-2 font-weight-medium">Liên kết (Tùy chọn)</p>
          <div v-for="(link, index) in form.links" :key="index" class="d-flex align-center mb-2">
            <v-text-field
              v-model="form.links[index]"
              label="URL"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-link-variant"
              class="mr-2"
              placeholder="https://example.com"
            ></v-text-field>
            <v-btn icon="mdi-close" variant="text" color="error" @click="removeLink(index)" title="Xóa link"></v-btn>
          </div>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="addLink"
            class="mb-4"
          >
            Thêm liên kết
          </v-btn>

          <p class="text-subtitle-1 mb-2 font-weight-medium">Ảnh minh chứng (Tùy chọn)</p>
          <v-file-input
            v-model="form.files"
            label="Chọn ảnh (tối đa 5 ảnh)"
            multiple
            chips
            accept="image/*"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-camera-outline"
            :rules="[rules.fileCount]"
          ></v-file-input>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="medium-emphasis" variant="text" @click="closeDialog" :disabled="isLoading">Hủy</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="isLoading">Check-in</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import progressService from '@/api/progressService';
import fileUploadService from '@/api/fileUploadService'; 
import { 
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VAlert, VForm, 
  VProgressCircular, VChipGroup, VChip, VInput, VTextarea, VFileInput,
  VBtn, VSpacer, VTextField, VIcon
} from 'vuetify/components';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

const progressStore = useProgressStore();
const planStore = usePlanStore();
const authStore = useAuthStore(); // Vẫn cần authStore, nhưng không cần truyền email

const formRef = ref(null);
const isLoading = ref(false);
const error = ref('');

const form = reactive({
  notes: '',
  completedTaskIds: [],
  files: [], 
  links: [], 
});

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const availableTasks = computed(() => {
  return planStore.currentDailyTasks.filter(task => !task.completed);
});

watch(dialog, (newValue) => {
  if (newValue) {
    resetForm();
    const today = dayjs().format('YYYY-MM-DD');
    // Luôn fetch task CỦA HÔM NAY khi mở modal
    // (Vì check-in chỉ áp dụng cho hôm nay)
    if (planStore.selectedDate !== today) {
       planStore.fetchDailyTasks(planStore.currentPlan.shareableLink, today);
    }
  }
});

const resetForm = () => {
  form.notes = '';
  form.completedTaskIds = [];
  form.files = [];
  form.links = []; 
  error.value = '';
  formRef.value?.resetValidation();
};

const closeDialog = () => {
  dialog.value = false;
};

const addLink = () => {
  if (form.links.length < 5) { 
     form.links.push('');
  }
};

const removeLink = (index) => {
  form.links.splice(index, 1);
};

const rules = {
  requiredTasks: (value) => (value && value.length > 0) || 'Bạn phải chọn ít nhất 1 công việc.',
  fileCount: (value) => (value && value.length <= 5) || 'Chỉ được upload tối đa 5 ảnh.'
};

// === CẬP NHẬT: handleSubmit (Logic quan trọng) ===
const handleSubmit = async () => {
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  error.value = '';

  try {
    // 1. Upload files trước
    let attachmentRequests = [];
    if (form.files.length > 0) {
      const formData = new FormData();
      form.files.forEach(file => {
        formData.append('files', file); 
      });
      
      const uploadResponses = await fileUploadService.uploadFiles(formData, 'checkin'); 
      
      attachmentRequests = uploadResponses.map(res => ({
        storedFilename: res.storedFilename,
        fileUrl: res.fileUrl,
        originalFilename: res.originalFilename,
        contentType: res.fileType, 
        fileSize: res.fileSize,
      }));
    }
    
    // 2. Build CheckInRequest DTO
    const checkInData = {
      notes: form.notes,
      completedTaskIds: form.completedTaskIds.map(id => Number(id)), 
      attachments: attachmentRequests,
      links: form.links.filter(link => link && link.trim() !== ''), 
    };
    
    // 3. Gọi API check-in (ĐÃ SỬA)
    // Bỏ userEmail. Backend sẽ tự lấy từ token.
    await progressService.createCheckIn(planStore.currentPlan.shareableLink, checkInData);
    
    // 4. Xử lý thành công
    closeDialog();
    
    // Backend sẽ gửi WebSocket "NEW_CHECK_IN"

  } catch (err) {
    console.error("Check-in error:", err);
    error.value = err.response?.data?.message || 'Check-in thất bại. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>