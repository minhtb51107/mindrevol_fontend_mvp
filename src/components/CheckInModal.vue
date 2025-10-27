<template>
  <v-dialog :model-value="modelValue" @update:modelValue="updateVisible" persistent max-width="600px" scrollable>
    <v-card>
      <v-card-title>
        <span class="text-h5">Check-in Hoạt động</span>
        <v-chip size="small" variant="outlined" class="ml-2">{{ todayDateFormatted }}</v-chip>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="checkInForm" @submit.prevent="handleSubmit">
          <v-alert
            v-if="errorMessage || uploadError"
            type="error" density="compact" class="mb-4" closable @click:close="clearErrors">
            {{ errorMessage || uploadError }}
          </v-alert>

          <div v-if="tasksLoading" class="text-center my-4">
             <v-progress-circular indeterminate size="small"></v-progress-circular>
             <span class="ml-2 text-caption">Đang tải công việc...</span>
          </div>
          <div v-else-if="tasks.length > 0" class="mb-4 task-selection-section">
            <p class="text-subtitle-1 mb-2">Chọn các công việc đã hoàn thành:</p>
             <v-checkbox
                v-for="task in tasks"
                :key="task.id"
                v-model="selectedTaskIds"
                :label="task.description + (task.deadlineTime ? ` (Deadline: ${task.deadlineTime})` : '')"
                :value="task.id"
                density="compact"
                hide-details
                color="primary"
                class="mb-1 task-checkbox-item"
              ></v-checkbox>
              <v-checkbox
                 v-model="allTasksCompleted"
                 label="Hoàn thành tất cả công việc hôm nay"
                 density="compact"
                 hide-details
                 color="primary"
                 class="mt-2 font-weight-medium"
                 :disabled="tasks.length === 0"
               ></v-checkbox>
          </div>
           <p v-else class="text-caption text-medium-emphasis mb-4">Không có công việc nào được định nghĩa cho hôm nay.</p>


          <v-divider class="my-4"></v-divider>

          <v-textarea
            v-model="notes"
            label="Ghi chú chung (tùy chọn)"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            class="mb-3"
          ></v-textarea>

          <v-file-input
            :model-value="filesToUpload"
            @update:modelValue="handleFilesSelected"
            label="Đính kèm hình ảnh/tệp (tùy chọn)"
            multiple
            chips
            clearable
            show-size
            counter
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            hide-details="auto"
            :loading="isUploading"
            class="mb-1"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          >
            <template v-slot:selection="{ fileNames }">
              <template v-for="fileName in fileNames" :key="fileName">
                <v-chip size="small" label color="primary" class="me-2">
                  {{ fileName }}
                </v-chip>
              </template>
            </template>
          </v-file-input>

          <div v-if="attachments.length > 0" class="uploaded-files-list mt-2">
               <v-chip
                 v-for="(fileInfo, index) in attachments"
                 :key="fileInfo.storedFilename"
                 label size="small" closable @click:close="removeUploadedFile(index)" class="me-1 mb-1">
                 <v-icon start :icon="getFileIcon(fileInfo.contentType)"></v-icon>
                 {{ fileInfo.originalFilename || fileInfo.storedFilename }}
               </v-chip>
           </div>
           <v-alert v-if="uploadError" type="error" density="compact" class="mt-1" closable @click:close="clearUploadError">
              {{ uploadError }}
           </v-alert>

        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal" :disabled="isLoading || isUploading">Hủy</v-btn>
        <v-btn
          color="success"
          variant="flat"
          :loading="isLoading"
          :disabled="isLoading || isUploading || selectedTaskIds.length === 0"
          @click="handleSubmit"
          prepend-icon="mdi-check-circle-outline"
        >
          Check-in
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import progressService from '@/api/progressService';
import dayjs from 'dayjs';
import {
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VForm, VTextField, VTextarea, VCheckbox,
  VBtn, VSpacer, VAlert, VChip, VFileInput, VIcon, VDivider, VProgressCircular
} from 'vuetify/components';

// --- Props & Emits ---
const props = defineProps({
  modelValue: { type: Boolean, default: false }, // v-model
  // shareableLink: { type: String, required: true } // Lấy từ planStore thay vì prop
});
const emit = defineEmits(['update:modelValue', 'checkin-success']); // update:modelValue cho v-model

// --- Store ---
const progressStore = useProgressStore();
const planStore = usePlanStore();

// --- Refs & Reactive State ---
const checkInForm = ref(null);
const notes = ref('');
const selectedTaskIds = ref([]); // Chỉ lưu ID task đã chọn
const attachments = ref([]); // Lưu thông tin file đã upload [{ storedFilename, fileUrl, ... }]
const filesToUpload = ref([]); // File đang chọn trong v-file-input
const isUploading = ref(false);
const uploadError = ref('');
const isLoading = ref(false); // Loading khi submit check-in
const errorMessage = ref(''); // Lỗi khi submit check-in

// Lấy task list của ngày hôm nay từ planStore
const tasks = computed(() => planStore.getCurrentDailyTasksSorted);
// Lấy trạng thái loading task từ planStore
const tasksLoading = computed(() => planStore.isLoadingDailyTasks);
// Lấy shareable link từ planStore
const shareableLink = computed(() => planStore.currentPlan?.shareableLink);

const today = dayjs();
const todayDateFormatted = today.format('DD/MM/YYYY');

// --- Computed ---
// Binding 2 chiều cho checkbox "Hoàn thành tất cả"
const allTasksCompleted = computed({
    get() {
        return tasks.value.length > 0 && selectedTaskIds.value.length === tasks.value.length;
    },
    set(value) {
        if (value) {
            selectedTaskIds.value = tasks.value.map(task => task.id);
        } else {
            // Chỉ bỏ chọn nếu đang chọn tất cả
            if (selectedTaskIds.value.length === tasks.value.length) {
                 selectedTaskIds.value = [];
            }
        }
    }
});

// --- Watchers ---
// Reset form khi modal mở
watch(() => props.modelValue, (isVisible) => {
  if (isVisible) {
    console.log("CheckInModal: Opening...");
    resetForm();
    // Logic fetch task của hôm nay đã chuyển ra PlanDetailView.vue
    // Chỉ cần kiểm tra lại xem task đã load chưa
    if (planStore.currentDailyTasks.length === 0 && !planStore.isLoadingDailyTasks) {
         console.warn("CheckInModal: Today's tasks might not be loaded yet.");
         // Có thể fetch lại ở đây nếu cần dự phòng
         // if (shareableLink.value) {
         //   planStore.fetchDailyTasks(shareableLink.value, today.format('YYYY-MM-DD'));
         // }
    }
  }
});

// Cập nhật lại `allTasksCompleted` nếu user tự chọn/bỏ chọn từng task
watch(selectedTaskIds, (newIds) => {
    if (tasks.value.length > 0) {
        // Không tự động tick 'allTasksCompleted' ở đây nữa,
        // chỉ cập nhật trạng thái của nó dựa trên selectedTaskIds
        // Việc tick `allTasksCompleted` sẽ tự động chọn hết task (trong setter)
    }
}, { deep: true });


// --- Methods ---
const updateVisible = (value) => {
  emit('update:modelValue', value);
};

const closeModal = () => {
  updateVisible(false);
};

const resetForm = () => {
  notes.value = '';
  selectedTaskIds.value = [];
  attachments.value = [];
  filesToUpload.value = [];
  isUploading.value = false;
  uploadError.value = '';
  isLoading.value = false;
  errorMessage.value = '';
  checkInForm.value?.resetValidation();
};

const clearErrors = () => {
  errorMessage.value = '';
  uploadError.value = '';
};
const clearUploadError = () => {
  uploadError.value = '';
};

const getFileIcon = (contentType) => { /* ... giữ nguyên như trước ... */
    if (!contentType) return 'mdi-file-outline';
    if (contentType.startsWith('image/')) return 'mdi-file-image-outline';
    if (contentType === 'application/pdf') return 'mdi-file-pdf-box';
    if (contentType.startsWith('video/')) return 'mdi-file-video-outline';
    if (contentType.startsWith('audio/')) return 'mdi-file-music-outline';
    if (contentType.includes('zip') || contentType.includes('rar')) return 'mdi-folder-zip-outline';
    if (contentType.includes('wordprocessingml')) return 'mdi-file-word-box-outline'; // docx
    if (contentType.includes('spreadsheetml')) return 'mdi-file-excel-box-outline'; // xlsx
    if (contentType.includes('presentationml')) return 'mdi-file-powerpoint-box-outline'; // pptx
    return 'mdi-file-document-outline';
};

// Xử lý khi chọn file (upload ngay lập tức)
const handleFilesSelected = async (newFiles) => {
  filesToUpload.value = newFiles || []; // Cập nhật model của v-file-input
  if (!newFiles || newFiles.length === 0) return;

  isUploading.value = true;
  uploadError.value = '';
  let hasError = false;

  // Upload từng file một
  for (const file of newFiles) {
    try {
      console.log(`Uploading ${file.name}...`);
      const response = await progressService.uploadEvidenceFile(file);
      // Thêm file đã upload thành công vào danh sách attachments
      attachments.value.push({
        storedFilename: response.data.storedFilename,
        fileUrl: response.data.fileUrl,
        originalFilename: response.data.originalFilename,
        contentType: response.data.contentType,
        fileSize: response.data.size // Đảm bảo key 'fileSize' khớp API
      });
      console.log(`Uploaded ${file.name}:`, response.data);
    } catch (error) {
      hasError = true;
      const errorMsg = error.response?.data?.message || `Tải lên ${file.name} thất bại.`;
      console.error(`Upload failed for ${file.name}:`, error);
      // Hiển thị lỗi đầu tiên gặp phải
      if (!uploadError.value) {
        uploadError.value = errorMsg;
      }
      // (Optional) Có thể hiển thị nhiều lỗi hoặc thông báo cụ thể hơn
    }
  }

  filesToUpload.value = []; // Xóa file khỏi input sau khi xử lý xong
  isUploading.value = false;

  // Nếu có lỗi, không đóng modal, để user thấy lỗi
  // if (hasError) { ... }
};

// Xóa file đã upload khỏi danh sách (chưa gọi API xóa vật lý)
const removeUploadedFile = (index) => {
  const removedFile = attachments.value.splice(index, 1)[0];
  console.log("Removed attachment (local):", removedFile);
  // TODO: Gọi API để xóa file vật lý nếu cần
  // Cần storedFilename để gọi API xóa
  // await someApiService.deleteFile(removedFile.storedFilename);
};

// Submit form Check-in
const handleSubmit = async () => {
  if (!shareableLink.value) {
      errorMessage.value = "Lỗi: Không tìm thấy mã kế hoạch.";
      return;
  }
  if (selectedTaskIds.value.length === 0) {
      errorMessage.value = "Vui lòng chọn ít nhất một công việc đã hoàn thành.";
       return;
  }
  // Optional: Validate form nếu cần (ngoài các rules đã có)
  // const { valid } = await checkInForm.value.validate();
  // if (!valid) return;


  isLoading.value = true;
  clearErrors();

  try {
    const payload = {
      notes: notes.value.trim() || null, // Gửi null nếu ghi chú rỗng
      attachments: attachments.value.map(f => ({ // Chỉ gửi các trường cần thiết
         storedFilename: f.storedFilename,
         fileUrl: f.fileUrl,
         originalFilename: f.originalFilename,
         contentType: f.contentType,
         fileSize: f.fileSize
      })),
      completedTaskIds: selectedTaskIds.value,
    };

    console.log("Submitting Check-in Payload:", JSON.stringify(payload, null, 2));

    // Gọi action submitCheckIn của progressStore
    const checkInResult = await progressStore.submitCheckIn(shareableLink.value, payload);

    console.log("Check-in successful:", checkInResult);
    emit('checkin-success', checkInResult); // Thông báo thành công cho component cha
    closeModal(); // Đóng modal sau khi thành công

  } catch (error) {
    errorMessage.value = error || 'Không thể check-in, vui lòng thử lại.';
    console.error("Check-in submit error:", error);
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
.task-selection-section {
    max-height: 250px; /* Giới hạn chiều cao phần chọn task */
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px 12px;
}
.task-checkbox-item :deep(.v-label) {
   opacity: 1 !important; /* Đảm bảo label rõ ràng */
   white-space: normal; /* Cho phép label xuống dòng */
   line-height: 1.3;
}
.uploaded-files-list {
  margin-top: -8px; /* Giảm khoảng cách trên */
}
/* Style cho chip file upload */
:deep(.v-file-input .v-chip__content) {
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
   max-width: 150px; /* Giới hạn chiều rộng tên file */
   display: inline-block; /* Cần thiết cho text-overflow */
}
</style>