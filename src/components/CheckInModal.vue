<template>
  <v-dialog :model-value="dialog" persistent max-width="650px" scrollable>
    <v-card class="glass-effect">
      <v-card-title class="d-flex justify-space-between align-center pl-4 pr-2 py-3">
        <span class="text-h6 font-weight-bold text-primary d-flex align-center">
          <v-icon icon="mdi-checkbox-marked-circle-outline" class="mr-2"></v-icon>
          {{ isEditing ? 'Chỉnh sửa Check-in' : 'Check-in Hôm nay' }}
        </span>
        <v-btn icon="mdi-close" variant="text" color="medium-emphasis" @click="closeDialog"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-card-text class="pa-4" style="max-height: 70vh; overflow-y: auto;">
        <v-alert
          v-if="planMotivation"
          color="amber-lighten-4"
          border="start"
          border-color="amber"
          class="mb-4"
          rounded="lg"
          density="comfortable"
        >
          <template v-slot:prepend>
             <v-icon icon="mdi-lightbulb-on" color="amber-darken-3"></v-icon>
          </template>
          <div class="text-subtitle-2 font-weight-bold text-amber-darken-4">
            Hãy nhớ lý do bạn bắt đầu:
          </div>
          <div class="text-body-2 font-italic text-grey-darken-3 mt-1">
            "{{ planMotivation }}"
          </div>
        </v-alert>

        <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = ''" variant="tonal">
          {{ error }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <div class="mb-4">
              <p class="text-subtitle-1 mb-2 font-weight-bold d-flex align-center">
                <v-icon icon="mdi-format-list-checks" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                Bạn đã hoàn thành những gì hôm nay? *
              </p>
              
              <div v-if="availableTasks.length === 0" class="pa-4 bg-grey-lighten-4 rounded text-center text-medium-emphasis">
                <span v-if="isEditing">Không có công việc nào khác để chọn.</span>
                <span v-else>Bạn đã hoàn thành hết công việc hôm nay, hoặc chưa có công việc nào!</span>
              </div>

              <v-chip-group v-else v-model="form.completedTaskIds" column multiple class="task-chip-group">
                <v-chip
                  v-for="task in availableTasks"
                  :key="task.id"
                  :value="task.id"
                  filter
                  variant="elevated"
                  :color="form.completedTaskIds.includes(task.id) ? 'success' : 'default'"
                  class="task-chip"
                >
                  {{ task.description }}
                </v-chip>
              </v-chip-group>
              <v-input :rules="[rules.requiredTasks]" :model-value="form.completedTaskIds" class="d-none"></v-input>
          </div>

          <div class="mb-4">
            <p class="text-subtitle-1 mb-2 font-weight-bold d-flex align-center">
              <v-icon icon="mdi-notebook-outline" size="small" class="mr-2 text-medium-emphasis"></v-icon>
              Ghi chú / Cảm nghĩ (Tùy chọn)
            </p>
            <v-textarea
              v-model="form.notes"
              placeholder="Hôm nay bạn cảm thấy thế nào? Có gặp khó khăn gì không?"
              rows="3"
              variant="outlined"
              density="comfortable"
              bg-color="grey-lighten-5"
              hide-details="auto"
            ></v-textarea>
          </div>
          
          <div class="mb-4">
              <p class="text-subtitle-1 mb-2 font-weight-bold d-flex align-center">
                <v-icon icon="mdi-link-variant" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                Liên kết minh chứng (Tùy chọn)
              </p>
              <div v-for="(link, index) in form.links" :key="index" class="d-flex align-center mb-2">
                <v-text-field
                  v-model="form.links[index]"
                  placeholder="https://example.com/proof"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="grey-lighten-5"
                  class="flex-grow-1 mr-2"
                >
                  <template v-slot:prepend-inner>
                    <v-icon icon="mdi-link" size="small" class="text-medium-emphasis"></v-icon>
                  </template>
                </v-text-field>
                <v-btn icon="mdi-close-circle-outline" variant="text" color="error" density="comfortable" @click="removeLink(index)" title="Xóa link"></v-btn>
              </div>
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addLink" :disabled="form.links.length >= 5">
                Thêm liên kết
              </v-btn>
          </div>

          <template v-if="!isEditing">
            <div class="mb-2">
              <p class="text-subtitle-1 mb-2 font-weight-bold d-flex align-center">
                <v-icon icon="mdi-image-multiple-outline" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                Ảnh minh chứng (Tùy chọn)
              </p>
              <v-file-input
                v-model="form.files"
                placeholder="Chọn tối đa 5 ảnh"
                multiple
                chips
                closable-chips
                accept="image/*"
                variant="outlined"
                density="comfortable"
                bg-color="grey-lighten-5"
                prepend-icon=""
                prepend-inner-icon="mdi-camera"
                :rules="[rules.fileCount]"
                hide-details="auto"
                show-size
              ></v-file-input>
            </div>
          </template>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="medium-emphasis" @click="closeDialog" :disabled="isLoading" class="mr-2">
          Hủy bỏ
        </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="isLoading" :disabled="isLoading" class="px-6">
          {{ isEditing ? 'Lưu thay đổi' : 'Hoàn thành Check-in' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import { usePlanTaskStore } from '@/stores/planTaskStore';
import fileUploadService from '@/api/fileUploadService'; 
import { 
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VAlert, VForm, 
  VChipGroup, VChip, VInput, VTextarea, VFileInput,
  VBtn, VSpacer, VTextField, VIcon, VDivider
} from 'vuetify/components';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  isEditing: { type: Boolean, default: false },
  existingCheckIn: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue']);

const progressStore = useProgressStore();
const planStore = usePlanStore();
const planTaskStore = usePlanTaskStore();

const planMotivation = computed(() => planStore.currentPlan?.motivation);

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

// Computed để lọc ra các task CÓ THỂ check-in
const availableTasks = computed(() => {
  // Lấy trực tiếp từ store cho reactive như yêu cầu
  const allTasks = planTaskStore.sortedDailyTasks; 
  
  if (props.isEditing && props.existingCheckIn) {
     // Khi sửa: Hiện các task CHƯA hoàn thành HOẶC các task đã chọn trong chính lần check-in này
     const currentEventTaskIds = props.existingCheckIn.completedTaskIds || 
                                 props.existingCheckIn.completedTasks?.map(t => t.taskId) || 
                                 [];
                                 
     // Sử dụng progressStore.todayCompletedTaskIds để kiểm tra trạng thái hoàn thành chính xác nhất
     return allTasks.filter(task => !progressStore.todayCompletedTaskIds.has(task.id) || currentEventTaskIds.includes(task.id));
  } else {
     // Khi tạo mới: CHỈ hiện các task CHƯA hoàn thành (không nằm trong Set completedTaskIdsToday)
     return allTasks.filter(task => !progressStore.todayCompletedTaskIds.has(task.id));
  }
});

// Watcher đã được cập nhật để gọi API mới
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    resetForm();
    
    // --- QUAN TRỌNG: Tải mới nhất danh sách đã hoàn thành từ server ---
    if (progressStore.currentPlanShareableLink) {
        // Gọi API để lấy danh sách ID task đã hoàn thành hôm nay
        await progressStore.fetchTodayCompletedTasks(progressStore.currentPlanShareableLink);
    }

    if (props.isEditing && props.existingCheckIn) {
      form.notes = props.existingCheckIn.notes || '';
      form.links = props.existingCheckIn.links ? [...props.existingCheckIn.links] : [];
      form.files = [];
      // Map dữ liệu cũ vào form (ưu tiên completedTaskIds nếu có)
      if (props.existingCheckIn.completedTaskIds) {
          form.completedTaskIds = [...props.existingCheckIn.completedTaskIds];
      } else if (props.existingCheckIn.completedTasks) {
          form.completedTaskIds = props.existingCheckIn.completedTasks.map(t => t.taskId);
      }
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
  emit('update:modelValue', false);
};

const addLink = () => {
  if (form.links.length < 5) form.links.push('');
};

const removeLink = (index) => {
  form.links.splice(index, 1);
};

const rules = {
  requiredTasks: (value) => (value && value.length > 0) || 'Bạn phải chọn ít nhất 1 công việc.',
  fileCount: (value) => (!value || value.length <= 5) || 'Chỉ được upload tối đa 5 ảnh.'
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  error.value = '';
  const shareableLink = progressStore.currentPlanShareableLink; 
  if (!shareableLink) {
    error.value = "Không tìm thấy mã hành trình.";
    isLoading.value = false;
    return;
  }

  const checkInDate = progressStore.getSelectedDate || dayjs().format('YYYY-MM-DD');

  try {
    if (props.isEditing) {
      const payload = {
        notes: form.notes,
        completedTaskIds: form.completedTaskIds.map(id => Number(id)), 
        links: form.links.filter(link => link && link.trim() !== ''), 
      };
      await progressStore.updateCheckInAction(props.existingCheckIn.id, payload);
    } else {
      let attachmentRequests = [];
      if (form.files.length > 0) {
        const formData = new FormData();
        form.files.forEach(file => formData.append('files', file));
        const uploadResponses = await fileUploadService.uploadFiles(formData, 'checkin'); 
        attachmentRequests = uploadResponses.map(res => ({
          storedFilename: res.storedFilename,
          fileUrl: res.fileUrl,
          originalFilename: res.originalFilename,
          contentType: res.fileType, 
          fileSize: res.fileSize,
        }));
      }
      
      const checkInData = {
        date: checkInDate,
        notes: form.notes,
        completedTaskIds: form.completedTaskIds.map(id => Number(id)), 
        attachments: attachmentRequests,
        links: form.links.filter(link => link && link.trim() !== ''), 
      };
      await progressStore.submitCheckIn(shareableLink, checkInData);
    }
    closeDialog();
  } catch (err) {
    console.error("Check-in error:", err);
    error.value = err.message || err.response?.data?.message || 'Thao tác thất bại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.task-chip-group .v-chip--selected {
  font-weight: bold;
}
.task-chip {
    margin-bottom: 8px;
}
</style>