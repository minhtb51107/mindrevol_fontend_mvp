<template>
  <v-card class="timeline-dashboard glass-effect">
    <v-card-title class="d-flex align-center justify-space-between pa-0 pt-2 pr-2">
      <span class="pl-4 text-h6">Timeline Hoạt động</span>
      <DateSelector />
    </v-card-title>
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
        {{ progressStore.timelineError }}
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
                        class="checkin-card-summary pa-2 mb-1 rounded"
                        @click="openCheckInDetail(checkIn)"
                      >
                         <div class="d-flex align-center justify-space-between text-caption">
                            <span class="font-weight-medium text-on-surface">{{ formatTime(checkIn.checkInTimestamp) }}</span>
                            <div class="d-flex align-center">
                               <v-tooltip v-if="checkIn.notes" location="top" text="Có ghi chú">
                                  <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props" size="x-small" class="ml-1" color="medium-emphasis">mdi-note-text-outline</v-icon>
                                  </template>
                               </v-tooltip>
                                <v-tooltip v-if="checkIn.completedTasks?.length > 0" location="top" :text="`${checkIn.completedTasks.length} công việc`">
                                   <template v-slot:activator="{ props }">
                                     <span v-bind="props" class="ml-1 d-flex align-center text-medium-emphasis">
                                       <v-icon size="x-small" color="success">mdi-check-circle-outline</v-icon>
                                       <span class="ml-0_5">{{ checkIn.completedTasks.length }}</span>
                                     </span>
                                   </template>
                                </v-tooltip>
                                <v-tooltip v-if="checkIn.attachments?.length > 0" location="top" :text="`${checkIn.attachments.length} hình ảnh/tệp`">
                                   <template v-slot:activator="{ props }">
                                     <span v-bind="props" class="ml-1 d-flex align-center text-medium-emphasis">
                                         <v-icon size="x-small">mdi-paperclip</v-icon>
                                         <span class="ml-0_5">{{ checkIn.attachments.length }}</span>
                                     </span>
                                   </template>
                                </v-tooltip>
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

     <v-dialog v-model="detailDialog" max-width="600px">
        <v-card v-if="selectedCheckIn" class="glass-effect">
          <v-card-title>
            Chi tiết Check-in <span class="text-medium-emphasis text-body-2 ml-2">({{ selectedCheckIn.member?.userFullName }} - {{ formatDateTime(selectedCheckIn.checkInTimestamp) }})</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <p v-if="selectedCheckIn.notes" class="mb-3"><strong>Ghi chú:</strong> {{ selectedCheckIn.notes }}</p>
            <div v-if="selectedCheckIn.completedTasks?.length > 0" class="mb-3">
              <strong>Công việc đã hoàn thành:</strong>
              <v-list density="compact" lines="one" class="bg-transparent">
                <v-list-item v-for="task in selectedCheckIn.completedTasks" :key="task.taskId" :title="task.description" prepend-icon="mdi-check" class="text-on-surface"></v-list-item>
              </v-list>
            </div>
            <div v-if="selectedCheckIn.attachments?.length > 0">
              <strong>Hình ảnh/Tệp đính kèm:</strong>
              <v-row dense class="mt-1">
                 <v-col v-for="(att, index) in selectedCheckIn.attachments" :key="index" cols="6" sm="4">
                    <v-img
                        :src="att.fileUrl"
                        :alt="att.originalFilename || 'Attachment'"
                        aspect-ratio="1"
                        cover
                        class="rounded border"
                    >
                       <template v-slot:placeholder>
                         <div class="d-flex align-center justify-center fill-height">
                           <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                         </div>
                       </template>
                    </v-img>
                 </v-col>
              </v-row>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="medium-emphasis" text @click="detailDialog = false">Đóng</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProgressStore } from '@/stores/progress';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat'; 

import DateSelector from '@/components/DateSelector.vue'; 

dayjs.locale('vi');
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const progressStore = useProgressStore();

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
        return checkInTime.isSameOrAfter(groupStartDate) && checkInTime.isBefore(groupEndDate.add(1, 'second')); 
    }).sort((a, b) => dayjs(a.checkInTimestamp).diff(dayjs(b.checkInTimestamp))); 
};

const formatTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm');
};
const formatDateTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm DD/MM/YYYY');
};

const openCheckInDetail = (checkIn) => {
    selectedCheckIn.value = checkIn;
    detailDialog.value = true;
};

</script>

<style scoped>
.timeline-dashboard {
  display: flex;
  flex-direction: column;
}
.timeline-container {
  flex-grow: 1; 
  overflow-y: auto; 
  min-height: 400px; /* Đặt chiều cao tối thiểu để swimlane hiển thị tốt */
}
.swimlane-wrapper {
}
.swimlane {
}
.member-header {
  position: sticky; 
  top: 0;
  z-index: 1;
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
}
.checkin-card-summary {
  background-color: rgba(var(--v-theme-border), 0.1);
  border: 1px solid rgba(var(--v-theme-border), 0.2);
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}
.checkin-card-summary:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important; 
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}
.ml-0_5 {
  margin-left: 2px;
}
.bg-transparent {
    background-color: transparent !important;
}
.border {
    border: 1px solid rgba(var(--v-theme-border), 0.3) !important;
}
</style>