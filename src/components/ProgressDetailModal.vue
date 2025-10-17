<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="close">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content" v-if="progress">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">Chi tiết ngày {{ progress.date }}</h5>
            <small class="text-muted">của {{ progress.memberFullName }}</small>
          </div>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <h6><i class="bi bi-journal-text me-2"></i>Ghi chú của thành viên:</h6>
            <p class="p-3 bg-light rounded">{{ progress.notes || 'Không có ghi chú.' }}</p>
            <div v-if="progress.evidence">
              <h6><i class="bi bi-link-45deg me-2"></i>Bằng chứng:</h6>
              <a :href="progress.evidence" target="_blank" rel="noopener noreferrer">{{ progress.evidence }}</a>
            </div>
          </div>
          <hr>

          <div class="d-flex align-items-center mb-3">
            <button v-for="reaction in reactionTypes" :key="reaction.type"
              @click="communityStore.toggleReaction(reaction.type)"
              class="btn btn-sm me-2 reaction-btn"
              :class="{ 'active': isReacted(reaction.type) }">
              {{ reaction.emoji }} {{ getReactionCount(reaction.type) }}
            </button>
          </div>
          <hr>

          <div>
            <h6 class="mb-3">Thảo luận ({{ progress.comments.length }})</h6>
            <div class="comments-list mb-3">
              <div v-if="!progress.comments.length" class="text-center text-muted">
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </div>
              <div v-for="comment in progress.comments" :key="comment.id" class="d-flex mb-3">
                <i class="bi bi-person-circle fs-4 me-2"></i>
                <div class="flex-grow-1">
                  <strong>{{ comment.authorFullName }}</strong>
                  <p class="mb-0">{{ comment.content }}</p>
                </div>
              </div>
            </div>
            <form @submit.prevent="submitComment">
              <div class="input-group">
                <input type="text" class="form-control" v-model="newComment" placeholder="Viết bình luận..." :disabled="communityStore.isLoading"/>
                <button class="btn btn-outline-primary" type="submit" :disabled="communityStore.isLoading">
                  <span v-if="communityStore.isLoading" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-send"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref } from 'vue';
import { useCommunityStore } from '@/stores/community';

const communityStore = useCommunityStore();
const progress = communityStore.selectedProgress;
const newComment = ref('');

const reactionTypes = [
  { type: 'THUMBS_UP', emoji: '👍' },
  { type: 'HEART', emoji: '❤️' },
  { type: 'CELEBRATE', emoji: '🎉' },
  { type: 'ROCKET', emoji: '🚀' },
];

const emit = defineEmits(['close']);
const close = () => {
  communityStore.clearSelectedProgress();
  emit('close');
};

const getReactionCount = (type) => {
  const reaction = progress.reactions.find(r => r.type === type);
  return reaction ? reaction.count : 0;
};

const isReacted = (type) => {
  const reaction = progress.reactions.find(r => r.type === type);
  return reaction ? reaction.hasCurrentUserReacted : false;
};

const submitComment = async () => {
  if (!newComment.value.trim()) return;
  try {
    await communityStore.addComment(newComment.value);
    newComment.value = ''; // Xóa input sau khi gửi thành công
  } catch (error) {
    // Có thể hiển thị lỗi cho người dùng ở đây
    alert('Không thể gửi bình luận, vui lòng thử lại.');
  }
};
</script>

<style scoped>
.d-block { display: block; }
.comments-list { max-height: 300px; overflow-y: auto; }
.reaction-btn { border-radius: 20px; }
.reaction-btn.active { background-color: #cfe2ff; border-color: #0d6efd; }
</style>