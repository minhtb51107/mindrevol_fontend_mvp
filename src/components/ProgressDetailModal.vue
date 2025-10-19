<template>
  <v-dialog v-model="dialogVisible" persistent max-width="800px" scrollable @click:outside="close">
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
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
        >
          Người dùng này chưa ghi nhận tiến độ cho ngày này. Không thể tương tác.
        </v-alert>

        <div class="mb-4">
          <p class="text-subtitle-1 font-weight-medium mb-1">
            <v-icon start icon="mdi-note-text-outline"></v-icon> Ghi chú:
          </p>
          <v-sheet border rounded class="pa-3 text-body-2 bg-grey-lighten-4">
            {{ progress.notes || 'Không có ghi chú.' }}
          </v-sheet>
        </div>

        <div v-if="tasks.length > 0" class="mb-4">
             <p class="text-subtitle-1 font-weight-medium mb-1">
                 <v-icon start icon="mdi-format-list-checks"></v-icon>
                 Công việc trong ngày ({{ getCompletedTasksCount(progress) }}/{{ tasks.length }}):
             </p>
             <v-list density="compact" lines="one" class="py-0">
                <v-list-item v-for="(task, index) in tasks" :key="index" class="px-1">
                   <template v-slot:prepend>
                      <v-icon :color="isTaskCompleted(index) ? 'success' : 'grey-lighten-1'">
                          {{ isTaskCompleted(index) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                   </template>
                   <v-list-item-title
                      :class="{
                        'text-decoration-line-through text-medium-emphasis': isTaskCompleted(index),
                        'font-weight-regular': !isTaskCompleted(index)
                      }"
                    >
                       {{ task }}
                   </v-list-item-title>
                </v-list-item>
             </v-list>
         </div>


        <div v-if="progress.evidence" class="mb-4">
          <p class="text-subtitle-1 font-weight-medium mb-1">
            <v-icon start icon="mdi-link-variant"></v-icon> Bằng chứng:
          </p>
          <a :href="progress.evidence" target="_blank" rel="noopener noreferrer" class="text-body-2 text-primary text-decoration-none word-break">
            {{ progress.evidence }}
          </a>
        </div>

        <v-divider class="my-5"></v-divider>

        <div v-if="canInteract">
          <div class="mb-4">
             <p class="text-subtitle-1 font-weight-medium mb-2">Bày tỏ cảm xúc:</p>
            <v-chip-group mandatory selected-class="text-primary">
              <v-chip
                v-for="reaction in reactionTypes"
                :key="reaction.type"
                @click="handleToggleReaction(reaction.type)"
                :variant="isReacted(reaction.type) ? 'tonal' : 'outlined'"
                :color="isReacted(reaction.type) ? 'primary' : 'grey-darken-1'"
                size="small"
                class="me-2 px-3"
              >
                {{ reaction.emoji }} {{ getReactionCount(reaction.type) }}
              </v-chip>
            </v-chip-group>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div>
            <h6 class="text-subtitle-1 font-weight-medium mb-3">Thảo luận ({{ progress.comments?.length || 0 }})</h6>
             <v-list lines="two" density="compact" class="comments-list mb-4 px-1 py-0">
                <div v-if="!progress.comments || !progress.comments.length" class="text-center text-medium-emphasis text-caption py-3">
                  Chưa có bình luận nào.
                </div>
                 <v-list-item
                   v-for="comment in progress.comments"
                   :key="comment.id"
                   class="px-0 mb-1"
                 >
                   <template v-slot:prepend>
                      <v-avatar size="32" color="grey-lighten-2" class="me-3">
                         <v-icon icon="mdi-account" color="grey-darken-1"></v-icon>
                      </v-avatar>
                   </template>
                   <v-list-item-title class="text-body-2 font-weight-medium">{{ comment.authorFullName }}</v-list-item-title>
                   <v-list-item-subtitle class="text-body-2 text-wrap">{{ comment.content }}</v-list-item-subtitle>
                 </v-list-item>
             </v-list>

            <v-form @submit.prevent="submitComment">
              <v-textarea
                v-model="newComment"
                placeholder="Viết bình luận..."
                rows="2"
                variant="outlined"
                density="compact"
                hide-details
                auto-grow
                append-inner-icon="mdi-send"
                @click:append-inner="submitComment"
                :disabled="!canInteract || communityStore.isLoading"
                :loading="communityStore.isLoading"
                class="comment-input"
              ></v-textarea>
            </v-form>
          </div>
        </div>

      </v-card-text>

      <v-card-text v-else class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-3 text-medium-emphasis">Đang tải chi tiết...</p>
      </v-card-text>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useCommunityStore } from '@/stores/community';
import { usePlanStore } from '@/stores/plan';
import { VDialog, VCard, VCardTitle, VCardText, VBtn, VIcon, VSheet, VDivider, VChipGroup, VChip, VForm, VTextarea, VProgressCircular, VAlert, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar } from 'vuetify/components';

const communityStore = useCommunityStore();
const planStore = usePlanStore();
const dialogVisible = ref(true);
const newComment = ref('');

const progress = computed(() => communityStore.selectedProgress);
const tasks = computed(() => planStore.currentPlan?.dailyTasks || []);

const canInteract = computed(() => {
  return progress.value && progress.value.id;
});

const reactionTypes = [
  { type: 'THUMBS_UP', emoji: '👍' },
  { type: 'HEART', emoji: '❤️' },
  { type: 'CELEBRATE', emoji: '🎉' },
  { type: 'ROCKET', emoji: '🚀' },
];

const emit = defineEmits(['close']);

const close = () => {
  dialogVisible.value = false;
};

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

const isTaskCompleted = (index) => {
    const completedIndices = progress.value?.completedTaskIndices;
    if (completedIndices instanceof Set) {
        return completedIndices.has(index);
    } else if (Array.isArray(completedIndices)) {
         return completedIndices.includes(index);
    }
    return false;
};

const getCompletedTasksCount = (progressData) => {
    const completedIndices = progressData?.completedTaskIndices;
    if (completedIndices instanceof Set) {
        return completedIndices.size;
    } else if (Array.isArray(completedIndices)) {
        return completedIndices.length;
    }
    return 0;
};


const handleToggleReaction = async (reactionType) => {
  if (!canInteract.value) {
    console.error("Không thể reaction: progressId là null.");
    alert("Bạn không thể tương tác với một ngày chưa có dữ liệu.");
    return;
  }
  try {
    await communityStore.toggleReaction(reactionType);
  } catch (error) {
    alert('Không thể thả reaction, vui lòng thử lại.');
  }
};

const submitComment = async () => {
  if (!newComment.value.trim() || communityStore.isLoading) return;
  if (!canInteract.value) {
    console.error("Không thể bình luận: progressId là null.");
    alert("Bạn không thể bình luận vào một ngày chưa có dữ liệu.");
    return;
  }

  try {
    await communityStore.addComment(newComment.value);
    newComment.value = '';
  } catch (error) {
    alert('Không thể gửi bình luận, vui lòng thử lại.');
  }
};

watch(dialogVisible, (newValue) => {
  if (!newValue) {
     setTimeout(() => {
        communityStore.clearSelectedProgress();
        emit('close');
     }, 300);
  }
});

watch(() => communityStore.selectedProgress, (newVal) => {
  dialogVisible.value = !!newVal;
  if (!newVal && dialogVisible.value) {
     close();
  }
});

</script>

<style scoped>
.comments-list {
  max-height: 250px;
  overflow-y: auto;
}
.text-decoration-none {
  text-decoration: none;
}
.word-break {
   word-break: break-all;
}
.comment-input :deep(.v-field__append-inner) {
  cursor: pointer;
  padding-top: 10px; /* Adjust icon position */
}
.text-wrap {
    white-space: normal; /* Allow text wrapping */
}

</style>