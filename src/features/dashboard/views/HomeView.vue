<template>
  <v-container fluid class="home-view-container pa-0">
    <v-row justify="center" class="ma-0">
      <v-col cols="12" md="8" lg="6" class="pa-0 feed-col">
        <v-sheet class="pa-4 d-flex justify-space-between align-center" border="b" style="position: sticky; top: 0; z-index: 100;">
           <h1 class="text-h5 font-weight-bold">Hoạt động (Bạn bè)</h1>
           <v-btn
             icon="mdi-refresh"
             variant="text"
             size="small"
             @click="refreshFeed"
             :loading="feedStore.isLoading && !feedStore.feedItems.length"
           ></v-btn>
        </v-sheet>
        
        <div class="pa-4" :style="{ borderBottom: '1px solid rgba(var(--v-border-color), 0.1)' }">
           <v-btn
             color="primary"
             to="/plans/create" rounded="lg"
             elevation="2"
             class="pa-5 text-h6 flex-grow-1"
             block
             prepend-icon="mdi-plus-circle-outline"
           >
             Tạo hành trình mới
           </v-btn>
        </div>
        
        <div v-if="feedStore.isLoading && !feedStore.feedItems.length" class="d-flex justify-center align-center pa-10">
          <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
          <span class="ml-3 text-body-1 text-medium-emphasis">Đang tải...</span>
        </div>
        <v-alert v-else-if="feedStore.error" type="warning" variant="tonal" class="ma-4" density="comfortable">
          Lỗi: {{ feedStore.error }}
        </v-alert>
        <div v-else-if="!feedStore.feedItems.length" class="d-flex flex-column justify-center align-center pa-10 text-medium-emphasis">
          <div class="text-center pa-10">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-post-outline</v-icon>
            <p>Chưa có hoạt động nào từ bạn bè.</p>
            <p class="text-caption">Hãy thử <router-link :to="{ name: 'friends' }">kết nối bạn bè</router-link> hoặc <router-link :to="{ name: 'create-plan' }">tạo hành trình</router-link> mới!</p>
          </div>
        </div>

        <div v-else class="social-feed-wrapper">
          <v-card
            v-for="log in feedStore.feedItems"
            :key="log.id"
            class="mb-0"
            variant="flat"
            rounded="0"
            :style="{ borderBottom: '1px solid rgba(var(--v-border-color), 0.1)' }"
          >
            <v-card-text>
              <CheckInDetailCard :check-in="log" />
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-2">
              <v-btn 
                variant="text" 
                :color="hasReacted(log) ? 'primary' : 'medium-emphasis'" 
                @click="handleToggleReaction(log.id, 'HEART')"
              >
                <v-icon start>{{ hasReacted(log) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                {{ getTotalReactions(log) }} Thích
              </v-btn>
              <v-btn 
                variant="text" 
                color="medium-emphasis" 
                @click="toggleCommentSection(log.id)"
              >
                <v-icon start>mdi-comment-outline</v-icon>
                {{ log.commentCount || 0 }} Bình luận
              </v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>

            <v-expand-transition>
              <div v-if="expandedLogId === log.id" class="px-4 pb-3">
                 <v-divider class="mb-3"></v-divider>
                 <CommentSection :comments="log.comments || []" :check-in-id="log.id" />
              </div>
            </v-expand-transition>
          </v-card>
          
          <div v-if="!feedStore.isLastPage && !feedStore.isLoading" class="text-center pa-4">
            <v-btn variant="outlined" @click="loadMore" :loading="feedStore.isLoading">
              Tải thêm
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

// [CẬP NHẬT] Stores
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useFeedStore } from '@/features/community/stores/feedStore';
import { useProgressStore } from '@/features/progress/stores/progressStore'; // Sửa đường dẫn

// [CẬP NHẬT] Components
import CheckInDetailCard from '@/features/progress/components/checkin/CheckInDetailCard.vue';
import CommentSection from '@/features/community/components/CommentSection.vue';

// Imports Vuetify components
import {
  VContainer, VRow, VCol, VSheet, VBtn, VIcon, VProgressCircular, VAlert,
  VCard, VCardText, VDivider, VCardActions, VSpacer, VExpandTransition
} from 'vuetify/components';

const router = useRouter();
const authStore = useAuthStore();
const feedStore = useFeedStore();
const progressStore = useProgressStore(); // Để gọi action reaction

const expandedLogId = ref(null);

// --- Lifecycle Hook ---
onMounted(() => {
  feedStore.fetchFeed(false); // Tải feed mới (Feed Tri Kỷ)
});

// Dọn dẹp store khi rời khỏi
onUnmounted(() => {
  feedStore.clearFeed();
});

// --- Methods ---
const refreshFeed = () => {
  feedStore.fetchFeed(false);
};

const loadMore = () => {
  feedStore.fetchFeed(true);
};

// --- LOGIC TƯƠNG TÁC (Copy từ P3.3) ---
const toggleCommentSection = (logId) => {
    expandedLogId.value = expandedLogId.value === logId ? null : logId;
};

const handleToggleReaction = (logId, reactionType) => {
    progressStore.toggleReactionOnCheckIn(logId, reactionType);
    
    const logItem = feedStore.feedItems.find(item => item.id === logId);
    if (logItem) {
        if (!logItem.reactions) {
            logItem.reactions = [];
        }
        const reaction = logItem.reactions.find(r => r.type === reactionType);
        if (reaction) {
            reaction.reactedByCurrentUser = !reaction.reactedByCurrentUser;
            reaction.count += reaction.reactedByCurrentUser ? 1 : -1;
        } else {
             logItem.reactions.push({ type: reactionType, count: 1, reactedByCurrentUser: true });
        }
    }
};

const getTotalReactions = (log) => {
    if (!log.reactions) return 0;
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.count : 0;
};

const hasReacted = (log) => {
    if (!log.reactions || !authStore.currentUser) return false;
    const heartReaction = log.reactions.find(r => r.type === 'HEART');
    return heartReaction ? heartReaction.reactedByCurrentUser : false;
};

</script>

<style scoped>
.home-view-container {
  max-width: 100%;
  margin: 0 auto;
  background-color: rgb(var(--v-theme-background));
}
.feed-col {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-surface));
  max-width: 700px; /* Giới hạn chiều rộng feed */
  border-left: 1px solid rgba(var(--v-border-color), 0.1);
  border-right: 1px solid rgba(var(--v-border-color), 0.1);
}
</style>