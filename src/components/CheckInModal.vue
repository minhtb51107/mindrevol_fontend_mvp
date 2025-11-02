<template>
  <v-dialog :model-value="dialog" persistent max-width="650px">
    <v-card class="glass-effect">
      <v-card-title>
        <span class="text-h6">{{ isEditing ? 'Chỉnh sửa Check-in' : 'Check-in tiến độ hôm nay' }}</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <p class="text-subtitle-1 mb-2 font-weight-medium">Công việc đã hoàn thành *</p>
          
          <div v-if="isLoadingTasks" class="text-center pa-4">
            <v-progress-circular indeterminate size="24"></v-progress-circular>
            <span class="text-medium-emphasis ml-2">Đang tải tasks...</span>
          </div>
          <v-alert v-else-if="tasksError" type="warning" density="compact" class="mb-3">
            {{ tasksError }}
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

          <template v-if="!isEditing">
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
          </template>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="medium-emphasis" variant="text" @click="closeDialog" :disabled="isLoading">Hủy</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="isLoading">
          {{ isEditing ? 'Lưu thay đổi' : 'Check-in' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth'; // <-- MỚI: DÒNG BỊ THIẾU
import planService from '@/api/planService'; 
import progressService from '@/api/progressService'; 
import fileUploadService from '@/api/fileUploadService'; 
import { 
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VAlert, VForm, 
  VProgressCircular, VChipGroup, VChip, VInput, VTextarea, VFileInput,
  VBtn, VSpacer, VTextField, VIcon
} from 'vuetify/components';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  isEditing: {
    type: Boolean,
    default: false
  },
  existingCheckIn: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const progressStore = useProgressStore();
const planStore = usePlanStore();

const formRef = ref(null);
const isLoading = ref(false); 
const error = ref(''); 

const isLoadingTasks = ref(false); 
const tasksError = ref(''); 
const localTasks = ref([]); 

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
  const allTasks = localTasks.value; 
  
  if (props.isEditing && props.existingCheckIn) {
    const checkedIdsInThisEvent = props.existingCheckIn.completedTasks?.map(t => t.taskId) || [];
    
    return allTasks.filter(task => 
      !task.isCompleted || checkedIdsInThisEvent.includes(task.id)
    );
  } else {
    return allTasks.filter(task => !task.isCompleted);
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm(); 
    
    if (props.isEditing && props.existingCheckIn) {
      // --- CHẾ ĐỘ SỬA ---
      console.log("CheckInModal: Populating form for editing.", props.existingCheckIn);
      form.notes = props.existingCheckIn.notes || '';
      form.links = props.existingCheckIn.links ? [...props.existingCheckIn.links] : []; 
      form.files = []; 

      localTasks.value = planStore.getCurrentDailyTasksSorted;
      form.completedTaskIds = props.existingCheckIn.completedTasks?.map(t => t.taskId) || [];
      isLoadingTasks.value = false;
      tasksError.value = '';

    } else {
      // --- CHẾ ĐỘ TẠO MỚI ---
      fetchTasksForToday();
    }
  }
});

const fetchTasksForToday = async () => {
  isLoadingTasks.value = true;
  tasksError.value = '';
  localTasks.value = [];
  
  const shareableLink = progressStore.currentPlanShareableLink; 
  if (!shareableLink) {
    tasksError.value = "Lỗi: Không tìm thấy kế hoạch.";
    isLoadingTasks.value = false;
    return;
  }
  
  const today = dayjs().format('YYYY-MM-DD');
  
  try {
    
    const [tasksResponse, timelineResponse] = await Promise.allSettled([
      planService.getTasksByDate(shareableLink, today),
      progressService.getDailyTimeline(shareableLink, today) // Tự lấy timeline HÔM NAY
    ]);

    if (tasksResponse.status === 'rejected') {
      throw new Error("Không thể tải danh sách công việc hôm nay.");
    }
    
    const tasks = tasksResponse.value.data || [];
    
    let completedIds = new Set();
    if (timelineResponse.status === 'fulfilled') {
      const authStore = useAuthStore(); // <-- Dòng này giờ đã hợp lệ
      const currentUserId = authStore.currentUser?.id;
      const timelineData = timelineResponse.value.data || [];
      const currentUserTimeline = timelineData.find(t => t.userId === currentUserId);
      
      if (currentUserTimeline && Array.isArray(currentUserTimeline.checkInEvents)) {
        currentUserTimeline.checkInEvents.forEach(event => {
          if (Array.isArray(event.completedTaskIds)) { 
            event.completedTaskIds.forEach(taskId => completedIds.add(taskId));
          }
        });
      }
    }
    
    localTasks.value = tasks
      .map(task => ({
        ...task,
        isCompleted: completedIds.has(task.id) 
      }))
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    
  } catch (err) {
    console.error("CheckInModal: Error fetching tasks for today:", err);
    tasksError.value = err.message || "Không thể tải công việc hôm nay.";
  } finally {
    isLoadingTasks.value = false;
  }
};


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

const handleSubmit = async () => {
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  error.value = '';
  const shareableLink = progressStore.currentPlanShareableLink; 
  if (!shareableLink) {
    error.value = "Không tìm thấy mã kế hoạch.";
    isLoading.value = false;
    return;
  }

  try {
    if (props.isEditing) {
      // --- LOGIC SỬA ---
      const payload = {
        notes: form.notes,
        completedTaskIds: form.completedTaskIds.map(id => Number(id)), 
        links: form.links.filter(link => link && link.trim() !== ''), 
      };
      await progressStore.updateCheckInAction(props.existingCheckIn.id, payload);
      
    } else {
      // --- LOGIC TẠO MỚI ---
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
      
      const checkInData = {
        notes: form.notes,
        completedTaskIds: form.completedTaskIds.map(id => Number(id)), 
        attachments: attachmentRequests,
        links: form.links.filter(link => link && link.trim() !== ''), 
      };
      
      await progressStore.submitCheckIn(shareableLink, checkInData);
    }
    
    closeDialog();
    
  } catch (err) {
    console.error("Check-in/Update error:", err);
    // (Sửa: Đảm bảo err.message được ưu tiên)
    error.value = err.message || err.response?.data?.message || 'Thao tác thất bại. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>