<template>
  <v-card class="timeline-dashboard glass-effect fill-height"> 
    
    <v-card-item class="pb-0 pt-3">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap-reverse pa-0">
        <div class="d-flex align-center">
          <v-icon color="secondary" class="mr-2" size="small">mdi-calendar-check</v-icon>
          <span class="text-h6">Timeline Hoạt động</span>
        </div>
        
        <div class="d-flex align-center py-1">
          <v-btn
            v-if="planStore.isCurrentUserMember"
            color="success"
            class="mr-3 neon-glow-green"
            @click="emitOpenCheckIn"
            prepend-icon="mdi-check-circle-outline"
            variant="flat"
            size="small"
          >
            Check-in
          </v-btn>
          
          <DateSelector class="mr-2"/>

          <v-btn
            @click="toggleGlobalImages"
            :icon="showImages ? 'mdi-image-outline' : 'mdi-image-off-outline'"
            :color="showImages ? 'primary' : 'default'"
            variant="text"
            size="small"
            :title="showImages ? 'Ẩn tất cả ảnh' : 'Hiện tất cả ảnh'"
          ></v-btn>

        </div>
      </v-card-title>
    </v-card-item>    
    <v-divider class="mt-2"></v-divider>

    <v-card-text class="pa-0 timeline-container">
      <div v-if="progressStore.isLoadingTimeline" class="d-flex justify-center align-center fill-height pa-5">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="ml-3 text-medium-emphasis">Đang tải timeline...</span>
      </div>
      <v-alert
        v-else-if="progressStore.timelineError"
        type="warning"
        variant="tonal"
        class="ma-4"
        density="compact"
        border="start"
      >
        Không thể tải dữ liệu timeline. (Lỗi: {{ progressStore.timelineError }})
      </v-alert>
      <div v-else-if="!timelineData || timelineData.length === 0" class="d-flex justify-center align-center fill-height pa-5 text-medium-emphasis">
        Không có hoạt động nào được ghi nhận vào ngày này.
      </div>

      <div v-else class="swimlane-wrapper pa-2">
        <div v-for="memberTimeline in timelineData" :key="memberTimeline.member.userId" class="swimlane mb-3">
          <div class="member-header d-flex align-center pa-2 mb-1 rounded">
              <v-icon size="small" class="mr-2" color="secondary">mdi-account-circle-outline</v-icon>
            <span class="font-weight-medium text-on-surface">{{ memberTimeline.member.userFullName }}</span>
          </div>

          <v-row dense class="time-groups">
              <v-col v-for="group in timeGroups" :key="group.name" cols="3">
                  <div class="time-group-header text-caption text-center text-medium-emphasis mb-1">{{ group.name }}</div>
                  
                  <div class="checkin-stack">
                      <template v-if="getCheckInsForGroup(memberTimeline.checkIns, group).length > 0">
                          
                          <div
                            v-for="checkIn in getCheckInsForGroup(memberTimeline.checkIns, group)"
                            :key="checkIn.id"
                            class="checkin-item"
                          >
                            <div v-if="checkIn.attachments?.length > 0 && isImageVisible(checkIn)" class="checkin-card-modern" @click="openCheckInDetail(checkIn)">
                              
                              <div class="card-header">
                                <span class="card-time">{{ formatTime(checkIn.checkInTimestamp) }}</span>
                                
                                <div class="d-flex align-center">
                                  <v-menu v-if="canModify(checkIn)" location="bottom end">
                                    <template v-slot:activator="{ props }">
                                      <v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="props" @click.stop></v-btn>
                                    </template>
                                    <v-list density="compact">
                                      <v-list-item @click.stop="emit('edit-check-in', checkIn)">
                                        <template v-slot:prepend><v-icon icon="mdi-pencil-outline" size="small"></v-icon></template>
                                        <v-list-item-title>Sửa</v-list-item-title>
                                      </v-list-item>
                                      <v-list-item @click.stop="emit('delete-check-in', checkIn)" base-color="error">
                                        <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template>
                                        <v-list-item-title>Xóa</v-list-item-title>
                                      </v-list-item>
                                    </v-list>
                                  </v-menu>

                                  <v-btn
                                    class="toggle-pill-simple"
                                    density="compact"
                                    variant="text"
                                    icon="mdi-image-off-outline"
                                    size="x-small"
                                    title="Ẩn ảnh này"
                                    @click.stop="toggleLocalImage(checkIn)"
                                  ></v-btn>
                                </div>
                              </div>

                              <div class="card-body">
                                <div class="image-container">
                                  <v-img
                                    :src="checkIn.attachments[0].fileUrl"
                                    class="card-image rounded"
                                    max-height="150px"
                                  ></v-img>
                                </div>
                              </div>
                              
                              <div class="stats-footer">
                                <v-chip-group class="mr-auto" density="compact">
                                  <v-chip
                                    size="x-small"
                                    @click.stop="handleToggleReaction(checkIn, 'THUMBS_UP')"
                                    :color="hasMyReaction(checkIn, 'THUMBS_UP') ? 'primary' : 'default'"
                                    variant="tonal"
                                  >
                                    👍 {{ getReactionCount(checkIn, 'THUMBS_UP') }}
                                  </v-chip>
                                  <v-chip
                                    size="x-small"
                                    @click.stop="handleToggleReaction(checkIn, 'HEART')"
                                    :color="hasMyReaction(checkIn, 'HEART') ? 'pink' : 'default'"
                                    variant="tonal"
                                  >
                                    ❤️ {{ getReactionCount(checkIn, 'HEART') }}
                                  </v-chip>
                                </v-chip-group>

                                <span v-if="checkIn.completedTasks?.length > 0" :title="`${checkIn.completedTasks.length} task`">
                                  <v-icon size="small">mdi-check-all</v-icon>
                                  {{ checkIn.completedTasks.length }}
                                </span>
                                <span v-if="checkIn.attachments?.length > 0" :title="`${checkIn.attachments.length} ảnh`">
                                  <v-icon size="small">mdi-image</v-icon>
                                  {{ checkIn.attachments.length }}
                                </span>
                                <span v-if="checkIn.links?.length > 0" :title="`${checkIn.links.length} link`">
                                  <v-icon size="small">mdi-link-variant</v-icon>
                                  {{ checkIn.links.length }}
                                </span>
                                <span v-if="checkIn.commentCount > 0" :title="`${checkIn.commentCount} bình luận`">
                                  <v-icon size="small">mdi-comment-outline</v-icon>
                                  {{ checkIn.commentCount }}
                                </span> 
                              </div>
                            </div>

                            <div v-else class="checkin-card-modern" @click="openCheckInDetail(checkIn)">
                              
                              <div class="card-header">
                                <span class="card-time">{{ formatTime(checkIn.checkInTimestamp) }}</span>
                                
                                <div class="d-flex align-center">
                                  <v-menu v-if="canModify(checkIn)" location="bottom end">
                                    <template v-slot:activator="{ props }">
                                      <v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="props" @click.stop></v-btn>
                                    </template>
                                    <v-list density="compact">
                                      <v-list-item @click.stop="emit('edit-check-in', checkIn)">
                                        <template v-slot:prepend><v-icon icon="mdi-pencil-outline" size="small"></v-icon></template>
                                        <v-list-item-title>Sửa</v-list-item-title>
                                      </v-list-item>
                                      <v-list-item @click.stop="emit('delete-check-in', checkIn)" base-color="error">
                                        <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template>
                                        <v-list-item-title>Xóa</v-list-item-title>
                                      </v-list-item>
                                    </v-list>
                                  </v-menu>

                                  <v-btn
                                    v-if="checkIn.attachments?.length > 0"
                                    class="toggle-pill-simple"
                                    density="compact"
                                    variant="text"
                                    icon="mdi-image-outline"
                                    size="x-small"
                                    title="Hiện ảnh này"
                                    @click.stop="toggleLocalImage(checkIn)"
                                  ></v-btn>
                                </div>
                              </div>

                              <div class="card-body">
                                <div class="text-content">
                                  <p v-if="checkIn.completedTasks?.length > 0" class="card-title text-truncate-2" :title="checkIn.completedTasks[0].description">
                                    {{ checkIn.completedTasks[0].description }}
                                  </p>
                                  <p v-if="checkIn.notes" class="card-notes text-truncate-2" :title="checkIn.notes">
                                    {{ checkIn.notes }}
                                  </p>
                                  <p v-if="checkIn.completedTasks?.length === 0 && !checkIn.notes" class="card-notes text-truncate-2 text-medium-emphasis">
                                    (Không có ghi chú)
                                  </p>
                                </div>
                              </div>
                              
                              <div class="stats-footer">
                                <v-chip-group class="mr-auto" density="compact">
                                  <v-chip
                                    size="x-small"
                                    @click.stop="handleToggleReaction(checkIn, 'THUMBS_UP')"
                                    :color="hasMyReaction(checkIn, 'THUMBS_UP') ? 'primary' : 'default'"
                                    variant="tonal"
                                  >
                                    👍 {{ getReactionCount(checkIn, 'THUMBS_UP') }}
                                  </v-chip>
                                  <v-chip
                                    size="x-small"
                                    @click.stop="handleToggleReaction(checkIn, 'HEART')"
                                    :color="hasMyReaction(checkIn, 'HEART') ? 'pink' : 'default'"
                                    variant="tonal"
                                  >
                                    ❤️ {{ getReactionCount(checkIn, 'HEART') }}
                                  </v-chip>
                                </v-chip-group>
                                
                                <span v-if="checkIn.completedTasks?.length > 0" :title="`${checkIn.completedTasks.length} task`">
                                  <v-icon size="small">mdi-check-all</v-icon>
                                  {{ checkIn.completedTasks.length }}
                                </span>
                                <span v-if="checkIn.attachments?.length > 0" :title="`${checkIn.attachments.length} ảnh`">
                                  <v-icon size="small">mdi-image</v-icon>
                                  {{ checkIn.attachments.length }}
                                </span>
                                <span v-if="checkIn.links?.length > 0" :title="`${checkIn.links.length} link`">
                                  <v-icon size="small">mdi-link-variant</v-icon>
                                  {{ checkIn.links.length }}
                                </span>
                                <span v-if="checkIn.commentCount > 0" :title="`${checkIn.commentCount} bình luận`">
                                  <v-icon size="small">mdi-comment-outline</v-icon>
                                  {{ checkIn.commentCount }}
                                </span> 
                              </div>
                            </div>
                          </div>
                      </template>
                        <div v-else class="text-caption text-center text-grey-darken-2 pa-2">-</div>
                  </div>
              </v-col>
          </v-row>
        </div>
      </div>
    </v-card-text>

    <v-dialog v-model="detailDialog" max-width="700px" scrollable>
        <v-card v-if="selectedCheckIn" class="glass-effect">
          <v-card-title class="d-flex justify-space-between align-center">
            Chi tiết Check-in
            <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false"></v-btn>
          </v-card-title>
          
          <v-card-text>
            <CheckInDetailCard :check-in="selectedCheckIn" />

            <v-divider class="my-4"></v-divider>

            <CommentSection 
              :comments="selectedCheckIn.comments || []" 
              :check-in-id="selectedCheckIn.id"
            />

          </v-card-text>

          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              v-if="canModify(selectedCheckIn)"
              color="primary"
              variant="text" 
              @click="emit('edit-check-in', selectedCheckIn); detailDialog = false;"
            >
              Sửa Check-in
            </v-btn>
            <v-btn 
              v-if="canModify(selectedCheckIn)"
              color="error"
              variant="text" 
              @click="emit('delete-check-in', selectedCheckIn); detailDialog = false;"
            >
              Xóa Check-in
            </v-btn>
            <v-btn color="medium-emphasis" variant="text" @click="detailDialog = false">Đóng</v-btn>
          </v-card-actions>

        </v-card>
      </v-dialog>

  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan'; 
import { useAuthStore } from '@/stores/auth'; 
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat'; 

import DateSelector from '@/components/DateSelector.vue'; 
import CheckInDetailCard from '@/components/CheckInDetailCard.vue'; 
// THÊM MỚI: Import CommentSection
import CommentSection from '@/components/CommentSection.vue';

import {
  VCard, VCardTitle, VCardText, VDivider, VProgressCircular, VAlert, VIcon, VRow, VCol,
  VDialog, VCardActions, VSpacer, VBtn, VList, VListItem, VImg, VCardItem, VListItemTitle,
  VMenu, VChipGroup, VChip // Thêm VChipGroup, VChip
} from 'vuetify/components'; 

dayjs.locale('vi');
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const progressStore = useProgressStore();
const planStore = usePlanStore(); 
const authStore = useAuthStore(); 

const emit = defineEmits(['open-check-in', 'edit-check-in', 'delete-check-in', 'comment-on-check-in']);

const EDIT_GRACE_PERIOD_HOURS = 24; 

// === LOGIC QUẢN LÝ ẢNH (Giữ nguyên) ===
const showImages = ref(true); 
const imageStateOverrides = ref({}); 

const toggleGlobalImages = () => {
  showImages.value = !showImages.value;
  imageStateOverrides.value = {};
};

const isImageVisible = (checkIn) => {
  const localOverride = imageStateOverrides.value[checkIn.id];
  if (localOverride !== undefined) {
    return localOverride; 
  }
  return showImages.value; 
};

const toggleLocalImage = (checkIn) => {
  const currentVisibility = isImageVisible(checkIn);
  imageStateOverrides.value[checkIn.id] = !currentVisibility;
};
// === KẾT THÚC LOGIC ẢNH ===


const emitOpenCheckIn = () => {
  emit('open-check-in');
};

const timelineData = computed(() => progressStore.timelineSwimlanes); 
const selectedDate = computed(() => progressStore.getSelectedDate); 

const detailDialog = ref(false);
const selectedCheckIn = ref(null);

const timeGroups = ref([
    { name: 'Sáng', startHour: 0, endHour: 11 },
    { name: 'Trưa', startHour: 12, endHour: 13 },
    { name: 'Chiều', startHour: 14, endHour: 17 },
    { name: 'Tối', startHour: 18, endHour: 24 } 
]);

const getCheckInsForGroup = (checkIns, group) => {
    if (!checkIns) return [];
    
    const groupStartDate = dayjs(selectedDate.value).hour(group.startHour).minute(0).second(0);
    const groupEndDate = group.endHour === 24
        ? dayjs(selectedDate.value).endOf('day')
        : dayjs(selectedDate.value).hour(group.endHour).minute(59).second(59);

    return checkIns.filter(checkIn => {
        const checkInTime = dayjs(checkIn.checkInTimestamp);
        return checkInTime.isAfter(groupStartDate.subtract(1, 'second')) && checkInTime.isBefore(groupEndDate.add(1, 'second')); 
    }).sort((a, b) => dayjs(a.checkInTimestamp).diff(dayjs(b.checkInTimestamp))); 
};


const formatTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm');
};
const formatDateTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm [ngày] DD/MM/YYYY');
};

const openCheckInDetail = (checkIn) => {
    // Khi mở dialog, chúng ta nạp "selectedCheckIn"
    // Toàn bộ dialog (bao gồm cả CommentSection) sẽ dùng chung dữ liệu này
    selectedCheckIn.value = checkIn;
    detailDialog.value = true;
};

// --- Logic Sửa/Xóa Check-in (Giữ nguyên) ---
const canModify = (checkIn) => {
  if (!checkIn || !authStore.currentUser) {
    return false;
  }
  const isOwner = checkIn.member?.userId === authStore.currentUser.id;
  const isWithinGracePeriod = dayjs().diff(checkIn.checkInTimestamp, 'hour') < EDIT_GRACE_PERIOD_HOURS;
  return isOwner && isWithinGracePeriod;
};

// --- THÊM MỚI: LOGIC XỬ LÝ REACTION IN-LINE ---

// Giả định: checkIn.reactions là một mảng:
// [ { type: "THUMBS_UP", count: 2, hasCurrentUserReacted: true }, ... ]

const getReactionCount = (checkIn, reactionType) => {
  if (!checkIn.reactions) return 0;
  const reaction = checkIn.reactions.find(r => r.type === reactionType);
  return reaction ? reaction.count : 0;
};

const hasMyReaction = (checkIn, reactionType) => {
  if (!checkIn.reactions) return false;
  const reaction = checkIn.reactions.find(r => r.type === reactionType);
  return reaction ? reaction.hasCurrentUserReacted : false;
};

const handleToggleReaction = (checkIn, reactionType) => {
  // Gọi action mới trong progressStore (sẽ tạo ở bước 3)
  // Ngăn sự kiện click nổi bọt (bubble) để không mở dialog
  console.log(`Toggling ${reactionType} for check-in ${checkIn.id}`);
  progressStore.toggleReactionOnCheckIn(checkIn.id, reactionType);
};

</script>

<style scoped>
/* CSS Gốc (đã chỉnh sửa) */
.timeline-dashboard {
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}
.timeline-container {
  flex-grow: 1; 
  overflow-y: auto; 
}
.swimlane-wrapper {
}
.swimlane {
}
.member-header {
  position: sticky; 
  top: 0;
  z-index: 10;
  background-color: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 8px; /* Giống theme */
}
.time-groups {
}
.time-group-header {
  font-weight: 500;
}
.checkin-stack {
    min-height: 40px; 
    display: flex;
    flex-direction: column;
    gap: 8px; /* Khoảng cách giữa các thẻ check-in */
}
.checkin-item {
  cursor: pointer;
}

/* CSS tiện ích (Gốc) */
.ml-0_5 {
  margin-left: 2px;
}
.bg-transparent {
    background-color: transparent !important;
}
.border {
    border: 1px solid rgba(var(--v-theme-border), 0.3) !important;
}
/* CSS tiện ích mới cho cắt ngắn 2 dòng */
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word; /* Thêm để ngắt từ tốt hơn */
  line-height: 1.4; /* Thêm chiều cao dòng */
  max-height: 2.8em; /* line-height * 2 */
}
.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}


/* === CSS CHO THẺ HIỆN ĐẠI MỚI === */
.checkin-card-modern {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-theme-border), 0.2);
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 2px rgba(0,0,0, 0.05);
}
.checkin-card-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* 1. Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px 4px 8px; /* Giảm padding dưới */
}
.card-time {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--v-theme-on-surface);
}
.toggle-pill-simple.v-btn { /* Nút Ẩn/Hiện */
  color: var(--v-theme-on-surface-variant);
  opacity: 0.7;
  border-radius: 50%;
  width: 24px;
  height: 24px;
}
.toggle-pill-simple.v-btn:hover {
  opacity: 1;
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}
/* MỚI: Căn chỉnh wrapper nút bên phải header */
.card-header .d-flex {
  margin-left: auto; /* Đẩy nhóm nút sang phải */
}

/* 2. Body */
.card-body {
  padding: 0 8px 8px 8px; /* Padding xung quanh nội dung */
  min-height: 40px; /* Chiều cao tối thiểu nếu không có text/ảnh */
}

/* 2a. Body - Khi có ảnh */
.image-container {
  /* CSS này tạo padding cho ảnh */
}
.card-image.v-img {
  border-radius: 6px; /* Bo tròn ảnh */
  border: 1px solid rgba(var(--v-theme-border), 0.1);
}

/* 2b. Body - Khi không có ảnh */
.text-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--v-theme-on-surface);
  line-height: 1.3;
}
.card-notes {
  font-size: 0.75rem;
  color: var(--v-theme-on-surface-variant);
  line-height: 1.4;
}

/* 3. Footer */
.stats-footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap; /* Thêm để rớt hàng nếu nhiều icon */
  gap: 12px; 
  padding: 6px 8px;
  font-size: 0.8rem;
  color: var(--v-theme-on-surface-variant);
  border-top: 1px solid rgba(var(--v-theme-border), 0.2);
}
.stats-footer span {
  display: flex;
  align-items: center;
  gap: 3px;
}
/* CẬP NHẬT: Căn chỉnh cho VChipGroup (Reaction) */
.stats-footer .v-chip-group {
    flex-grow: 1; /* Đẩy các span (count) sang phải */
    margin-right: auto;
}
.stats-footer .v-chip {
    margin: 0 4px 0 0 !important;
}

/* === KẾT THÚC CSS MỚI === */


/* Media query (Gốc) */
@media (max-width: 960px) {
  .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  .v-card-title > div {
    width: 100%;
  }
  .v-card-title > .d-flex.align-center.py-1 {
     justify-content: flex-end;
     margin-top: 8px;
  }
}
</style>