<template>
  <v-sheet rounded="lg" class="pa-5 pa-md-6 mb-8 text-center" color="surface">
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
      rounded="lg"
      elevation="2"
    >
      Tạo kế hoạch học ngay
    </v-btn>
  </v-sheet>

  <div class="mt-8">
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-3">
      <h3 class="text-h6 me-auto">Các kế hoạch của bạn</h3>
      <v-text-field
            :model-value="planStore.getSearchTerm"
            @update:model-value="handleSearchInput"
            label="Tìm theo tên kế hoạch..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            rounded="lg"
            class="search-field"
            style="max-width: 300px;"
        ></v-text-field>
       <div class="d-flex align-center">
         <v-chip-group
           v-model="selectedStatusFilter"
           mandatory
           selected-class="text-primary bg-primary-lighten-4"
           density="compact"
           class="me-1 filter-chips"
         >
           <v-chip value="ALL" size="small" rounded="lg">Tất cả</v-chip>
           <v-chip value="ACTIVE" size="small" rounded="lg">Đang diễn ra</v-chip>
           <v-chip value="COMPLETED" size="small" rounded="lg">Hoàn thành</v-chip>
           <v-chip value="ARCHIVED" size="small" rounded="lg">Lưu trữ</v-chip>
         </v-chip-group>
         <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshUserPlans" :loading="planStore.isUserPlansLoading"></v-btn>
       </div>
    </div>

    <div v-if="planStore.isUserPlansLoading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <p class="mt-4 text-medium-emphasis">Đang tải kế hoạch...</p>
    </div>
    <v-alert v-else-if="planStore.userPlansError" type="warning" variant="tonal" density="compact" class="mb-4" rounded="lg">
        {{ planStore.userPlansError }}
    </v-alert>
    <v-alert v-else-if="!planStore.userPlans.length && !planStore.searchTerm" type="info" variant="tonal" density="compact" rounded="lg">
        <v-icon start>mdi-information-outline</v-icon> Bạn chưa tham gia kế hoạch nào. Hãy tạo một kế hoạch mới!
    </v-alert>
    <v-alert v-else-if="!filteredPlans.length" type="info" variant="tonal" density="compact" rounded="lg">
      <v-icon start>mdi-magnify-close</v-icon> Không có kế hoạch nào khớp với tìm kiếm{{ selectedStatusFilter !== 'ALL' ? ` và bộ lọc "${getFilterText(selectedStatusFilter)}"` : '' }}.
    </v-alert>

    <v-row v-else dense>
       <v-col v-for="plan in filteredPlans" :key="plan.id" cols="12" md="6" lg="4">
         <v-card :to="`/plan/${plan.shareableLink}`" link hover class="fill-height d-flex flex-column plan-card">
           <v-card-item class="pb-1">
             <v-card-title class="text-wrap text-h6">{{ plan.title }}</v-card-title>
             <v-card-subtitle class="text-wrap mt-1">{{ plan.description || 'Không có mô tả' }}</v-card-subtitle>
           </v-card-item>
           <v-card-text class="flex-grow-1 pt-3 pb-3">
              <v-chip :color="getStatusColor(plan.displayStatus)" size="small" label class="me-2 mb-2 font-weight-medium" rounded="lg">
                 {{ getStatusText(plan.displayStatus) }}
               </v-chip>
               <v-chip size="small" label class="me-2 mb-2" prepend-icon="mdi-calendar-clock-outline" variant="tonal" color="grey-darken-1" rounded="lg">
                  {{ plan.durationInDays }} ngày
                </v-chip>
                <v-chip size="small" label class="mb-2" prepend-icon="mdi-account-multiple-outline" variant="tonal" color="grey-darken-1" rounded="lg">
                  {{ plan.memberCount }} thành viên
                </v-chip>
           </v-card-text>
           <v-divider></v-divider>
           <v-card-actions class="px-4 py-3">
                 <v-chip v-if="plan.role === 'OWNER'" color="primary" variant="flat" size="small" label prepend-icon="mdi-crown-outline" rounded="lg">
                   Chủ kế hoạch
                 </v-chip>
                 <v-chip v-else color="grey" variant="tonal" size="small" label prepend-icon="mdi-account-outline" rounded="lg">
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
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePlanStore } from '@/stores/plan';
import {
  VSheet, VDivider, VBtn, VAlert, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VCardActions, VChip, VIcon, VSpacer, VProgressCircular,
  VChipGroup, VTextField
} from 'vuetify/components';

const authStore = useAuthStore();
const planStore = usePlanStore();

const selectedStatusFilter = ref('ACTIVE');

const userFullName = computed(() => authStore.userProfile?.fullname || authStore.currentUser?.fullname || 'bạn');

const filteredPlans = computed(() => {
  if (!planStore.userPlans) return [];
  if (selectedStatusFilter.value === 'ALL') {
    return planStore.userPlans;
  }
  return planStore.userPlans.filter(plan => plan.displayStatus === selectedStatusFilter.value);
});

onMounted(() => {
  planStore.initDebouncedFetch();
  if (!planStore.userPlans.length && !planStore.isUserPlansLoading) {
       planStore.fetchUserPlans('');
   }
});

const handleSearchInput = (value) => {
    planStore.triggerDebouncedFetch(value || '');
};

watch(selectedStatusFilter, (newStatus) => {
    planStore.fetchUserPlans(planStore.searchTerm);
});

const refreshUserPlans = () => {
    planStore.fetchUserPlans(planStore.searchTerm);
}

const getStatusText = (status) => {
    switch (status) {
        case 'ACTIVE': return 'Đang diễn ra';
        case 'COMPLETED': return 'Đã hoàn thành';
        case 'ARCHIVED': return 'Đã lưu trữ';
        default: return status || 'N/A';
    }
};

const getFilterText = (filterValue) => {
    switch (filterValue) {
        case 'ACTIVE': return 'Đang diễn ra';
        case 'COMPLETED': return 'Hoàn thành';
        case 'ARCHIVED': return 'Lưu trữ';
        default: return 'Tất cả';
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
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Lỗi format ngày:", e);
        return dateString;
    }
};

const formatDateRange = (start, end) => {
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    if (!formattedStart && !formattedEnd) return 'Không có ngày';
    if (!formattedStart) return `Đến ${formattedEnd}`;
    if (!formattedEnd) return `Từ ${formattedStart}`;
    return `${formattedStart} - ${formattedEnd}`;
};

</script>

<style scoped>
.text-wrap {
    white-space: normal;
    word-break: break-word;
}
.gap-3 {
    gap: 12px;
}
.search-field {
    flex-grow: 1;
    min-width: 200px;
}
.filter-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: calc(100% - 40px);
}

@media (max-width: 600px) {
  .search-field {
    max-width: 100%;
    order: -1;
    margin-bottom: 8px;
  }
  .filter-chips {
       max-width: 100%;
  }
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 2px 6px rgba(0, 0, 0, 0.05) !important;
  transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
}

.bg-primary-lighten-4 {
    background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>