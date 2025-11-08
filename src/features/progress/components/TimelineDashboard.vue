<template>
  <v-card class="timeline-dashboard glass-effect fill-height">
    <v-card-item class="pb-0 pt-3 header-section">
      <v-card-title
        class="d-flex align-center justify-space-between flex-wrap-reverse pa-0"
      >
        <div class="d-flex align-center">
          <v-icon color="secondary" class="mr-2" size="small"
            >mdi-calendar-check</v-icon
          >
          <span class="text-h6 font-weight-bold">Timeline Hoạt động</span>
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
            @click="toggleGlobalImages"
            :icon="showImages ? 'mdi-image-outline' : 'mdi-image-off-outline'"
            :color="showImages ? 'primary' : 'default'"
            variant="tonal"
            size="small"
            class="image-toggle-btn"
            :title="showImages ? 'Ẩn tất cả ảnh' : 'Hiện tất cả ảnh'"
          ></v-btn>
        </div>
      </v-card-title>
    </v-card-item>
    <v-divider class="mt-2 opacity-50"></v-divider>

    <v-card-text class="pa-0 timeline-container">
      <div
        v-if="progressStore.isLoadingTimeline"
        class="d-flex justify-center align-center fill-height pa-5"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="40"
        ></v-progress-circular>
        <span class="ml-3 text-body-1 text-medium-emphasis"
          >Đang tải timeline...</span
        >
      </div>

      <v-alert
        v-else-if="progressStore.timelineError"
        type="warning"
        variant="tonal"
        class="ma-4"
        density="comfortable"
        border="start"
        rounded="lg"
      >
        Không thể tải dữ liệu timeline. (Lỗi:
        {{ progressStore.timelineError }})
      </v-alert>

      <div
        v-else-if="!timelineData || timelineData.length === 0"
        class="d-flex flex-column justify-center align-center fill-height pa-5 text-medium-emphasis"
      >
        <v-icon size="64" color="grey-lighten-2" class="mb-4"
          >mdi-timeline-clock-outline</v-icon
        >
        <p class="text-h6 font-weight-regular">Chưa có hoạt động nào</p>
        <p class="text-body-2">
          Hãy là người đầu tiên check-in vào ngày này!
        </p>
      </div>

      <div v-else class="swimlane-wrapper pa-3">
        <div
          v-for="memberTimeline in timelineData"
          :key="memberTimeline.member.userId"
          class="swimlane mb-4"
        >
          <div class="member-header d-flex align-center px-3 py-2 mb-2">
            <v-avatar
              size="28"
              color="primary-darken-1"
              variant="tonal"
              class="mr-2"
            >
              <span class="text-caption font-weight-bold">{{
                getInitials(memberTimeline.member.userFullName)
              }}</span>
            </v-avatar>
            <span class="font-weight-bold text-body-2">{{
              memberTimeline.member.userFullName
            }}</span>
          </div>

          <v-row dense class="time-groups mx-0">
            <v-col
              v-for="group in timeGroups"
              :key="group.name"
              cols="12"
              sm="6"
              md="3"
              class="px-1"
            >
              <div class="time-group-column fill-height rounded-lg pa-2">
                <div
                  class="time-group-header text-caption text-center font-weight-bold text-uppercase mb-2"
                >
                  {{ group.name }}
                  <span class="text-disabled"
                    >({{ group.startHour }}h - {{ group.endHour }}h)</span
                  >
                </div>

                <div class="checkin-stack">
                  <template
                    v-if="
                      getCheckInsForGroup(memberTimeline.checkIns, group)
                        .length > 0
                    "
                  >
                    <CheckInCard
                      v-for="checkIn in getCheckInsForGroup(
                        memberTimeline.checkIns,
                        group
                      )"
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
                  <div
                    v-else
                    class="empty-slot text-caption text-center py-4 rounded border-dashed"
                  >
                    --
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </div>
    </v-card-text>

    <v-dialog v-model="detailDialog" max-width="700px" scrollable>
      <v-card v-if="selectedCheckIn" class="glass-effect rounded-xl">
        <v-card-title
          class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-4"
        >
          <span class="text-h6 font-weight-bold">Chi tiết Check-in</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="medium-emphasis"
            @click="detailDialog = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <div class="pa-4">
            <CheckInDetailCard :check-in="selectedCheckIn" />
          </div>
          <v-divider></v-divider>
          <CommentSection
            :comments="selectedCheckIn.comments || []"
            :check-in-id="selectedCheckIn.id"
            class="pa-4 bg-grey-lighten-5"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

// [CẬP NHẬT] Stores
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanStore } from '@/features/plan/stores/planStore';

// [CẬP NHẬT] Components Shared
import DateSelector from '@/components/common/DateSelector.vue';

// [CẬP NHẬT] Components nội bộ Feature Progress
import CheckInDetailCard from '@/features/progress/components/checkin/CheckInDetailCard.vue';
import CheckInCard from '@/features/progress/components/checkin/CheckInCard.vue';

// [CẬP NHẬT] Components từ Feature khác
import CommentSection from '@/features/community/components/CommentSection.vue';
import {
  VCard,
  VCardTitle,
  VCardText,
  VCardItem,
  VDivider,
  VProgressCircular,
  VAlert,
  VIcon,
  VRow,
  VCol,
  VBtn,
  VDialog,
  VAvatar,
} from 'vuetify/components';

const emit = defineEmits([
  'open-check-in',
  'edit-check-in',
  'delete-check-in',
  'comment-on-check-in',
]);

const progressStore = useProgressStore();
const planStore = usePlanStore();

// State
const showImages = ref(true);
const detailDialog = ref(false);
const selectedCheckIn = ref(null);

// Computed
const timelineData = computed(() => progressStore.timelineSwimlanes);
const selectedDate = computed(() => progressStore.getSelectedDate);

// Constants
const timeGroups = ref([
  { name: 'Sáng', startHour: 0, endHour: 11 },
  { name: 'Trưa', startHour: 12, endHour: 13 },
  { name: 'Chiều', startHour: 14, endHour: 17 },
  { name: 'Tối', startHour: 18, endHour: 23 },
]);

// Methods
const toggleGlobalImages = () => {
  showImages.value = !showImages.value;
};

const openCheckInDetail = (checkIn) => {
  selectedCheckIn.value = checkIn;
  detailDialog.value = true;
};

const handleToggleReaction = (checkInId, reactionType) => {
  progressStore.toggleReactionOnCheckIn(checkInId, reactionType);
};

const getCheckInsForGroup = (checkIns, group) => {
  if (!checkIns) return [];
  const dateStr = selectedDate.value;
  const start = dayjs(`${dateStr} ${group.startHour}:00:00`);
  const end = dayjs(`${dateStr} ${group.endHour}:59:59`);

  return checkIns
    .filter((c) => {
      const time = dayjs(c.checkInTimestamp);
      return time.isAfter(start.subtract(1, 'second')) && time.isBefore(end);
    })
    .sort((a, b) => dayjs(a.checkInTimestamp).diff(dayjs(b.checkInTimestamp)));
};

const getInitials = (name) => {
  return name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '??';
};
</script>

<style scoped>
/* Layout chính */
.timeline-dashboard {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-border), 0.4); 
}
.timeline-container {
  flex-grow: 1;
  overflow-y: auto;
  background-color: rgba(
    var(--v-theme-surface-variant),
    0.15
  ); /* Nền tổng thể hơi tối/sáng tùy theme */
}

/* Header & Controls */
.header-section {
  background-color: rgba(var(--v-theme-surface), 0.8);
}
.controls-wrapper {
  gap: 8px;
}
.image-toggle-btn {
  border: 1px solid rgba(var(--v-theme-border), 0.3);
}

/* Swimlane & Groups */
.swimlane-wrapper {
  max-width: 100%;
}
.swimlane {
  background-color: rgba(var(--v-theme-surface), 0.4);
  border-radius: 16px;
  padding: 8px;
  border: 1px solid rgba(var(--v-theme-border), 0.1);
}
.member-header {
  background: linear-gradient(
    to right,
    rgba(var(--v-theme-primary), 0.05),
    transparent
  );
  border-radius: 12px;
}

.time-group-column {
  background-color: rgba(
    var(--v-theme-surface),
    0.5
  ); /* Nền cho mỗi cột thời gian */
  border: 1px solid rgba(var(--v-theme-border), 0.15);
  transition: background-color 0.2s ease;
}
.time-group-column:hover {
  background-color: rgba(var(--v-theme-surface), 0.8);
}
.time-group-header {
  color: rgba(var(--v-theme-on-surface), 0.6);
  letter-spacing: 1px;
  font-size: 0.7rem !important;
}
.time-group-header .text-disabled {
  font-size: 0.65rem;
  opacity: 0.7;
}

/* Check-in Stack & Empty State */
.checkin-stack {
  display: flex;
  flex-direction: column;
  gap: 10px; /* Tăng khoảng cách giữa các thẻ */
  min-height: 60px;
}
.empty-slot {
  color: rgba(var(--v-theme-on-surface), 0.2);
  border-color: rgba(var(--v-theme-border), 0.15) !important;
  background-color: transparent;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  .v-card-title > div {
    width: 100%;
    justify-content: space-between;
  }
  .controls-wrapper {
    margin-top: 12px;
  }
}
</style>