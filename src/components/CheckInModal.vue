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
                    <MentionTextarea
                      ref="mentionTextareaRefs"
                      v-model="taskInteractions[task.id].commentContent"
                      label="Bình luận cho công việc này..."
                      :items="mentionableMembers"
                      rows="1" variant="outlined" density="compact" hide-details="auto" auto-grow
                      class="mb-2"
                    />
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
// *** THÊM IMPORT MENTIONTEXTAREA ***
import MentionTextarea from '@/components/MentionTextarea.vue';
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
const mentionTextareaRefs = ref([]); // Ref cho các MentionTextarea

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

// *** THÊM COMPUTED ĐỂ CHUẨN BỊ DATA CHO MENTION ***
const mentionableMembers = computed(() => {
    // Cần import useAuthStore nếu chưa có ở đầu file script setup
    // import { useAuthStore } from '@/stores/auth';
    // const authStore = useAuthStore(); // Lấy authStore

    if (!planStore.currentPlan?.members) return [];
    const currentUserId = authStore.currentUser?.id; // Lấy ID của user hiện tại

    return planStore.currentPlan.members
        .filter(member => member.userId !== currentUserId) // Lọc bỏ user hiện tại
        .map(member => ({
            id: member.userId,
            label: member.userFullName,
            avatar: null, // Thêm avatar URL nếu có
            initial: member.userFullName ? member.userFullName.charAt(0).toUpperCase() : '?',
            email: member.userEmail,
        }));
});
// *** KẾT THÚC THÊM ***

const prefillForm = (data) => {
    console.log("Prefilling form with:", data);
    if (!data || !data.date) {
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
         nextTick(() => { checkInForm.value?.resetValidation(); });
        return;
    };

    form.date = data.date;
    form.completed = data.completed ?? false;
    form.notes = data.notes || '';
    form.evidenceLinks = Array.isArray(data.evidence) ? [...data.evidence] : [];

    if (data.completedTaskIds) {
        selectedTaskIds.value = Array.isArray(data.completedTaskIds)
            ? [...data.completedTaskIds]
            : [...new Set(data.completedTaskIds)]; // Use Set constructor for Sets
    } else {
        selectedTaskIds.value = [];
    }

    // Initialize taskInteractions for ALL tasks first
    tasks.value.forEach(task => {
        if (!taskInteractions[task.id]) {
            taskInteractions[task.id] = { commentContent: '', attachments: [] };
        }
        if (!filesToUploadPerTask[task.id]) {
            filesToUploadPerTask[task.id] = [];
        }
        // Then clear existing data before potentially prefilling (or keep empty)
        taskInteractions[task.id].commentContent = '';
        taskInteractions[task.id].attachments = []; // Reset attachments on prefill
        filesToUploadPerTask[task.id] = [];
    });

    // TODO: If `initialData` includes task-specific comments/attachments for THIS check-in, prefill them here.
    // This requires `initialData` structure to align with `taskUpdates` payload.
    // Example (assuming initialData.taskUpdates exists):
    // if (Array.isArray(data.taskUpdates)) {
    //     data.taskUpdates.forEach(update => {
    //         if (taskInteractions[update.taskId]) {
    //             taskInteractions[update.taskId].commentContent = update.commentContent || '';
    //             taskInteractions[update.taskId].attachments = Array.isArray(update.attachments) ? [...update.attachments] : [];
    //         }
    //     });
    // }


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
         prefillForm(null); // Explicitly prefill with defaults if no initial data
     }
}, { immediate: true });


watch(selectedTaskIds, (newIds, oldIds) => {
    // Prevent auto-checking/unchecking 'completed' during initial load/prefill
    const initialLoadOrPrefill = oldIds === undefined || (props.initialData && form.date === props.initialData.date);

    if (!initialLoadOrPrefill && tasks.value.length > 0) {
        const expectedCompleted = newIds.length === tasks.value.length;
        if (form.completed !== expectedCompleted) {
             form.completed = expectedCompleted;
        }
    }
}, { deep: true });

watch(() => form.completed, (isCompleted, wasCompleted) => {
     // Check if the change wasn't triggered by selectedTaskIds watcher
     if (isCompleted !== wasCompleted && tasks.value.length > 0) {
        const allTasksSelected = selectedTaskIds.value.length === tasks.value.length;
        if (isCompleted && !allTasksSelected) {
            selectedTaskIds.value = tasks.value.map(task => task.id);
        } else if (!isCompleted && allTasksSelected) {
             // If unchecking 'completed' while all tasks were selected, unselect all tasks.
             // If you want different behavior (e.g., keep tasks selected), adjust this logic.
             selectedTaskIds.value = [];
        }
    }
});


const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minValue: (min) => value => (value >= min) || `Giá trị phải lớn hơn hoặc bằng ${min}.`,
  dateNotInFuture: value => {
      if (!value) return true;
      const selectedDate = new Date(value); selectedDate.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return selectedDate <= today || 'Không thể check-in cho ngày tương lai.';
  },
   dateWithinPlan: value => {
       if (!value || !planStartDate.value || !planEndDate.value) return true;
       const selectedDate = new Date(value); selectedDate.setHours(0,0,0,0);
       const startDate = new Date(planStartDate.value); startDate.setHours(0,0,0,0);
       const endDate = new Date(planEndDate.value); endDate.setHours(0,0,0,0);
       return (selectedDate >= startDate && selectedDate <= endDate) || 'Ngày check-in phải nằm trong thời gian kế hoạch.';
   },
  // Task description rule not needed here as it's optional during check-in
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

onMounted(() => {
  // prefillForm is now called by the 'tasks' watcher initially
});

// Watch initialData prop changes after mount
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
    // Add more types if needed
    return 'mdi-file-document-outline';
};
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const isTaskSelected = (taskId) => selectedTaskIds.value.includes(taskId);
const getTaskFilesToUpload = (taskId) => filesToUploadPerTask[taskId] || [];
const clearUploadError = () => { uploadError.value = ''; uploadingTaskId.value = null; };

const handleTaskFilesSelected = async (taskId, newFiles) => {
     filesToUploadPerTask[taskId] = newFiles || []; // Update the display model
     if (!newFiles || newFiles.length === 0) return; // No files selected/cleared

     isUploading.value = true;
     uploadingTaskId.value = taskId;
     uploadError.value = '';

     const uploadPromises = newFiles.map(file =>
        progressService.uploadEvidenceFile(file)
            .then(response => ({...response.data, taskId: taskId})) // Pass taskId along
            .catch(error => ({ error: true, fileName: file.name, message: error.response?.data?.message || 'Upload thất bại', taskId: taskId }))
    );

    try {
        const results = await Promise.all(uploadPromises);

        // Filter results specific to the current task ID being uploaded
        const successfulUploads = results.filter(result => !result.error && result.taskId === taskId);
        const failedUploads = results.filter(result => result.error && result.taskId === taskId);

        if (taskInteractions[taskId]) {
             // Add successfully uploaded files to the interaction state for this task
             successfulUploads.forEach(uploadInfo => {
                 // Check for duplicates before adding
                 if (!taskInteractions[taskId].attachments.some(att => att.storedFilename === uploadInfo.storedFilename)) {
                     taskInteractions[taskId].attachments.push({
                         storedFilename: uploadInfo.storedFilename,
                         fileUrl: uploadInfo.fileUrl,
                         originalFilename: uploadInfo.originalFilename,
                         contentType: uploadInfo.contentType,
                         size: uploadInfo.size // Make sure the field name matches (size vs fileSize)
                     });
                 }
             });
        } else {
             console.warn(`taskInteractions for task ${taskId} not found after upload.`);
        }

        if (failedUploads.length > 0) {
            uploadError.value = `Lỗi tải lên ${failedUploads[0].fileName}: ${failedUploads[0].message}`;
        }

        // Clear the file input only for the specific task *after* processing results
        filesToUploadPerTask[taskId] = [];

    } catch (error) {
        console.error(`Lỗi xử lý upload files cho task ${taskId}:`, error);
        uploadError.value = "Đã có lỗi xảy ra trong quá trình upload.";
    } finally {
        // Reset loading state only if this was the task being uploaded
        if (uploadingTaskId.value === taskId) {
            isUploading.value = false;
            uploadingTaskId.value = null;
        }
    }
};

const removeTaskUploadedFile = (taskId, fileIndex) => {
    if (taskInteractions[taskId]) {
        const removedFile = taskInteractions[taskId].attachments.splice(fileIndex, 1)[0];
        console.log("Removed attachment (from check-in state):", removedFile?.originalFilename);
        // NOTE: This only removes it from the *current check-in data*.
        // If the file was already saved in a previous check-in, it won't be deleted from the server here.
        // Deleting previously saved files should happen in the ProgressDetailModal.
    }
};

const handleSubmit = async () => {
  const { valid } = await checkInForm.value.validate();
  if (!valid || isUploading.value) { // Prevent submit while uploading
      if(!valid) console.error("Form validation failed");
      if(isUploading.value) errorMessage.value = "Vui lòng chờ upload file hoàn tất.";
      return;
  }

  isLoading.value = true;
  clearErrors();

  try {
     // Prepare taskUpdates payload ONLY for selected tasks that have interactions
     const taskUpdatesPayload = selectedTaskIds.value
        .map(taskId => {
            const interaction = taskInteractions[taskId];
            // Only include update if there's comment OR attachments
            if (interaction && ( (interaction.commentContent && interaction.commentContent.trim()) || (interaction.attachments && interaction.attachments.length > 0) )) {
                return {
                    taskId,
                    commentContent: interaction.commentContent?.trim() || null, // Send null if empty/whitespace
                    attachments: interaction.attachments?.map(f => ({
                        storedFilename: f.storedFilename,
                        fileUrl: f.fileUrl,
                        originalFilename: f.originalFilename,
                        contentType: f.contentType,
                        fileSize: f.size // Ensure field matches backend DTO
                    })) || [] // Send empty array if no attachments
                };
            }
            return null; // Exclude task if no comment or attachments added in this check-in
        })
        .filter(update => update !== null); // Remove null entries

     const payload = {
       date: form.date,
       completed: form.completed,
       notes: form.notes || null, // Send null if empty
       evidence: form.evidenceLinks?.filter(link => link && link.trim()) || [], // Filter empty links
       completedTaskIds: selectedTaskIds.value || [],
       taskUpdates: taskUpdatesPayload
     };

    console.log("Submit Payload:", JSON.stringify(payload, null, 2));

    await progressStore.logDailyProgress(props.shareableLink, payload);

    // No need to fetchPlan here, ProgressDashboard will update via store/websocket
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
.task-checkin-item :deep(.v-label) { opacity: 1 !important; } /* Make checkbox labels fully opaque */
/* Add styles for MentionTextarea if needed */
</style>