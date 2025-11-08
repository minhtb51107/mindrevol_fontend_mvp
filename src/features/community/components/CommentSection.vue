<template>
  <div class="comment-section">
    <h6 class="text-subtitle-1 font-weight-medium mb-3">
      Thảo luận ({{ comments.length || 0 }})
    </h6>

    <v-form @submit.prevent="handlePostComment" class="mb-4">
      <div class="d-flex align-start">
        <v-avatar size="36" class="mr-3 mt-1">
          <v-img :src="authStore.currentUser?.avatar || defaultAvatar" :alt="authStore.currentUser?.fullName"></v-img>
        </v-avatar>
        
        <MentionTextarea
          v-model="newCommentContent"
          label="Viết bình luận (@mention)..."
          :items="mentionableMembers"
          rows="2"
          density="compact"
          variant="outlined"
          hide-details
          :loading="progressStore.isLoading"
          :disabled="progressStore.isLoading"
          class="flex-grow-1"
        />
      </div>
      <div class="d-flex justify-end mt-2" v-if="newCommentContent">
        <v-btn
          type="submit"
          color="primary"
          :loading="progressStore.isLoading"
          :disabled="!newCommentContent.trim()"
          size="small"
        >
          Gửi
        </v-btn>
      </div>
    </v-form>

    <v-divider class="mb-4"></v-divider>

    <div v-if="comments && comments.length > 0">
      <v-list lines="three" class="bg-transparent pa-0">
        <v-list-item 
          v-for="comment in comments" 
          :key="comment.id" 
          class="mb-2 pa-0"
        >
          <div class="d-flex align-start">
            <v-avatar size="36" class="mr-3 mt-1">
              <v-img :src="comment.authorAvatar || defaultAvatar" :alt="comment.authorFullName"></v-img>
            </v-avatar>

            <div class="flex-grow-1">
              <div v-if="progressStore.editingCheckInCommentId === comment.id">
                <MentionTextarea
                  v-model="progressStore.editingCheckInCommentContent"
                  :items="mentionableMembers"
                  rows="2"
                  density="compact"
                  variant="outlined"
                  autofocus
                  hide-details
                  class="mb-2"
                />
                <div class="d-flex justify-end">
                  <v-btn
                    size="small"
                    variant="text"
                    @click="progressStore.cancelEditingCheckInComment()"
                    class="mr-2"
                  >
                    Hủy
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="primary" 
                    @click="handleSaveEdit"
                    :loading="progressStore.isLoading"
                  >
                    Lưu
                  </v-btn>
                </div>
              </div>

              <v-card variant="tonal" v-else>
                <v-card-title class="d-flex justify-space-between align-center text-body-2 pa-2">
                  <div class="d-flex align-center">
                    <span class="font-weight-medium">{{ comment.authorFullName }}</span>
                    <span class="text-caption text-medium-emphasis ml-2">
                      · {{ formatTimeAgo(comment.createdAt) }}
                    </span>
                    <span v-if="comment.updatedAt !== comment.createdAt" class="text-caption text-medium-emphasis ml-1">
                      (đã sửa)
                    </span>
                  </div>
                  
                  <div v-if="canModifyComment(comment)">
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn 
                          v-bind="props"
                          icon="mdi-dots-horizontal" 
                          variant="text" 
                          size="small"
                        ></v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item 
                          v-if="authStore.currentUser?.id === comment.authorId"
                          @click="progressStore.startEditingCheckInComment(comment)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-pencil-outline</v-icon>
                          </template>
                          <v-list-item-title>Sửa</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="handleDeleteComment(comment.id)" base-color="error">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-delete-outline</v-icon>
                          </template>
                          <v-list-item-title>Xóa</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </v-card-title>
                
                <v-card-text class="pa-2 text-body-2">
                  <p style="white-space: pre-wrap;">{{ comment.content }}</p>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-list-item>
      </v-list>
    </div>
    
    <div v-else class="text-center text-medium-emphasis text-caption py-4">
      Chưa có bình luận nào. Hãy là người đầu tiên!
    </div>
    
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false" :disabled="progressStore.isLoading">Hủy</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="progressStore.isLoading">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import defaultAvatar from '@/assets/default-avatar.png';

// [CẬP NHẬT] Stores
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { useAuthStore } from '@/features/auth/stores/authStore';

// [CẬP NHẬT] Shared Components
import MentionTextarea from '@/components/common/MentionTextarea.vue';

// Import các component Vuetify
import {
  VForm, VBtn, VDivider, VList, VListItem, VAvatar, VImg, VCard,
  VCardTitle, VCardText, VMenu, VIcon, VListItemTitle, VSpacer, VDialog, VCardActions
} from 'vuetify/components';

// 1. Định nghĩa props
const props = defineProps({
  comments: {
    type: Array,
    default: () => []
  },
  checkInId: {
    type: [String, Number],
    required: true
  }
});

// 2. Khởi tạo stores
const progressStore = useProgressStore();
const planStore = usePlanStore();
const authStore = useAuthStore();

// 3. State cục bộ
const newCommentContent = ref('');
const deleteDialog = ref(false);
const commentToDeleteId = ref(null);

// 4. Lấy danh sách @mention (từ PlanStore, giống như logic cũ)
const mentionableMembers = computed(() => {
    if (!planStore.currentPlan?.members) return [];
    const currentUserId = authStore.currentUser?.id; 
    return planStore.currentPlan.members
        .filter(member => member.userId !== currentUserId) 
        .map(member => ({
            id: member.userId,
            label: member.userFullName,
            avatar: null,
            initial: member.userFullName ? member.userFullName.charAt(0).toUpperCase() : '?',
            email: member.userEmail,
        }));
});

// 5. Định dạng thời gian
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: vi });
};

// 6. Quyền Sửa/Xóa
const isPlanOwner = computed(() => planStore.isCurrentUserPlanOwner);
const canModifyComment = (comment) => {
  if (!authStore.currentUser) return false;
  const isAuthor = authStore.currentUser.id === comment.authorId;
  return isAuthor || isPlanOwner.value;
};

// 7. Handlers (gọi actions MỚI trong progressStore)
const handlePostComment = async () => {
  if (!newCommentContent.value.trim() || !props.checkInId) return;
  try {
    // Dùng action MỚI
    await progressStore.addCommentToCheckIn(props.checkInId, newCommentContent.value);
    newCommentContent.value = ''; 
  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    // (progressStore sẽ tự xử lý lỗi và hiển thị)
  }
};

const handleSaveEdit = async () => {
  try {
    // Dùng action MỚI
    await progressStore.saveEditingCheckInComment(props.checkInId);
  } catch (error) {
    console.error("Lỗi khi lưu bình luận:", error);
  }
};

const handleDeleteComment = (commentId) => {
  commentToDeleteId.value = commentId;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (commentToDeleteId.value && props.checkInId) {
    try {
      // Dùng action MỚI
      await progressStore.deleteCheckInComment(props.checkInId, commentToDeleteId.value);
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
    } finally {
      deleteDialog.value = false;
      commentToDeleteId.value = null;
    }
  }
};
</script>

<style scoped>
.bg-transparent {
  background-color: transparent !important;
}
.comment-section {
  max-width: 100%;
  overflow-x: hidden;
}
/* Style cho MentionTextarea dropdown nếu cần */
:deep(.mention-dropdown) {
    z-index: 2500; /* Đảm bảo cao hơn z-index của v-dialog (thường là 2400) */
}
</style>