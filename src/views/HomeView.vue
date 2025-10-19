<template>
  <v-sheet rounded="lg" class="pa-5 text-center" color="grey-lighten-3">
    <h1 class="text-h4 mb-2">Chào mừng, {{ userFullName }}!</h1>
    <p class="text-body-1 text-medium-emphasis mb-4">
      Sẵn sàng để bắt đầu một hành trình học tập mới cùng bạn bè?
    </p>
    <v-divider class="my-4"></v-divider>
    <p class="text-body-2 mb-4">Tạo một kế hoạch, mời bạn bè, và cùng nhau theo dõi tiến độ mỗi ngày.</p>
    <v-btn
      color="primary"
      size="large"
      to="/plans/create"
      prepend-icon="mdi-plus-circle-outline"
    >
      Tạo kế hoạch học ngay
    </v-btn>
  </v-sheet>

  <div class="mt-8">
    <div class="d-flex justify-space-between align-center mb-3">
       <h3 class="text-h6">Các kế hoạch bạn đang tham gia</h3>
       <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshUserPlans" :loading="planStore.isUserPlansLoading"></v-btn>
    </div>

    <div v-if="planStore.isUserPlansLoading" class="text-center py-5">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-alert v-else-if="planStore.userPlansError" type="warning" variant="tonal" density="compact" class="mb-4">
        {{ planStore.userPlansError }}
    </v-alert>
    <v-alert v-else-if="!planStore.userPlans.length" type="info" variant="tonal" density="compact">
      Bạn chưa tham gia kế hoạch nào.
    </v-alert>
    <v-row v-else>
       <v-col v-for="plan in planStore.userPlans" :key="plan.id" cols="12" md="6" lg="4">
         <v-card :to="`/plan/${plan.shareableLink}`" link hover class="fill-height d-flex flex-column">
           <v-card-item>
             <v-card-title class="text-wrap">{{ plan.title }}</v-card-title>
             <v-card-subtitle>{{ plan.description || 'Không có mô tả' }}</v-card-subtitle>
           </v-card-item>
           <v-card-text class="flex-grow-1">
              <v-chip :color="getStatusColor(plan.displayStatus)" size="small" label class="me-2 mb-2">
                 {{ getStatusText(plan.displayStatus) }}
               </v-chip>
               <v-chip size="small" label class="me-2 mb-2" prepend-icon="mdi-calendar-clock-outline">
                  {{ plan.durationInDays }} ngày
                </v-chip>
                <v-chip size="small" label class="mb-2" prepend-icon="mdi-account-multiple-outline">
                  {{ plan.memberCount }} thành viên
                </v-chip>
           </v-card-text>
           <v-divider></v-divider>
           <v-card-actions>
                <v-chip v-if="plan.role === 'OWNER'" color="primary" variant="tonal" size="small" label prepend-icon="mdi-crown-outline">
                   Chủ kế hoạch
                 </v-chip>
                 <v-chip v-else color="grey" variant="tonal" size="small" label prepend-icon="mdi-account-outline">
                   Thành viên
                 </v-chip>
                 <v-spacer></v-spacer>
                 <span class="text-caption text-medium-emphasis">
                   {{ formatDateRange(plan.startDate, plan.endDate) }}
                 </span>
           </v-card-actions>
         </v-card>
       </v-col>
     </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePlanStore } from '@/stores/plan';
import { VSheet, VDivider, VBtn, VAlert, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VCardActions, VChip, VIcon, VSpacer, VProgressCircular } from 'vuetify/components';

const authStore = useAuthStore();
const planStore = usePlanStore();

const userFullName = computed(() => {
  return authStore.currentUser?.fullname || 'bạn';
});

onMounted(() => {
  // Chỉ fetch nếu chưa có dữ liệu hoặc muốn load lại
  if (!planStore.userPlans.length && !planStore.isUserPlansLoading) {
       planStore.fetchUserPlans();
   }
});

const refreshUserPlans = () => {
    planStore.fetchUserPlans();
}

const getStatusText = (status) => {
    switch (status) {
        case 'ACTIVE': return 'Đang diễn ra';
        case 'COMPLETED': return 'Đã hoàn thành';
        case 'ARCHIVED': return 'Đã lưu trữ';
        default: return status || 'N/A';
    }
};

const getStatusColor = (status) => {
     switch (status) {
        case 'ACTIVE': return 'success';
        case 'COMPLETED': return 'primary';
        case 'ARCHIVED': return 'grey';
        default: return 'grey';
     }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN'); // Format dd/mm/yyyy
    } catch (e) {
        return dateString;
    }
};

const formatDateRange = (start, end) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
};

</script>

<style scoped>
.text-wrap {
    white-space: normal; /* Cho phép title xuống dòng */
}
</style>