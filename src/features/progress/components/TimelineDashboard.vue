<template>
  <v-card
  variant="flat"
  color="transparent"
  rounded="0"
  elevation="0"
  class="timeline-dashboard"
>
    <v-card-item class="pb-0 pt-3 header-section flex-shrink-0">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap-reverse pa-0">
        <div class="d-flex align-center">
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            density="compact"
            variant="outlined"
            color="primary"
            class="mr-3 neo-toggle"
            rounded="lg"
          >
            <v-btn value="timeline" icon="mdi-chart-timeline" size="small" title="Xem Timeline"></v-btn>
            <v-btn value="feed" icon="mdi-newspaper-variant-outline" size="small" title="Xem News Feed"></v-btn>
          </v-btn-toggle>

          <span class="text-h6 font-weight-bold">
            {{ viewMode === 'timeline' ? 'Timeline' : 'Bảng tin' }}
          </span>
        </div>

        <div class="d-flex align-center py-1 controls-wrapper">
          <v-btn
            v-if="planStore.isCurrentUserMember"
            color="success"
            class="mr-3 neon-glow-green font-weight-bold"
            @click="$emit('open-check-in')"
            prepend-icon="mdi-check-circle-outline"
            variant="flat"
            size="small"
          >
            Check-in
          </v-btn>
          <DateSelector class="mr-2" />
          <v-btn
            v-if="viewMode === 'timeline'"
            @click="toggleGlobalImages"
            :icon="showImages ? 'mdi-image-outline' : 'mdi-image-off-outline'"
            :color="showImages ? 'primary' : 'default'"
            variant="tonal"
            size="small"
            class="image-toggle-btn"
          ></v-btn>
        </div>
      </v-card-title>
    </v-card-item>
    <v-divider class="mt-2 opacity-50 flex-shrink-0"></v-divider>

    <v-card-text class="pa-0 scrollable-content flex-grow-1">

      <div v-if="progressStore.isLoadingTimeline" class="d-flex justify-center align-center fill-height pa-5">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <span class="ml-3 text-body-1 text-medium-emphasis">Đang tải...</span>
      </div>
      <v-alert v-else-if="progressStore.timelineError" type="warning" variant="tonal" class="ma-4" density="comfortable">
        Lỗi: {{ progressStore.timelineError }}
      </v-alert>
      <div v-else-if="!timelineData || timelineData.length === 0" class="d-flex flex-column justify-center align-center fill-height pa-5 text-medium-emphasis">
        <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-post-outline</v-icon>
        <p>Chưa có hoạt động nào.</p>
      </div>

      <div v-else-if="viewMode === 'timeline'" class="swimlane-wrapper pa-3">
         <div v-for="memberTimeline in timelineData" :key="memberTimeline.member.userId" class="swimlane mb-4">
          <div class="member-header d-flex align-center px-3 py-2 mb-2">
            <v-avatar size="28" color="primary-darken-1" variant="tonal" class="mr-2">
              <span class="text-caption font-weight-bold">{{ getInitials(memberTimeline.member.userFullName) }}</span>
            </v-avatar>
            <span class="font-weight-bold text-body-2">{{ memberTimeline.member.userFullName }}</span>
          </div>
          <v-row dense class="time-groups mx-0">
            <v-col v-for="group in timeGroups" :key="group.name" cols="12" sm="6" md="3" class="px-1">
              <div class="time-group-column fill-height rounded-lg pa-2">
                <div class="time-group-header text-caption text-center font-weight-bold text-uppercase mb-2">
                  {{ group.name }} <span class="text-disabled">({{ group.startHour }}h - {{ group.endHour }}h)</span>
                </div>
                <div class="checkin-stack">
                  <template v-if="getCheckInsForGroup(memberTimeline.checkIns, group).length > 0">
                    <CheckInCard
                      v-for="checkIn in getCheckInsForGroup(memberTimeline.checkIns, group)"
                      :key="checkIn.id"
                      :check-in="checkIn"
                      :show-images-global="showImages"
                      class="mb-2"
                      @click="openCheckInDetail"
                      @edit="$emit('edit-check-in', $event)"
                      @delete="$emit('delete-check-in', $event)"
                      @toggle-reaction="handleToggleReaction"
                    />
                  </template>
                  <div v-else class="empty-slot text-caption text-center py-4 rounded border-dashed">--</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </div>

      <div v-else-if="viewMode === 'feed'" class="social-feed-wrapper mx-auto" style="max-width: 600px;">
        <template v-for="(post, index) in socialFeedData" :key="post.id">

          <v-card
            variant="flat"
            class="social-post-card rounded-0"
          >
            <div class="d-flex align-center px-4 pt-4 pb-2">
               <v-avatar color="grey-lighten-3" size="36" class="mr-3">
                 <v-img v-if="post.author.avatar" :src="post.author.avatar" alt="Avatar" cover></v-img>
                 <span v-else class="primary--text font-weight-bold">{{ getInitials(post.author.userFullName) }}</span>
               </v-avatar>
               <div>
                 <div class="text-subtitle-2 font-weight-bold lh-1">
                   {{ post.author.userFullName }}
                 </div>
                 <div class="text-caption text-medium-emphasis lh-1 mt-1">
                   {{ formatPostTime(post.checkInTimestamp) }} · <v-icon icon="mdi-earth" size="12"></v-icon>
                 </div>
               </div>
               <v-spacer></v-spacer>
               <v-menu v-if="canModifyPost(post)" location="bottom end">
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-horizontal" variant="text" density="comfortable" size="small" v-bind="props"></v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="$emit('edit-check-in', post)" title="Chỉnh sửa"></v-list-item>
                    <v-list-item @click="$emit('delete-check-in', post)" title="Xóa" class="text-error"></v-list-item>
                  </v-list>
                </v-menu>
            </div>

            <div class="px-4 py-2 text-body-1">
               <div v-if="post.notes" class="mb-2" style="white-space: pre-wrap; word-break: break-word;">
                 {{ post.notes }}
               </div>
               <div v-if="post.completedTasks && post.completedTasks.length > 0" class="mt-2">
                   <v-chip
                      v-for="(task, i) in post.completedTasks.slice(0, 5)"
                      :key="i"
                      size="small"
                      color="success"
                      variant="tonal"
                      class="mr-1 mb-1 font-weight-medium"
                   >
                     <v-icon start icon="mdi-check" size="x-small"></v-icon>
                     {{ truncateText(task.description, 30) }}
                   </v-chip>
                   <span v-if="post.completedTasks.length > 5" class="text-caption text-medium-emphasis">
                     +{{ post.completedTasks.length - 5 }} task khác
                   </span>
               </div>
            </div>

            <div v-if="post.attachments && post.attachments.length > 0" class="mt-2 cursor-pointer" @click="openCheckInDetail(post)">
               <v-img
                 :src="post.attachments[0].fileUrl"
                 cover
                 aspect-ratio="1.5"
                 class="bg-grey-lighten-4"
               >
                 <div v-if="post.attachments.length > 1" class="more-images-overlay text-h5 font-weight-bold">
                    +{{ post.attachments.length - 1 }}
                 </div>
               </v-img>
            </div>

            <div class="px-4 py-2 d-flex justify-space-between align-center text-caption text-medium-emphasis">
               <span>
                  <template v-if="getTotalReactions(post) > 0">
                     ❤️👍 {{ getTotalReactions(post) }}
                  </template>
               </span>
               <span>
                  <span v-if="post.commentCount > 0">{{ post.commentCount }} bình luận</span>
               </span>
            </div>
            <v-divider class="mx-4"></v-divider>
            <div class="d-flex px-2 py-1">
               <v-btn variant="text" color="medium-emphasis" prepend-icon="mdi-thumb-up-outline" class="flex-grow-1" @click="handleQuickLike(post)">Thích</v-btn>
               <v-btn variant="text" color="medium-emphasis" prepend-icon="mdi-comment-outline" class="flex-grow-1" @click="toggleCommentSection(post.id)">Bình luận</v-btn>
            </div>

            <v-expand-transition>
              <div v-if="expandedPostId === post.id" class="px-4 pb-3">
                 <v-divider class="mb-3"></v-divider>
                 <CommentSection :comments="post.comments || []" :check-in-id="post.id" />
              </div>
            </v-expand-transition>
          </v-card>

          <v-divider v-if="index < socialFeedData.length - 1" thickness="8" color="grey-lighten-4" class="my-0"></v-divider>

        </template>
        <div style="height: 60px;"></div>
      </div>

    </v-card-text>

    <v-dialog v-model="detailDialog" max-width="700px" scrollable>
      <v-card v-if="selectedCheckIn" class="glass-effect rounded-xl">
        <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-4">
          <span class="text-h6 font-weight-bold">Chi tiết</span>
          <v-btn icon="mdi-close" variant="text" color="medium-emphasis" @click="detailDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <div class="pa-4"><CheckInDetailCard :check-in="selectedCheckIn" /></div>
          <v-divider></v-divider>
          <CommentSection :comments="selectedCheckIn.comments || []" :check-in-id="selectedCheckIn.id" class="pa-4 bg-grey-lighten-5" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useTheme } from 'vuetify';

// [IMPORTS GIỮ NGUYÊN]
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import DateSelector from '@/components/common/DateSelector.vue';
import CheckInDetailCard from '@/features/progress/components/checkin/CheckInDetailCard.vue';
import CheckInCard from '@/features/progress/components/checkin/CheckInCard.vue';
import CommentSection from '@/features/community/components/CommentSection.vue';
import { VCard, VCardTitle, VCardText, VCardItem, VDivider, VProgressCircular, VAlert, VIcon, VRow, VCol, VBtn, VDialog, VAvatar, VBtnToggle, VMenu, VList, VListItem, VImg, VExpandTransition, VSpacer, VChip } from 'vuetify/components';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const emit = defineEmits(['open-check-in', 'edit-check-in', 'delete-check-in', 'comment-on-check-in']);
const theme = useTheme();
const progressStore = useProgressStore();
const planStore = usePlanStore();
const authStore = useAuthStore();

// --- State ---
const viewMode = ref('timeline');
const showImages = ref(true);
const detailDialog = ref(false);
const selectedCheckIn = ref(null);
const expandedPostId = ref(null);

// --- Computed ---
const timelineData = computed(() => progressStore.timelineSwimlanes);
const selectedDate = computed(() => progressStore.getSelectedDate);

// Dữ liệu Social Feed (Làm phẳng + Sắp xếp)
const socialFeedData = computed(() => {
    if (!timelineData.value) return [];
    let allPosts = [];
    timelineData.value.forEach(lane => {
        if (lane.checkIns && lane.checkIns.length > 0) {
             lane.checkIns.forEach(checkIn => {
                 allPosts.push({ ...checkIn, author: lane.member });
             });
        }
    });
    return allPosts.sort((a, b) => new Date(b.checkInTimestamp) - new Date(a.checkInTimestamp));
});

// --- Constants (Timeline) ---
const timeGroups = ref([
  { name: 'Sáng', startHour: 0, endHour: 11 }, { name: 'Trưa', startHour: 12, endHour: 13 },
  { name: 'Chiều', startHour: 14, endHour: 17 }, { name: 'Tối', startHour: 18, endHour: 23 },
]);

// --- Methods ---
const toggleGlobalImages = () => { showImages.value = !showImages.value; };
const openCheckInDetail = (checkIn) => { selectedCheckIn.value = checkIn; detailDialog.value = true; };
const handleToggleReaction = (checkInId, reactionType) => { progressStore.toggleReactionOnCheckIn(checkInId, reactionType); };

// --- Helpers Social Feed ---
const formatPostTime = (timestamp) => {
    if (!timestamp) return '';
    return dayjs(timestamp).diff(dayjs(), 'hour') > -24 ? dayjs(timestamp).fromNow() : dayjs(timestamp).format('DD/MM HH:mm');
};
const getTotalReactions = (post) => {
    return post.reactions ? post.reactions.reduce((sum, r) => sum + (r.count || 0), 0) : 0;
};
const toggleCommentSection = (postId) => {
    expandedPostId.value = expandedPostId.value === postId ? null : postId;
};
const handleQuickLike = (post) => { handleToggleReaction(post.id, 'HEART'); };
const canModifyPost = (post) => {
    return authStore.currentUser && (post.author?.userId === authStore.currentUser.id || planStore.isCurrentUserOwner);
};
const truncateText = (text, length) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

// --- Helpers Timeline ---
const getCheckInsForGroup = (checkIns, group) => {
  if (!checkIns) return [];
  const dateStr = selectedDate.value;
  const start = dayjs(`${dateStr} ${group.startHour}:00:00`);
  const end = dayjs(`${dateStr} ${group.endHour}:59:59`);
  return checkIns.filter((c) => {
      const time = dayjs(c.checkInTimestamp);
      return time.isAfter(start.subtract(1, 'second')) && time.isBefore(end);
  }).sort((a, b) => dayjs(a.checkInTimestamp).diff(dayjs(b.checkInTimestamp)));
};
const getInitials = (name) => { return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : '??'; };
</script>

<style scoped>
/* 1. Layout chính: "Thiết quân luật" để ép chiều cao */
.timeline-dashboard {
  /* Bắt buộc chiếm đúng 100% chiều cao cha nó, không hơn không kém */
  height: 100% !important;
  min-height: 0 !important; /* QUAN TRỌNG: Cho phép nó co lại nếu cần */
  max-height: 100% !important;
  
  /* Thiết lập flexbox thủ công để kiểm soát hoàn toàn */
  display: flex !important;
  flex-direction: column !important;
  
  /* Cắt bỏ mọi thứ tràn ra ngoài viền của nó */
  overflow: hidden !important;
  
  /* Đảm bảo không có viền/nền lạ */
  border: none !important;
  background: transparent !important;
}

/* 2. Phần Header: Cố định, không được co giãn */
.header-section {
  flex: 0 0 auto; /* Không co, không giãn, giữ nguyên kích thước nội dung */
  z-index: 2;
  background-color: rgba(var(--v-theme-surface), 0.95); /* Nền đặc hơn chút để che nội dung khi cuộn qua */
}

.controls-wrapper { gap: 8px; }

/* 3. Vùng chứa nội dung: Tự động giãn và TỰ CUỘN bên trong */
.scrollable-content {
  flex: 1 1 auto;            /* Chiếm hết không gian còn thừa */
  min-height: 0 !important;  /* QUAN TRỌNG NHẤT: Cho phép co lại nhỏ hơn nội dung thật để hiện thanh cuộn */
  overflow-y: auto !important; /* Bắt buộc hiện thanh cuộn dọc */
  overflow-x: hidden;        /* Ẩn thanh cuộn ngang */
  height: 100%;              /* Đảm bảo nó biết chiều cao tham chiếu */
  
  /* Tùy chỉnh thanh cuộn cho đẹp (Chrome/Safari/Edge) */
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) transparent;
}

/* Style thanh cuộn webkit */
.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-track { background: transparent; }
.scrollable-content::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 10px;
}
.scrollable-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.4);
}

/* Style thanh cuộn tùy chỉnh */
.scrollable-content::-webkit-scrollbar {
    width: 6px;
}
.scrollable-content::-webkit-scrollbar-track {
    background: transparent;
}
.scrollable-content::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-on-surface), 0.3);
    border-radius: 10px;
}
.scrollable-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.5);
}

/* === STYLES CHO TIMELINE CŨ (Giữ nguyên để không vỡ layout cũ) === */
.header-section { background-color: rgba(var(--v-theme-surface), 0.8); }
.controls-wrapper { gap: 8px; }
.swimlane { background-color: rgba(var(--v-theme-surface), 0.4); border-radius: 16px; padding: 8px; border: 1px solid rgba(var(--v-theme-border), 0.1); }
.member-header { background: linear-gradient(to right, rgba(var(--v-theme-primary), 0.05), transparent); border-radius: 12px; }
.time-group-column { background-color: rgba(var(--v-theme-surface), 0.5); border: 1px solid rgba(var(--v-theme-border), 0.15); transition: background-color 0.2s ease; }
.time-group-column:hover { background-color: rgba(var(--v-theme-surface), 0.8); }
.time-group-header { color: rgba(var(--v-theme-on-surface), 0.6); letter-spacing: 1px; font-size: 0.7rem !important; }
.checkin-stack { display: flex; flex-direction: column; gap: 10px; min-height: 60px; }
.empty-slot { color: rgba(var(--v-theme-on-surface), 0.2); border-color: rgba(var(--v-theme-border), 0.15) !important; background-color: transparent; }

/* === STYLES MỚI TINH GỌN CHO SOCIAL FEED === */
.neo-toggle { border-color: rgba(var(--v-theme-primary), 0.3) !important; }
.social-feed-wrapper {
    background-color: rgb(var(--v-theme-surface)); /* Đảm bảo nền đồng nhất */
}
.lh-1 { line-height: 1.2; }

/* Overlay hiển thị số ảnh còn lại */
.more-images-overlay {
    position: absolute; top: 0; right: 0; bottom: 0; left: 0;
    background-color: rgba(0, 0, 0, 0.5); color: white;
    display: flex; align-items: center; justify-content: center;
}
</style>