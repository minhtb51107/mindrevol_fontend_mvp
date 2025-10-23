<template>
  <v-card class="elevation-1" rounded="lg">
    <v-toolbar density="compact" color="surface" class="px-2">
      <v-toolbar-title class="text-h6 font-weight-medium">Bảng tiến độ nhóm</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="openCheckInModal()"
        prepend-icon="mdi-check-circle-outline"
        variant="flat"
        rounded="lg"
        elevation="2"
        size="small"
      >
        Check-in hôm nay
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <v-card-text class="pa-0">
      <div v-if="progressStore.isLoading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <p class="mt-4 text-medium-emphasis">Đang tải dữ liệu tiến độ...</p>
      </div>

      <v-alert
        v-else-if="progressStore.error"
        type="warning"
        variant="tonal"
        class="ma-4"
        density="compact"
        rounded="lg"
      >
        {{ progressStore.error }}
      </v-alert>

      <v-table v-else-if="progressStore.dashboard && progressStore.dashboard.membersProgress.length" density="comfortable" fixed-header class="progress-table">
        <thead>
          <tr>
            <th class="text-left font-weight-bold text-subtitle-2 member-header">Thành viên</th>
            <th v-for="(status, date) in firstMemberDailyStatus" :key="date" class="text-center font-weight-bold text-subtitle-2 day-header">
              {{ formatDateHeader(date) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in progressStore.dashboard.membersProgress" :key="member.userEmail">
            <td class="text-left font-weight-medium text-body-2 member-cell">
               <div class="d-flex align-center">
                 <v-avatar size="32" color="blue-grey-lighten-4" class="me-3">
                   <span class="text-caption font-weight-medium">{{ member.userFullName ? member.userFullName.charAt(0).toUpperCase() : '?' }}</span>
                 </v-avatar>
                 <span>{{ member.userFullName }}</span>
               </div>
            </td>
            <td
              v-for="(progressData, date) in member.dailyStatus"
              :key="date"
              class="text-center progress-cell"
              @click="openDetailModal(member, date, progressData)"
              :class="{ 'has-progress': progressData && progressData.id }"
              :title="getProgressTitle(progressData, date)"
            >
             <div class="d-flex flex-column align-center justify-center fill-height">
                 <v-icon
                     size="large"
                     :color="getProgressIconColor(progressData, date)"
                     :icon="getProgressIcon(progressData, date)"
                 ></v-icon>
                 <span v-if="progressData && progressData.id && tasks.length > 0" class="task-completion-indicator">
                    {{ getCompletedTasksCount(progressData) }}/{{ tasks.length }}
                 </span>
                 <span v-else-if="progressData && progressData.id && progressData.completed && tasks.length == 0" class="task-completion-indicator">
                   ✓
                 </span>
                 <v-icon
                   v-if="progressData && progressData.id && ((progressData.attachments && progressData.attachments.length > 0) || (progressData.evidence && progressData.evidence.length > 0))"
                   icon="mdi-paperclip"
                   size="x-small"
                   color="blue-grey-lighten-1"
                   class="evidence-indicator"
                   title="Có file đính kèm"
                 ></v-icon>
             </div>
          </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else class="text-center py-8 text-medium-emphasis">
        Chưa có thành viên nào hoặc kế hoạch không có ngày nào.
      </div>
    </v-card-text>
  </v-card>

  <CheckInModal
    v-if="isCheckInModalVisible"
    :shareable-link="shareableLink"
    @close="closeCheckInModal"
    :initial-data="checkinInitialData"
  />

  <ProgressDetailModal
    v-if="communityStore.selectedProgress"
    :shareable-link="shareableLink"
    @close="closeDetailModal"
  />

</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { useCommunityStore } from '@/stores/community';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import CheckInModal from '@/components/CheckInModal.vue';
import ProgressDetailModal from '@/components/ProgressDetailModal.vue';
import { VCard, VCardText, VTable, VIcon, VProgressCircular, VAlert, VToolbar, VToolbarTitle, VSpacer, VBtn, VDivider, VAvatar } from 'vuetify/components';

const props = defineProps({
  shareableLink: {
    type: String,
    required: true
  }
});

const progressStore = useProgressStore();
const communityStore = useCommunityStore();
const planStore = usePlanStore();
const authStore = useAuthStore();
const isCheckInModalVisible = ref(false);
const checkinInitialData = ref(null);

const firstMemberDailyStatus = computed(() => {
  return progressStore.dashboard?.membersProgress?.[0]?.dailyStatus || {};
});

const tasks = computed(() => planStore.currentPlanTasks || []);

onMounted(() => {
  if (props.shareableLink) {
    progressStore.fetchDashboard(props.shareableLink);
  }
});

const formatDateHeader = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate()}/${date.getMonth() + 1}`;
  } catch (e) {
    return dateString;
  }
};

const isPastOrToday = (dateString) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const date = new Date(dateString); if (isNaN(date.getTime())) return false; date.setHours(0,0,0,0);
        return date <= today;
    } catch (e) { return false; }
};

const getProgressIcon = (progressData, date) => {
    if (progressData && progressData.id) {
        if (tasks.value.length > 0) {
            const completedCount = getCompletedTasksCount(progressData);
            return completedCount === tasks.value.length ? 'mdi-check-circle' : 'mdi-progress-check';
        }
        return progressData.completed ? 'mdi-check-circle' : 'mdi-circle-slice-5';
    } else if (isPastOrToday(date)) { return 'mdi-circle-outline'; }
    else { return 'mdi-minus-circle-outline'; }
};

const getProgressIconColor = (progressData, date) => {
    if (progressData && progressData.id) {
        if (tasks.value.length > 0) {
            const completedCount = getCompletedTasksCount(progressData);
            return completedCount === tasks.value.length ? 'success' : 'warning';
        }
        return progressData.completed ? 'success' : 'warning';
    } else if (isPastOrToday(date)) { return 'grey-lighten-1'; }
    else { return 'grey-lighten-3'; }
};

const getProgressTitle = (progressData, date) => {
     if (progressData && progressData.id) {
        if (tasks.value.length > 0) {
            const completedCount = getCompletedTasksCount(progressData);
            const totalCount = tasks.value.length;
            if (completedCount === totalCount) { return `Hoàn thành (${completedCount}/${totalCount} công việc)`; }
            else { return `Đang thực hiện (${completedCount}/${totalCount} công việc)`; }
        }
        return progressData.completed ? 'Đã hoàn thành mục tiêu ngày' : 'Chưa hoàn thành mục tiêu ngày';
    } else if (isPastOrToday(date)) { return 'Chưa check-in'; }
    else { return 'Ngày tương lai'; }
};

const getCompletedTasksCount = (progressData) => {
    const completedIds = progressData?.completedTaskIds;
    if (Array.isArray(completedIds)) { return completedIds.length; }
    if (completedIds instanceof Set) { return completedIds.size; }
    return 0;
};

const openDetailModal = (member, date, progressData) => {
  if (progressData && progressData.id) {
    const fullProgressData = {
      ...progressData,
      memberFullName: member.userFullName,
      date: date,
      evidenceLinks: Array.isArray(progressData.evidence) ? progressData.evidence : [],
      attachments: Array.isArray(progressData.attachments) ? progressData.attachments : [],
      comments: Array.isArray(progressData.comments) ? progressData.comments : [],
      reactions: Array.isArray(progressData.reactions) ? progressData.reactions : [],
      completedTaskIds: progressData.completedTaskIds instanceof Set ? progressData.completedTaskIds : new Set(progressData.completedTaskIds || [])
    };
    communityStore.selectProgress(fullProgressData);
  } else if (isPastOrToday(date)) {
      openCheckInModal(date);
  }
};

const closeDetailModal = () => {
    communityStore.clearSelectedProgress();
};

const openCheckInModal = (prefillDate = null) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateToUse = prefillDate || todayStr;

    const currentUserEmail = authStore.currentUser?.email;
    const memberProgress = progressStore.dashboard?.membersProgress?.find(m => m.userEmail === currentUserEmail);
    const existingProgress = memberProgress?.dailyStatus?.[dateToUse];

    checkinInitialData.value = existingProgress && existingProgress.id
        ? {
            id: existingProgress.id,
            date: dateToUse,
            completed: existingProgress.completed,
            notes: existingProgress.notes,
            evidence: Array.isArray(existingProgress.evidence) ? existingProgress.evidence : [],
            completedTaskIds: existingProgress.completedTaskIds instanceof Set ? Array.from(existingProgress.completedTaskIds) : [],
          }
        : { date: dateToUse };

    isCheckInModalVisible.value = true;
};

const closeCheckInModal = () => {
  isCheckInModalVisible.value = false;
  checkinInitialData.value = null;
};
</script>

<style scoped>
.progress-table {
  border: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity));
  border-radius: inherit;
  overflow: hidden;
}
.progress-table thead th {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-bottom: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity));
}
.progress-cell {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  padding: 8px 4px !important;
  position: relative;
  min-width: 80px;
  height: 60px;
  vertical-align: middle;
  border-left: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity));
}
.progress-cell:hover {
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
.member-header {
  position: sticky;
  left: 0;
  z-index: 3;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  min-width: 180px;
}
.member-cell {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-theme-border), var(--v-border-opacity));
  min-width: 180px;
}
tbody tr:hover .member-cell {
   background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.day-header {
  padding: 8px 4px !important;
  min-width: 80px;
  white-space: nowrap;
}
.has-progress:hover {
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
.task-completion-indicator {
  display: block;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  line-height: 1.2;
  font-weight: 500;
  margin-top: 2px;
}
.evidence-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  opacity: 0.6;
}
.progress-cell:hover .evidence-indicator {
  opacity: 1;
}
</style>