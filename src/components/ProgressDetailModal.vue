<template>
  <v-dialog v-model="dialogVisible" persistent max-width="850px" scrollable @click:outside="close">
    <v-card>
      <v-card-title class="pa-4 bg-grey-lighten-3">
        <div class="d-flex justify-space-between align-center">
          <div>
            <span class="text-h6">Chi tiết ngày {{ progress?.date }}</span>
            <div class="text-subtitle-2 text-medium-emphasis">của {{ progress?.memberFullName }}</div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
        </div>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text v-if="progress" class="pa-5">
        <v-alert
            v-if="!canInteract"
            type="info" variant="tonal" density="compact" class="mb-4">
          Người dùng này chưa ghi nhận tiến độ cho ngày này. Không thể tương tác.
        </v-alert>

        <div class="mb-4">
          <p class="text-subtitle-1 font-weight-medium mb-1"><v-icon start icon="mdi-note-text-outline"></v-icon> Ghi chú chung:</p>
          <v-sheet border rounded class="pa-3 text-body-2 bg-grey-lighten-4">{{ progress.notes || 'Không có ghi chú.' }}</v-sheet>
        </div>

        <div v-if="progress.evidenceLinks && progress.evidenceLinks.length > 0" class="mb-4">
           <p class="text-subtitle-1 font-weight-medium mb-1"><v-icon start icon="mdi-link-variant"></v-icon> Links chung:</p>
           <div class="d-flex flex-wrap ga-2">
               <v-chip v-for="(link, index) in progress.evidenceLinks" :key="'link-' + index" :href="link" target="_blank" rel="noopener noreferrer" color="primary" variant="outlined" size="small" label link class="word-break">
                   <v-icon start icon="mdi-link-variant"></v-icon> Link {{ index + 1 }}
               </v-chip>
           </div>
        </div>

        <v-divider class="my-5"></v-divider>

        <div v-if="tasks.length > 0" class="mb-4">
             <p class="text-h6 mb-3"> Công việc trong ngày ({{ getCompletedTasksCount(progress) }}/{{ tasks.length }}) </p>
             <v-expansion-panels v-model="expandedTaskPanel">
                <v-expansion-panel
                    v-for="task in tasks" :key="task.id" :value="task.id"
                    elevation="1" class="mb-2 task-panel" @group:selected="handlePanelToggle(task)"
                >
                    <v-expansion-panel-title>
                        <v-icon :color="isTaskCompleted(task.id) ? 'success' : 'grey-lighten-1'" class="me-3">{{ isTaskCompleted(task.id) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        <span :class="{'text-decoration-line-through text-medium-emphasis': isTaskCompleted(task.id)}">{{ task.description }}</span>
                        <span v-if="task.deadlineTime" class="text-caption text-medium-emphasis ms-2">(Deadline: {{ task.deadlineTime }})</span>
                        <v-spacer></v-spacer>
                        <v-chip size="x-small" label class="me-1" v-if="task.attachments?.length"><v-icon start size="small">mdi-paperclip</v-icon>{{ task.attachments.length }}</v-chip>
                         <v-chip size="x-small" label v-if="task.comments?.length"><v-icon start size="small">mdi-comment-outline</v-icon>{{ task.comments.length }}</v-chip>
                    </v-expansion-panel-title>

                    <v-expansion-panel-text>
                        <v-divider class="mb-3"></v-divider>
                        <div class="mb-4">
                            <p class="text-subtitle-2 font-weight-medium mb-2"><v-icon start size="small">mdi-paperclip</v-icon> File đính kèm:</p>
                            <div v-if="task.attachments && task.attachments.length > 0" class="d-flex flex-wrap ga-2 mb-2">
                                <v-chip v-for="(att, idx) in task.attachments" :key="att.id" :href="att.fileUrl" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label link closable @click:close="confirmDeleteTaskAttachment(att.id)" :disabled="!isPlanOwner">
                                    <v-icon start :icon="getFileIcon(att.contentType)"></v-icon>{{ att.originalFilename }}<span class="text-caption ms-1">({{ formatFileSize(att.fileSize) }})</span>
                                </v-chip>
                            </div>
                            <div v-else class="text-caption text-medium-emphasis mb-2">Chưa có file nào.</div>
                             <v-file-input v-model="taskFilesToUpload" label="Thêm file..." multiple chips clearable show-size counter variant="outlined" density="compact" prepend-icon="" prepend-inner-icon="mdi-plus-box-outline" hide-details="auto" :loading="taskStore.isUploadingAttachment && taskStore.selectedTask?.id === task.id" class="mt-2" @update:modelValue="handleTaskFilesSelected" accept="image/*,application/pdf"></v-file-input>
                              <v-alert v-if="taskStore.uploadAttachmentError && taskStore.selectedTask?.id === task.id" type="error" density="compact" class="mt-2" closable @click:close="taskStore.uploadAttachmentError = null">{{ taskStore.uploadAttachmentError }}</v-alert>
                        </div>

                        <v-divider class="my-4"></v-divider>

                        <div>
                           <p class="text-subtitle-2 font-weight-medium mb-2"><v-icon start size="small">mdi-comment-text-outline</v-icon> Bình luận:</p>
                            <v-list lines="two" density="compact" class="comments-list-task mb-3 pa-0">
                                <div v-if="!task.comments || !task.comments.length" class="text-center text-medium-emphasis text-caption py-2">Chưa có bình luận nào.</div>
                                <v-list-item v-for="comment in task.comments" :key="comment.id" class="px-0 py-1 comment-item">
                                    <template v-slot:prepend>
                                        <v-avatar size="30" color="grey-lighten-2" class="me-2 mt-1"><v-icon size="small" icon="mdi-account" color="grey-darken-1"></v-icon></v-avatar>
                                    </template>
                                     <div v-if="taskStore.editingTaskCommentId !== comment.id">
                                         <v-list-item-title class="text-caption font-weight-medium">{{ comment.authorFullName }} <span class="text-grey text-caption"> {{ formatTimeAgo(comment.createdAt) }} {{ comment.updatedAt ? '(đã sửa)' : '' }}</span></v-list-item-title>
                                         <v-list-item-subtitle class="text-body-2 text-wrap">{{ comment.content }}</v-list-item-subtitle>
                                     </div>
                                     <div v-else class="edit-comment-form">
                                        <v-textarea
                                            v-model="taskStore.editingTaskCommentContent"
                                            rows="2" variant="outlined" density="compact" hide-details="auto" auto-grow autofocus
                                            class="mb-2"
                                        ></v-textarea>
                                        <div class="d-flex justify-end">
                                            <v-btn size="small" variant="text" @click="taskStore.cancelEditingTaskComment()">Hủy</v-btn>
                                            <v-btn size="small" color="primary" variant="flat" @click="saveTaskCommentEdit" :loading="taskStore.isLoading">Lưu</v-btn>
                                        </div>
                                     </div>
                                     <template v-slot:append v-if="taskStore.editingTaskCommentId !== comment.id">
                                         <v-menu location="bottom end" v-if="canEditOrDeleteTaskComment(comment)">
                                             <template v-slot:activator="{ props }"><v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="props"></v-btn></template>
                                             <v-list density="compact">
                                                 <v-list-item @click="taskStore.startEditingTaskComment(comment)" v-if="isTaskCommentAuthor(comment)">
                                                     <template v-slot:prepend><v-icon icon="mdi-pencil-outline" size="small"></v-icon></template><v-list-item-title>Sửa</v-list-item-title>
                                                 </v-list-item>
                                                 <v-list-item @click="confirmDeleteTaskComment(comment.id)">
                                                     <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template><v-list-item-title>Xóa</v-list-item-title>
                                                 </v-list-item>
                                             </v-list>
                                         </v-menu>
                                     </template>
                                </v-list-item>
                            </v-list>
                            <v-form @submit.prevent="submitTaskComment">
                                <v-textarea v-model="newTaskComment" placeholder="Viết bình luận..." rows="1" variant="outlined" density="compact" hide-details auto-grow append-inner-icon="mdi-send" @click:append-inner="submitTaskComment" :disabled="taskStore.isLoading" :loading="taskStore.isLoading && !taskStore.editingTaskCommentId" class="comment-input"></v-textarea>
                            </v-form>
                             <v-alert v-if="taskStore.error && taskStore.selectedTask?.id === task.id" type="error" density="compact" class="mt-2" closable @click:close="taskStore.error = null">{{ taskStore.error }}</v-alert>
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
             </v-expansion-panels>
         </div>
        <div v-else class="mb-4 text-center text-medium-emphasis"> Kế hoạch này không có công việc cụ thể. </div>

        <v-divider class="my-5"></v-divider>
        <div v-if="canInteract" class="mb-4">
           <p class="text-subtitle-1 font-weight-medium mb-2">Bày tỏ cảm xúc (cho cả ngày):</p>
            <v-chip-group mandatory selected-class="text-primary">
              <v-chip v-for="reaction in reactionTypes" :key="reaction.type" @click="handleToggleReaction(reaction.type)" :variant="isReacted(reaction.type) ? 'tonal' : 'outlined'" :color="isReacted(reaction.type) ? 'primary' : 'grey-darken-1'" size="small" class="me-2 px-3">
                {{ reaction.emoji }} {{ getReactionCount(reaction.type) }}
              </v-chip>
            </v-chip-group>
        </div>
         <v-divider v-if="canInteract" class="mb-4"></v-divider>
         <div v-if="canInteract">
            <h6 class="text-subtitle-1 font-weight-medium mb-3">Thảo luận chung (cho cả ngày) ({{ progress.comments?.length || 0 }})</h6>
             <v-list lines="two" density="compact" class="comments-list mb-4 px-1 py-0">
                <div v-if="!progress.comments || !progress.comments.length" class="text-center text-medium-emphasis text-caption py-3">Chưa có bình luận nào.</div>
                 <v-list-item v-for="comment in progress.comments" :key="'daycomment-'+comment.id" class="px-0 mb-1 comment-item">
                    <template v-slot:prepend><v-avatar size="32" color="grey-lighten-2" class="me-3 mt-1"><v-icon icon="mdi-account" color="grey-darken-1"></v-icon></v-avatar></template>
                    <div v-if="communityStore.editingCommentId !== comment.id">
                        <v-list-item-title class="text-body-2 font-weight-medium">{{ comment.authorFullName }}</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-wrap">{{ comment.content }}</v-list-item-subtitle>
                    </div>
                    <div v-else class="edit-comment-form">
                        <v-textarea v-model="communityStore.editingCommentContent" rows="2" variant="outlined" density="compact" hide-details auto-grow autofocus class="mb-2"></v-textarea>
                        <div class="d-flex justify-end">
                            <v-btn size="small" variant="text" @click="communityStore.cancelEditingComment()">Hủy</v-btn>
                            <v-btn size="small" color="primary" variant="flat" @click="saveEdit" :loading="communityStore.isLoading">Lưu</v-btn>
                        </div>
                    </div>
                    <template v-slot:append v-if="communityStore.editingCommentId !== comment.id">
                        <v-menu location="bottom end" v-if="canEditOrDeleteComment(comment)">
                            <template v-slot:activator="{ props }"><v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn></template>
                            <v-list density="compact">
                                <v-list-item @click="communityStore.startEditingComment(comment)" v-if="isCommentAuthor(comment)">
                                    <template v-slot:prepend><v-icon icon="mdi-pencil-outline" size="small"></v-icon></template>
                                    <v-list-item-title>Sửa</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="confirmDeleteComment(comment.id)">
                                    <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template>
                                    <v-list-item-title>Xóa</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>
                 </v-list-item>
             </v-list>
            <v-alert v-if="communityStore.error" type="error" density="compact" class="mb-2" closable @click:close="communityStore.error = null">{{ communityStore.error }}</v-alert>
            <v-form @submit.prevent="submitComment">
              <v-textarea v-model="newComment" placeholder="Viết bình luận chung..." rows="2" variant="outlined" density="compact" hide-details auto-grow append-inner-icon="mdi-send" @click:append-inner="submitComment" :disabled="!canInteract || communityStore.isLoading" :loading="communityStore.isLoading && !communityStore.editingCommentId" class="comment-input"></v-textarea>
            </v-form>
          </div>
      </v-card-text>

      <v-card-text v-else class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-3 text-medium-emphasis">Đang tải chi tiết...</p>
      </v-card-text>

      <v-dialog v-model="deleteConfirmDialog" persistent max-width="400">
         <v-card>
            <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
            <v-card-text>Bạn có chắc chắn muốn xóa bình luận này không?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" text @click="deleteConfirmDialog = false">Hủy</v-btn>
                <v-btn color="error" text @click="executeDeleteComment" :loading="communityStore.isLoading">Xóa</v-btn>
            </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="deleteTaskCommentConfirmDialog" persistent max-width="400">
        <v-card>
            <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
            <v-card-text>Bạn có chắc chắn muốn xóa bình luận công việc này không?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" text @click="deleteTaskCommentConfirmDialog = false">Hủy</v-btn>
                <v-btn color="error" text @click="executeDeleteTaskComment" :loading="taskStore.isLoading">Xóa</v-btn>
            </v-card-actions>
        </v-card>
      </v-dialog>
       <v-dialog v-model="deleteTaskAttachmentConfirmDialog" persistent max-width="400">
        <v-card>
            <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
            <v-card-text>Bạn có chắc chắn muốn xóa file đính kèm này không? Hành động này không thể hoàn tác.</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" text @click="deleteTaskAttachmentConfirmDialog = false">Hủy</v-btn>
                <v-btn color="error" text @click="executeDeleteTaskAttachment" :loading="taskStore.isLoading">Xóa</v-btn>
            </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useCommunityStore } from '@/stores/community';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/taskStore';
import progressService from '@/api/progressService';
import { VDialog, VCard, VCardTitle, VCardText, VCardActions, VBtn, VIcon, VSheet, VDivider, VChipGroup, VChip, VForm, VTextarea, VProgressCircular, VAlert, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar, VMenu, VSpacer, VExpansionPanels, VExpansionPanel, VExpansionPanelTitle, VExpansionPanelText, VFileInput } from 'vuetify/components';

const props = defineProps({
  shareableLink: {
    type: String,
    required: true,
  },
});

const communityStore = useCommunityStore();
const planStore = usePlanStore();
const authStore = useAuthStore();
const taskStore = useTaskStore();

const dialogVisible = ref(true);
const newComment = ref('');
const newTaskComment = ref('');
const taskFilesToUpload = ref([]);
const deleteConfirmDialog = ref(false);
const commentToDeleteId = ref(null);
const deleteTaskCommentConfirmDialog = ref(false);
const taskCommentToDeleteId = ref(null);
const deleteTaskAttachmentConfirmDialog = ref(false);
const taskAttachmentToDeleteId = ref(null);
const expandedTaskPanel = ref(null);

const progress = computed(() => communityStore.selectedProgress);
const tasks = computed(() => {
    const planTasks = planStore.currentPlanTasks || [];
    return planTasks.map(planTask => {
        const comments = Array.isArray(planTask.comments) ? planTask.comments : [];
        const attachments = Array.isArray(planTask.attachments) ? planTask.attachments : [];
        // Ensure task data from planStore has comments/attachments arrays initialized
        const taskWithInitializedArrays = { ...planTask, comments, attachments };
        if (taskStore.selectedTask && taskStore.selectedTask.id === planTask.id) {
             // Merge data, ensuring arrays exist in selectedTask as well
             return {
                ...taskWithInitializedArrays, // Start with initialized task from planStore
                ...taskStore.selectedTask, // Override with selectedTask data
                comments: Array.isArray(taskStore.selectedTask.comments) ? taskStore.selectedTask.comments : comments, // Prefer selectedTask comments
                attachments: Array.isArray(taskStore.selectedTask.attachments) ? taskStore.selectedTask.attachments : attachments // Prefer selectedTask attachments
             };
        }
        return taskWithInitializedArrays; // Return task from planStore with initialized arrays
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});
const currentUserEmail = computed(() => authStore.currentUser?.email);
const currentUserRoleInPlan = computed(() => {
    if (!planStore.currentPlan || !currentUserEmail.value) return null;
    const member = planStore.currentPlan.members?.find(m => m.userEmail === currentUserEmail.value);
    return member?.role;
});
const canInteract = computed(() => progress.value && progress.value.id);
const reactionTypes = [
  { type: 'THUMBS_UP', emoji: '👍' }, { type: 'HEART', emoji: '❤️' }, { type: 'CELEBRATE', emoji: '🎉' }, { type: 'ROCKET', emoji: '🚀' },
];
const emit = defineEmits(['close']);

const close = () => { dialogVisible.value = false; taskStore.clearSelectedTask(); };

const getReactionCount = (type) => {
  if (!progress.value || !progress.value.reactions) return 0;
  const reactionSummary = progress.value.reactions.find(r => r.type === type);
  return reactionSummary ? reactionSummary.count : 0;
};
const isReacted = (type) => {
  if (!progress.value || !progress.value.reactions) return false;
  const reactionSummary = progress.value.reactions.find(r => r.type === type);
  return reactionSummary ? reactionSummary.hasCurrentUserReacted : false;
};
const isTaskCompleted = (taskId) => {
    const completedIds = progress.value?.completedTaskIds;
    if (!completedIds) return false;
    // Handle both Set and Array from backend/store
    const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds);
    return completedSet.has(taskId);
};
const getCompletedTasksCount = (progressData) => {
    const completedIds = progressData?.completedTaskIds;
    if (completedIds instanceof Set) { return completedIds.size; }
    else if (Array.isArray(completedIds)) { return completedIds.length; }
    return 0;
};
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
     try { // Add try-catch for potential Math.log errors with invalid input
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i < 0 || i >= sizes.length) return bytes + ' Bytes';
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } catch (e) {
        return 'N/A'; // Return N/A or handle error appropriately
    }
};
const isCommentAuthor = (comment) => { return comment.authorEmail === currentUserEmail.value; };
const isPlanOwner = computed(() => { return currentUserRoleInPlan.value === 'OWNER'; });
const canEditOrDeleteComment = (comment) => { return isCommentAuthor(comment) || isPlanOwner.value; };
const isTaskCommentAuthor = (comment) => { return comment.authorEmail === currentUserEmail.value; };
const canEditOrDeleteTaskComment = (comment) => { return isTaskCommentAuthor(comment) || isPlanOwner.value; };

const handleToggleReaction = async (reactionType) => {
    if (!canInteract.value) return;
    try { await communityStore.toggleReaction(reactionType); }
    catch (error) { console.error("Reaction failed:", error); }
};
const submitComment = async () => {
    if (!newComment.value.trim() || communityStore.isLoading || !canInteract.value) return;
    try { await communityStore.addComment(newComment.value); newComment.value = ''; }
    catch (error) { console.error("Submit comment failed:", error); }
};
const saveEdit = async () => {
    try { await communityStore.saveEditedComment(); }
    catch(error) { console.error("Save edit failed:", error); }
};
const confirmDeleteComment = (commentId) => { commentToDeleteId.value = commentId; deleteConfirmDialog.value = true; };
const executeDeleteComment = async () => {
    if (commentToDeleteId.value) {
        try { await communityStore.deleteComment(commentToDeleteId.value); deleteConfirmDialog.value = false; commentToDeleteId.value = null; }
        catch (error) { console.error("Delete comment failed:", error); }
    }
};
const handlePanelToggle = (task) => {
    if (expandedTaskPanel.value === task.id) {
        // Ensure comments/attachments are arrays before selecting
        const taskData = {
            ...task,
            comments: Array.isArray(task.comments) ? task.comments : [],
            attachments: Array.isArray(task.attachments) ? task.attachments : []
        };
        taskStore.selectTask(taskData);
        newTaskComment.value = '';
        taskFilesToUpload.value = [];
    } else if (taskStore.selectedTask?.id === task.id) {
         taskStore.clearSelectedTask();
    }
};
const submitTaskComment = async () => {
    if (!newTaskComment.value.trim() || !taskStore.selectedTask) return;
    try { await taskStore.addTaskComment(newTaskComment.value); newTaskComment.value = ''; }
    catch (error) { console.error("Submit task comment failed:", error); }
};
const saveTaskCommentEdit = async () => {
    if (!taskStore.editingTaskCommentContent.trim()) { taskStore.error = "Nội dung không được trống."; return; }
    try { await taskStore.saveEditedTaskComment(); }
    catch (error) { console.error("Save task comment edit failed:", error); }
};
const confirmDeleteTaskComment = (commentId) => { taskCommentToDeleteId.value = commentId; deleteTaskCommentConfirmDialog.value = true; };
const executeDeleteTaskComment = async () => {
    if (taskCommentToDeleteId.value) {
        try { await taskStore.deleteTaskComment(taskCommentToDeleteId.value); deleteTaskCommentConfirmDialog.value = false; taskCommentToDeleteId.value = null; }
        catch (error) { console.error("Delete task comment failed:", error); }
    }
};
const handleTaskFilesSelected = async (newFiles) => {
     if (!newFiles || newFiles.length === 0 || !taskStore.selectedTask) return;
     const currentTaskId = taskStore.selectedTask.id;
     taskStore.isUploadingAttachment = true; taskStore.uploadAttachmentError = null;
     const uploadPromises = newFiles.map(file => progressService.uploadEvidenceFile(file).then(res => res.data).catch(err => ({ error: true, fileName: file.name, message: err.response?.data?.message || 'Upload thất bại' })));
     try {
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(result => !result.error);
        const failedUploads = results.filter(result => result.error);
        if (successfulUploads.length > 0 && taskStore.selectedTask?.id === currentTaskId) {
             for (const fileInfo of successfulUploads) {
                try { await taskStore.addTaskAttachment(fileInfo); }
                catch (attachError) { console.error(`Attach error ${fileInfo.originalFilename}:`, attachError); taskStore.uploadAttachmentError = `Không thể đính kèm ${fileInfo.originalFilename}.`; }
             }
        }
        if (failedUploads.length > 0 && taskStore.selectedTask?.id === currentTaskId) {
            taskStore.uploadAttachmentError = `Lỗi tải lên ${failedUploads.length} file (vd: ${failedUploads[0].fileName} - ${failedUploads[0].message}).`;
        }
        taskFilesToUpload.value = [];
    } catch (error) {
        console.error("Task file upload processing error:", error);
         if(taskStore.selectedTask?.id === currentTaskId) { taskStore.uploadAttachmentError = "Lỗi xử lý upload."; }
    } finally {
        if(taskStore.selectedTask?.id === currentTaskId) { taskStore.isUploadingAttachment = false; }
    }
};
const confirmDeleteTaskAttachment = (attachmentId) => { taskAttachmentToDeleteId.value = attachmentId; deleteTaskAttachmentConfirmDialog.value = true; };
const executeDeleteTaskAttachment = async () => {
    if (taskAttachmentToDeleteId.value) {
        try { await taskStore.deleteTaskAttachment(taskAttachmentToDeleteId.value); deleteTaskAttachmentConfirmDialog.value = false; taskAttachmentToDeleteId.value = null; }
        catch (error) { console.error("Delete task attachment failed:", error); }
    }
};
const formatTimeAgo = (isoDateTime) => {
    if (!isoDateTime) return '';
    try {
        const date = new Date(isoDateTime);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return Math.floor(seconds) < 10 ? "Vừa xong" : Math.floor(seconds) + " giây trước";
    } catch (e) { return ''; }
};

watch(dialogVisible, (newValue) => { if (!newValue) { setTimeout(() => { communityStore.clearSelectedProgress(); taskStore.clearSelectedTask(); emit('close'); }, 300); }});
watch(() => communityStore.selectedProgress, (newVal) => {
  dialogVisible.value = !!newVal;
  if (newVal) {
     expandedTaskPanel.value = null; taskStore.clearSelectedTask();
     if (Array.isArray(newVal.completedTaskIds)) { communityStore.selectedProgress.completedTaskIds = new Set(newVal.completedTaskIds); }
     // Ensure main attachments and evidenceLinks are arrays
     if (newVal && !Array.isArray(newVal.attachments)) { communityStore.selectedProgress.attachments = []; }
      if (newVal && !Array.isArray(newVal.evidenceLinks)) { communityStore.selectedProgress.evidenceLinks = []; }
     // Ensure comments on the main progress are an array
      if (newVal && !Array.isArray(newVal.comments)) { communityStore.selectedProgress.comments = []; }
  }
  if (!newVal && dialogVisible.value) { close(); }
}, { deep: true });

</script>

<style scoped>
.comments-list { max-height: 200px; overflow-y: auto; }
.comments-list-task { max-height: 150px; overflow-y: auto; }
.text-decoration-none { text-decoration: none; }
.word-break { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comment-input :deep(.v-field__append-inner) { cursor: pointer; padding-top: 8px; }
.text-wrap { white-space: normal; }
.ga-2 { gap: 8px; }
.edit-comment-form { width: 100%; }
.comment-item :deep(.v-list-item__append) { align-self: start; margin-top: 4px; }
.task-panel :deep(.v-expansion-panel-text__wrapper) { padding: 8px 16px 16px; }
</style>