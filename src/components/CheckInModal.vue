<template>
  <v-dialog v-model="dialogVisible" persistent max-width="800px" @click:outside="close">
    <v-card>
      <v-card-title>
        <span class="text-h5">Ghi nhận tiến độ ngày {{ form.date || 'hôm nay' }}</span>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-form @submit.prevent="handleSubmit" ref="checkInForm">
          <div class="pa-4">
            <v-alert
              v-if="errorMessage || uploadError"
              type="error" density="compact" class="mb-4" closable @click:close="clearErrors">
              {{ errorMessage || uploadError }}
            </v-alert>

            <v-text-field
              v-model="form.date" label="Ngày check-in *" type="date" variant="outlined" density="compact"
              :rules="[rules.required, rules.dateNotInFuture, rules.dateWithinPlan]" class="mb-3"
              readonly
            ></v-text-field>

            <div v-if="tasks.length > 0" class="mb-4">
              <p class="text-subtitle-1 mb-2">Đánh dấu công việc đã hoàn thành và thêm chi tiết (nếu cần):</p>
              <div v-for="(task, index) in tasks" :key="task.id" class="task-checkin-item mb-4 pa-3 border rounded">
                <v-checkbox
                  v-model="selectedTaskIds"
                  :label="task.description + (task.deadlineTime ? ` (Deadline: ${task.deadlineTime})` : '')"
                  :value="task.id"
                  density="compact"
                  hide-details
                  color="primary"
                  class="mb-2"
                ></v-checkbox>

                <v-expand-transition>
                  <div v-if="isTaskSelected(task.id)" class="task-interaction-area mt-2 ps-8">
                    <v-textarea
                      v-model="taskInteractions[task.id].commentContent"
                      label="Bình luận cho công việc này..."
                      rows="1" variant="outlined" density="compact" hide-details="auto" auto-grow
                      class="mb-2"
                    ></v-textarea>

                    <v-file-input
                      :model-value="getTaskFilesToUpload(task.id)"
                      @update:modelValue="files => handleTaskFilesSelected(task.id, files)"
                      label="Đính kèm file..." multiple chips clearable show-size counter variant="outlined" density="compact"
                      prepend-icon="" prepend-inner-icon="mdi-paperclip" hide-details="auto"
                      :loading="isUploading && uploadingTaskId === task.id"
                      class="mb-1"
                      accept="image/*,application/pdf"
                    >
                        <template v-slot:selection="{ fileNames }">
                            <template v-for="fileName in fileNames" :key="fileName">
                                <v-chip size="small" label color="primary" class="me-2">
                                    {{ fileName }}
                                </v-chip>
                            </template>
                        </template>
                    </v-file-input>

                     <div v-if="taskInteractions[task.id].attachments.length > 0" class="uploaded-files-list mt-1">
                         <v-chip
                            v-for="(fileInfo, fileIndex) in taskInteractions[task.id].attachments"
                            :key="fileInfo.storedFilename"
                            label size="small" closable @click:close="removeTaskUploadedFile(task.id, fileIndex)" class="me-1 mb-1">
                           <v-icon start :icon="getFileIcon(fileInfo.contentType)"></v-icon>
                           {{ fileInfo.originalFilename }}
                         </v-chip>
                     </div>
                     <v-alert v-if="uploadError && uploadingTaskId === task.id" type="error" density="compact" class="mt-1" closable @click:close="clearUploadError">
                         {{ uploadError }}
                     </v-alert>
                  </div>
                </v-expand-transition>
              </div>

               <v-checkbox
                  v-model="form.completed" label="Hoàn thành tất cả mục tiêu ngày hôm nay" density="compact" hide-details color="primary" class="mt-2 font-weight-medium"
               ></v-checkbox>

            </div>
            <div v-else class="mb-3">
                 <v-checkbox v-model="form.completed" label="Tôi đã hoàn thành mục tiêu ngày hôm nay" density="compact" hide-details color="primary"></v-checkbox>
            </div>

            <v-divider class="my-4"></v-divider>

            <v-textarea v-model="form.notes" label="Ghi chú chung (không thuộc công việc nào)" variant="outlined" density="compact" rows="2" class="mb-3"></v-textarea>
            <v-combobox v-model="form.evidenceLinks" label="Link chung (không thuộc công việc nào)" multiple chips clearable closable-chips variant="outlined" density="compact" prepend-inner-icon="mdi-link-variant" hint="Nhập link và nhấn Enter" persistent-hint class="mb-3">
               <template v-slot:selection="{ item, index }">
                  <v-chip :key="index" label size="small" closable @click:close="removeEvidenceLink(index)">{{ item }}</v-chip>
               </template>
            </v-combobox>
          </div>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">Hủy</v-btn>
        <v-btn color="primary" variant="flat" :loading="isLoading" :disabled="isLoading || isUploading" @click="handleSubmit">
          Lưu tiến độ
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import progressService from '@/api/progressService';
import { VDialog, VCard, VCardTitle, VCardText, VCardActions, VForm, VTextField, VTextarea, VCheckbox, VBtn, VSpacer, VAlert, VCombobox, VChip, VFileInput, VIcon, VDivider, VExpandTransition } from 'vuetify/components';

const props = defineProps({
  shareableLink: { type: String, required: true },
  initialData: { type: Object, default: null },
});
const emit = defineEmits(['close']);

const progressStore = useProgressStore();
const planStore = usePlanStore();
const dialogVisible = ref(true);
const checkInForm = ref(null);

const form = reactive({
  date: '',
  completed: false,
  notes: '',
  evidenceLinks: [],
});

const selectedTaskIds = ref([]);
const tasks = computed(() => planStore.currentPlanTasks);
const planStartDate = computed(() => planStore.currentPlan?.startDate);
const planEndDate = computed(() => planStore.currentPlan?.endDate);

const isLoading = ref(false);
const errorMessage = ref('');

const taskInteractions = reactive({});
const filesToUploadPerTask = reactive({});
const isUploading = ref(false);
const uploadingTaskId = ref(null);
const uploadError = ref('');

const prefillForm = (data) => {
    console.log("Prefilling form with:", data);
    if (!data || !data.date) { // Check if data or data.date exists
        form.date = getTodayDate();
        form.completed = false;
        form.notes = '';
        form.evidenceLinks = [];
        selectedTaskIds.value = [];
         tasks.value.forEach(task => {
             if (!taskInteractions[task.id]) taskInteractions[task.id] = { commentContent: '', attachments: [] };
             else { taskInteractions[task.id].commentContent = ''; taskInteractions[task.id].attachments = []; }
             if (!filesToUploadPerTask[task.id]) filesToUploadPerTask[task.id] = [];
             else filesToUploadPerTask[task.id] = [];
         });
         // Reset validation after setting defaults
         nextTick(() => { checkInForm.value?.resetValidation(); });
        return;
    };

    form.date = data.date; // Use date from data
    form.completed = data.completed ?? false;
    form.notes = data.notes || '';
    form.evidenceLinks = Array.isArray(data.evidence) ? [...data.evidence] : [];

    if (data.completedTaskIds) {
        selectedTaskIds.value = Array.isArray(data.completedTaskIds)
            ? [...data.completedTaskIds]
            : [...new Set(data.completedTaskIds)];
    } else {
        selectedTaskIds.value = [];
    }

    tasks.value.forEach(task => {
        if (!taskInteractions[task.id]) {
            taskInteractions[task.id] = { commentContent: '', attachments: [] };
        } else {
            taskInteractions[task.id].commentContent = '';
            // TODO: Prefill attachments if data.attachments exists and matches task structure
            taskInteractions[task.id].attachments = [];
        }
        if (!filesToUploadPerTask[task.id]) {
           filesToUploadPerTask[task.id] = [];
        } else {
            filesToUploadPerTask[task.id] = [];
        }
    });

    isUploading.value = false;
    uploadingTaskId.value = null;
    uploadError.value = '';
    errorMessage.value = '';

    nextTick(() => {
        checkInForm.value?.resetValidation();
    });
};

watch(tasks, (newTasks) => {
    if (newTasks && newTasks.length > 0) {
        newTasks.forEach(task => {
            if (!taskInteractions[task.id]) taskInteractions[task.id] = { commentContent: '', attachments: [] };
            if (!filesToUploadPerTask[task.id]) filesToUploadPerTask[task.id] = [];
        });
    }
     if (props.initialData) {
         prefillForm(props.initialData);
     } else {
         // Explicitly prefill with today's date if no initial data
         prefillForm(null);
     }
}, { immediate: true, deep: true });

watch(selectedTaskIds, (newIds, oldIds) => {
    const initialLoadOrPrefill = oldIds === undefined || (props.initialData && form.date === props.initialData.date);
    if (!initialLoadOrPrefill && tasks.value.length > 0) {
        const expectedCompleted = newIds.length === tasks.value.length;
        if (form.completed !== expectedCompleted) {
             form.completed = expectedCompleted;
        }
    }
}, { deep: true });

watch(() => form.completed, (isCompleted, wasCompleted) => {
     if (isCompleted !== wasCompleted && tasks.value.length > 0) {
        if (isCompleted && selectedTaskIds.value.length !== tasks.value.length) {
            selectedTaskIds.value = tasks.value.map(task => task.id);
        } else if (!isCompleted && selectedTaskIds.value.length === tasks.value.length) {
             selectedTaskIds.value = [];
        }
    }
});

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minValue: (min) => value => (value >= min) || `Giá trị phải lớn hơn hoặc bằng ${min}.`,
  dateNotInFuture: value => {
      if (!value) return true; // Allow empty initially
      const selectedDate = new Date(value); selectedDate.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return selectedDate <= today || 'Không thể check-in cho ngày tương lai.';
  },
   dateWithinPlan: value => {
       if (!value || !planStartDate.value || !planEndDate.value) return true; // Allow empty or if plan dates missing
       const selectedDate = new Date(value); selectedDate.setHours(0,0,0,0);
       const startDate = new Date(planStartDate.value); startDate.setHours(0,0,0,0);
       const endDate = new Date(planEndDate.value); endDate.setHours(0,0,0,0);
       return (selectedDate >= startDate && selectedDate <= endDate) || 'Ngày check-in phải nằm trong thời gian kế hoạch.';
   },
  taskDescriptionRequired: (value, index) => {
      return true;
  }
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

onMounted(() => {
  prefillForm(props.initialData);
});

watch(() => props.initialData, (newData) => {
    prefillForm(newData);
}, { deep: true });

const clearErrors = () => { errorMessage.value = ''; uploadError.value = ''; };
const close = () => { dialogVisible.value = false; };
const removeEvidenceLink = (index) => { form.evidenceLinks.splice(index, 1); };
const getFileIcon = (contentType) => {
    if (!contentType) return 'mdi-file-outline';
    if (contentType.startsWith('image/')) return 'mdi-file-image-outline';
    if (contentType === 'application/pdf') return 'mdi-file-pdf-box';
    if (contentType.startsWith('video/')) return 'mdi-file-video-outline';
    if (contentType.startsWith('audio/')) return 'mdi-file-music-outline';
    if (contentType.includes('zip') || contentType.includes('rar')) return 'mdi-folder-zip-outline';
    return 'mdi-file-document-outline';
};
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes <= 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
     if (i < 0 || i >= sizes.length) return bytes + ' Bytes';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const isTaskSelected = (taskId) => selectedTaskIds.value.includes(taskId);
const getTaskFilesToUpload = (taskId) => filesToUploadPerTask[taskId] || [];
const clearUploadError = () => { uploadError.value = ''; uploadingTaskId.value = null; };

const handleTaskFilesSelected = async (taskId, newFiles) => {
     filesToUploadPerTask[taskId] = newFiles || [];
     if (!newFiles || newFiles.length === 0) return;
     isUploading.value = true;
     uploadingTaskId.value = taskId;
     uploadError.value = '';
     const uploadPromises = newFiles.map(file =>
        progressService.uploadEvidenceFile(file)
            .then(response => ({...response.data, taskId: taskId}))
            .catch(error => ({ error: true, fileName: file.name, message: error.response?.data?.message || 'Upload thất bại', taskId: taskId }))
    );
    try {
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(result => !result.error && result.taskId === taskId);
        const failedUploads = results.filter(result => result.error && result.taskId === taskId);
        if (taskInteractions[taskId]) {
             successfulUploads.forEach(uploadInfo => {
                 taskInteractions[taskId].attachments.push({
                     storedFilename: uploadInfo.storedFilename,
                     fileUrl: uploadInfo.fileUrl,
                     originalFilename: uploadInfo.originalFilename,
                     contentType: uploadInfo.contentType,
                     size: uploadInfo.size // Use 'size' if API response uses 'size'
                 });
             });
        }
        if (failedUploads.length > 0) {
            uploadError.value = `Lỗi tải lên ${failedUploads[0].fileName}: ${failedUploads[0].message}`;
        }
        filesToUploadPerTask[taskId] = [];
    } catch (error) {
        console.error(`Lỗi xử lý upload files cho task ${taskId}:`, error);
        uploadError.value = "Đã có lỗi xảy ra trong quá trình upload.";
    } finally {
        isUploading.value = false;
        uploadingTaskId.value = null;
    }
};

const removeTaskUploadedFile = (taskId, fileIndex) => {
    if (taskInteractions[taskId]) {
        const removedFile = taskInteractions[taskId].attachments.splice(fileIndex, 1)[0];
        console.log("Removed attachment:", removedFile);
        // TODO: Gọi API xóa file vật lý
    }
};

const handleSubmit = async () => {
  const { valid } = await checkInForm.value.validate();
  if (!valid || isUploading.value) {
      if(!valid) console.error("Form validation failed");
      return;
  }

  isLoading.value = true;
  clearErrors();

  try {
     const taskUpdatesPayload = selectedTaskIds.value
        .map(taskId => {
            const interaction = taskInteractions[taskId];
            const updateData = { taskId };
            if (interaction) {
                if (interaction.commentContent && interaction.commentContent.trim()) {
                    updateData.commentContent = interaction.commentContent.trim();
                }
                if (interaction.attachments && interaction.attachments.length > 0) {
                    updateData.attachments = interaction.attachments.map(f => ({
                        storedFilename: f.storedFilename,
                        fileUrl: f.fileUrl,
                        originalFilename: f.originalFilename,
                        contentType: f.contentType,
                        fileSize: f.size // Ensure field name matches backend DTO (fileSize)
                    }));
                }
            }
             return (updateData.commentContent || updateData.attachments?.length > 0) ? updateData : null;
        })
        .filter(update => update !== null);

     const payload = {
       date: form.date,
       completed: form.completed,
       notes: form.notes,
       evidence: form.evidenceLinks.filter(link => link && link.trim()), // evidence links
       completedTaskIds: selectedTaskIds.value,
       taskUpdates: taskUpdatesPayload
     };

    console.log("Submit Payload:", JSON.stringify(payload, null, 2));

    await progressStore.logDailyProgress(props.shareableLink, payload);

    await planStore.fetchPlan(props.shareableLink);
    close();

  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể ghi nhận tiến độ, vui lòng thử lại.';
    console.error("Submit error:", error.response?.data || error);
  } finally {
    isLoading.value = false;
  }
};

watch(dialogVisible, (newValue) => { if (!newValue) { setTimeout(() => emit('close'), 300); }});

</script>

<style scoped>
.task-checkin-item { background-color: #f9f9f9; }
.uploaded-files-list { margin-top: -8px; }
:deep(.v-file-input .v-chip) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
.task-checkin-item :deep(.v-label) { opacity: 1 !important; }
</style>