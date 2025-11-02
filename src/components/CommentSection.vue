<template>
  <div class="comment-section mt-4">
    <v-form @submit.prevent="handlePostComment" class="mb-4">
      <div class="d-flex align-start">
        <v-avatar size="36" class="mr-3 mt-1">
          <v-img :src="authStore.user?.avatar || defaultAvatar" :alt="authStore.user?.fullName"></v-img>
        </v-avatar>
        <v-textarea
          v-model="newCommentContent"
          label="Viết bình luận..."
          rows="2"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="communityStore.isLoading"
        ></v-textarea>
      </div>
      <div class="d-flex justify-end mt-2" v-if="newCommentContent">
        <v-btn
          type="submit"
          color="primary"
          :loading="communityStore.isLoading"
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
              <v-img :src="comment.authorAvatar || defaultAvatar" :alt="comment.authorName"></v-img>
            </v-avatar>

            <div class="flex-grow-1">
              <div v-if="communityStore.editingCommentId === comment.id">
                <v-textarea
                  v-model="communityStore.editingCommentContent"
                  rows="2"
                  density="compact"
                  variant="outlined"
                  autofocus
                  hide-details
                  class="mb-2"
                ></v-textarea>
                <div class="d-flex justify-end">
                  <v-btn
                    size="small"
                    variant="text"
                    @click="communityStore.cancelEditingComment()"
                    class="mr-2"
                  >
                    Hủy
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="primary" 
                    @click="handleSaveEdit"
                    :loading="communityStore.isLoading"
                  >
                    Lưu
                  </v-btn>
                </div>
              </div>

              <v-card variant="tonal" v-else>
                <v-card-title class="d-flex justify-space-between align-center text-body-2 pa-2">
                  <div class="d-flex align-center">
                    <span class="font-weight-medium">{{ comment.authorName }}</span>
                    <span class="text-caption text-medium-emphasis ml-2">
                      · {{ formatTimeAgo(comment.createdAt) }}
                    </span>
                  </div>
                  
                  <div v-if="authStore.user && authStore.user.id === comment.authorId">
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
                        <v-list-item @click="communityStore.startEditingComment(comment)">
                          <template v-slot:prepend>
                            <v-icon>mdi-pencil</v-icon>
                          </template>
                          <v-list-item-title>Sửa bình luận</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="handleDeleteComment(comment.id)" class="text-error">
                          <template v-slot:prepend>
                            <v-icon>mdi-delete</v-icon>
                          </template>
                          <v-list-item-title>Xóa bình luận</v-list-item-title>
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
      Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
    </div>
    
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="communityStore.isLoading">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCommunityStore } from '@/stores/community';
import { useAuthStore } from '@/stores/auth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import defaultAvatar from '@/assets/default-avatar.png'; // (Đảm bảo bạn có file này trong src/assets)

// Import các component Vuetify
import {
  VForm, VTextarea, VBtn, VDivider, VList, VListItem, VAvatar, VImg, VCard,
  VCardTitle, VCardText, VMenu, VIcon, VListItemTitle, VSpacer, VDialog, VCardActions
} from 'vuetify/components';

const communityStore = useCommunityStore();
const authStore = useAuthStore();

const newCommentContent = ref('');
const deleteDialog = ref(false);
const commentToDeleteId = ref(null);

// Lấy danh sách bình luận từ store
const comments = computed(() => communityStore.selectedProgress?.comments);

// Định dạng thời gian (ví dụ: "5 phút trước")
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: vi });
};

// Xử lý đăng bình luận mới
const handlePostComment = async () => {
  if (!newCommentContent.value.trim()) return;
  try {
    await communityStore.addComment(newCommentContent.value);
    newCommentContent.value = ''; // Xóa nội dung sau khi gửi
  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    // (Bạn có thể thêm snackbar thông báo lỗi ở đây)
  }
};

// Xử lý lưu bình luận đã sửa
const handleSaveEdit = async () => {
  try {
    await communityStore.saveEditedComment();
  } catch (error) {
    console.error("Lỗi khi lưu bình luận:", error);
    // (Bạn có thể thêm snackbar thông báo lỗi ở đây)
  }
};

// Mở dialog xác nhận xóa
const handleDeleteComment = (commentId) => {
  commentToDeleteId.value = commentId;
  deleteDialog.value = true;
};

// Xác nhận xóa
const confirmDelete = async () => {
  if (commentToDeleteId.value) {
    try {
      await communityStore.deleteComment(commentToDeleteId.value);
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      // (Bạn có thể thêm snackbar thông báo lỗi ở đây)
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
  overflow-x: hidden; /* Tránh lỗi thanh cuộn ngang do menu */
}
</style>