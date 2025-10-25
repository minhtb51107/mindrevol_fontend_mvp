<template>
  <v-container fluid class="home-view-container pa-4 pa-md-6">
    <v-row class="mb-6 mb-md-8">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Chào buổi sáng, {{ userFullName }}!</h1>
        <p class="text-body-1 text-medium-emphasis">Đây là tổng quan nhanh về hành trình của bạn hôm nay.</p>
      </v-col>

      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="elevated" elevation="1" color="surface" rounded="xl" class="pa-4 fill-height stat-card">
           <v-icon color="primary" size="x-large" class="mb-3">mdi-progress-check</v-icon>
           <div class="text-caption text-medium-emphasis mb-1">Đang hoạt động</div>
           <div class="text-h4 font-weight-bold">{{ activePlanCount }}</div>
           <div class="text-body-2">Kế hoạch</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4" lg="3">
       <v-card variant="elevated" elevation="1" color="surface" rounded="xl" class="pa-4 fill-height stat-card">
           <v-progress-circular
              v-if="progressStore.isLoadingStats && !statsLoadedInitially"
              indeterminate
              color="grey"
              size="40"
              width="3"
              class="mb-3"
            ></v-progress-circular>
            <v-icon
              v-else
             :color="checkinCardColor"
             size="x-large"
             class="mb-3"
           >
             {{ checkinCardIcon }}
           </v-icon>

           <div class="text-caption text-medium-emphasis mb-1">Check-in hôm nay</div>

           <div v-if="progressStore.isLoadingStats && !statsLoadedInitially" class="text-h4 font-weight-bold text-medium-emphasis">...</div>
            <div v-else class="text-h4 font-weight-bold" :class="checkinTextColorClass">
              {{ checkinStatusText }}
            </div>


           <v-btn v-if="!allTasksCompletedToday && activePlanCount > 0" size="small" variant="text" :color="checkinCardColor" class="pa-0 mt-1 align-self-start text-body-2" @click="goToFirstActivePlan" :disabled="progressStore.isLoadingStats">
             {{ progressStore.userStats.completedTasksToday > 0 ? 'Tiếp tục' : 'Check-in ngay' }}
             <v-icon end size="small">mdi-arrow-right</v-icon>
           </v-btn>
           <div v-else-if="allTasksCompletedToday" class="text-body-2 text-success">Tuyệt vời!</div>
           <div v-else class="text-body-2 text-medium-emphasis">Hôm nay không có kế hoạch nào.</div> </v-card>
      </v-col>


      <v-col cols="12" sm="6" md="4" lg="3">
          <v-card variant="elevated" elevation="1" color="surface" rounded="xl" class="pa-4 fill-height stat-card">
              <v-icon color="deep-purple-lighten-1" size="x-large" class="mb-3">mdi-fire</v-icon>
              <div class="text-caption text-medium-emphasis mb-1">Chuỗi ngày</div>
              <div v-if="progressStore.isLoadingStats && !statsLoadedInitially" class="text-h4 font-weight-bold text-medium-emphasis">...</div>
              <div v-else class="text-h4 font-weight-bold">{{ currentStreak }}</div>
              <div class="text-body-2">Ngày liên tục</div>
          </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="12" lg="3" class="d-flex">
          <v-btn
             color="primary"
             height="100%"
             min-height="150px"
             to="/plans/create"
             rounded="xl"
             elevation="0"
             variant="flat"
             class="pa-5 text-h6 flex-grow-1 create-plan-btn d-flex flex-column justify-center align-center"
             style="white-space: normal; line-height: 1.4;"
           >
             <v-icon size="x-large" class="mb-2">mdi-plus-circle-outline</v-icon>
             Tạo kế hoạch mới
           </v-btn>
      </v-col>
    </v-row>

    <v-row>
        <v-col cols="12" lg="8">
             <div class="d-flex flex-wrap justify-space-between align-center mb-5 gap-3">
                <h3 class="text-h6 font-weight-medium me-auto">Kế hoạch của bạn</h3>
                 <v-text-field
                      :model-value="planStore.getSearchTerm"
                      @update:model-value="handleSearchInput"
                      label="Tìm kế hoạch..."
                      variant="solo-filled" density="compact" prepend-inner-icon="mdi-magnify" clearable hide-details rounded="lg" flat bg-color="surface"
                      class="search-field flex-grow-1 flex-sm-grow-0" style="max-width: 280px;"
                  ></v-text-field>
                <div class="d-flex align-center filter-container">
                  <v-chip-group
                    v-model="selectedStatusFilter"
                    mandatory
                    selected-class="text-primary bg-primary-lighten-4"
                    density="compact"
                    class="me-1 filter-chips"
                    variant="tonal" 
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
               <v-alert v-else-if="!planStore.userPlans.length && !planStore.searchTerm" type="info" variant="tonal" density="compact" rounded="lg" class="pa-4 text-center">
                   <v-icon start size="small">mdi-information-outline</v-icon>
                   <span>Bạn chưa có kế hoạch nào.</span>
                   <v-btn color="primary" variant="text" size="small" to="/plans/create" class="ms-2">Bắt đầu tạo ngay</v-btn>
               </v-alert>
               <v-alert v-else-if="!filteredPlans.length" type="info" variant="tonal" density="compact" rounded="lg" class="pa-4 text-center">
                 <v-icon start size="small">mdi-magnify-close</v-icon>
                 <span>Không có kế hoạch nào khớp.</span>
               </v-alert>
              <v-row v-else dense>
                 <v-col v-for="plan in filteredPlans" :key="plan.id" cols="12" md="6">
                   <v-card :to="`/plan/${plan.shareableLink}`" link hover class="fill-height d-flex flex-column plan-card-modern mb-3" variant="outlined" rounded="xl">
                     <v-card-item class="pb-2 pt-4 px-4">
                        <div class="d-flex justify-space-between align-start mb-2">
                           <v-chip :color="getStatusColor(plan.displayStatus)" size="small" label class="font-weight-medium" rounded="lg" variant="tonal">
                              <v-icon start size="small">{{ getStatusIcon(plan.displayStatus) }}</v-icon>
                              {{ getStatusText(plan.displayStatus) }}
                           </v-chip>
                            <v-chip v-if="plan.role === 'OWNER'" color="primary" variant="text" size="x-small" label prepend-icon="mdi-crown-outline" rounded="lg" class="ms-auto">Owner</v-chip>
                        </div>
                       <v-card-title class="text-wrap text-h6 font-weight-medium mb-1 plan-title">{{ plan.title }}</v-card-title>
                       <v-card-subtitle class="text-wrap text-body-2 text-medium-emphasis">{{ plan.description || 'Chưa có mô tả' }}</v-card-subtitle>
                     </v-card-item>
                     <v-spacer></v-spacer>
                     <v-divider></v-divider>
                     <v-card-actions class="px-4 py-2">
                           <v-chip size="small" label prepend-icon="mdi-calendar-range-outline" variant="text" color="grey-darken-1" rounded="lg">
                              {{ formatDateRangeShort(plan.startDate, plan.endDate) }}
                           </v-chip>
                           <v-chip size="small" label prepend-icon="mdi-account-multiple-outline" variant="text" color="grey-darken-1" rounded="lg">
                              {{ plan.memberCount }} thành viên
                           </v-chip>
                           <v-spacer></v-spacer>
                           <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
                     </v-card-actions>
                   </v-card>
                 </v-col>
               </v-row>
        </v-col>

        <v-col cols="12" lg="4">
             <ProgressChart class="mb-4" />
             <CommunityFeed class="mb-4" />
             <QuoteOfTheDay />
        </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Imports components
import ProgressChart from '@/components/ProgressChart.vue';
import CommunityFeed from '@/components/CommunityFeed.vue';
import QuoteOfTheDay from '@/components/QuoteOfTheDay.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
// Imports stores
import { useAuthStore } from '@/stores/auth';
import { usePlanStore } from '@/stores/plan';
import { useProgressStore } from '@/stores/progress';
// Imports Vuetify components used in template
import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VCardActions, VChip, VIcon, VSpacer, VProgressCircular, VAlert,
  VChipGroup, VTextField, VBtn, VDivider, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar
} from 'vuetify/components';

const router = useRouter();
const authStore = useAuthStore();
const planStore = usePlanStore();
const progressStore = useProgressStore();

const selectedStatusFilter = ref('ACTIVE');
const statsLoadedInitially = ref(false);

// --- Computed Properties Lấy Dữ liệu từ Stores ---
const userFullName = computed(() => authStore.userProfile?.fullname || authStore.currentUser?.fullname || 'bạn');

const activePlanCount = computed(() => {
  return Array.isArray(planStore.userPlans)
    ? planStore.userPlans.filter(p => p.displayStatus === 'ACTIVE').length
    : 0;
});

// --- Computed Properties MỚI cho Thẻ Check-in ---
const allTasksCompletedToday = computed(() => {
  return progressStore.userStats?.checkedInTodayComplete ?? false;
});

const checkinStatusText = computed(() => {
  const stats = progressStore.userStats;
  if (progressStore.isLoadingStats && !statsLoadedInitially.value) {
      return '...';
  }
  if (allTasksCompletedToday.value) {
    return 'Đã xong';
  } else if (stats.totalTasksToday > 0) {
    return `${stats.completedTasksToday || 0}/${stats.totalTasksToday}`;
  } else if (stats.totalTasksToday === 0 && activePlanCount.value > 0) {
     const hasAnyCheckin = stats.completedTasksToday >= 0 && !progressStore.isLoadingStats;
     return hasAnyCheckin ? 'Đã check-in' : 'Chưa có';
  }
  else {
    return 'Chưa có';
  }
});

const checkinCardColor = computed(() => {
  if (progressStore.isLoadingStats && !statsLoadedInitially.value) return 'grey';
  if (allTasksCompletedToday.value) {
    return 'success';
  } else if (progressStore.userStats.completedTasksToday > 0) {
    return 'warning';
  } else if (activePlanCount.value > 0) {
     return 'grey-darken-1';
  } else {
    return 'grey';
  }
});

const checkinCardIcon = computed(() => {
   if (progressStore.isLoadingStats && !statsLoadedInitially.value) return '';
   if (allTasksCompletedToday.value) {
    return 'mdi-calendar-check-outline';
  } else if (progressStore.userStats.completedTasksToday > 0 && progressStore.userStats.totalTasksToday > 0) {
    return 'mdi-calendar-clock-outline';
  } else if (activePlanCount.value > 0) {
     return 'mdi-calendar-alert-outline';
  }
  else {
      return 'mdi-calendar-blank-outline';
  }
});

const checkinTextColorClass = computed(() => {
    if (progressStore.isLoadingStats && !statsLoadedInitially.value) return 'text-medium-emphasis';
    if (allTasksCompletedToday.value) {
        return 'text-success';
    } else if (progressStore.userStats.completedTasksToday > 0) {
        return 'text-warning';
    } else {
        return 'text-medium-emphasis';
    }
});
// --- Kết thúc Computed Check-in ---


const currentStreak = computed(() => {
  return progressStore.userStats?.currentStreak ?? 0;
});

const firstActivePlanLink = computed(() => {
    const activePlan = Array.isArray(planStore.userPlans)
        ? planStore.userPlans.find(p => p.displayStatus === 'ACTIVE')
        : null;
    return activePlan ? `/plan/${activePlan.shareableLink}` : null;
});

const filteredPlans = computed(() => {
  if (!Array.isArray(planStore.userPlans)) return [];
  const searchTermLower = planStore.searchTerm?.toLowerCase() || '';
  return planStore.userPlans.filter(plan => {
    const matchesSearch = !searchTermLower || plan.title?.toLowerCase().includes(searchTermLower);
    const matchesStatus = selectedStatusFilter.value === 'ALL' || plan.displayStatus === selectedStatusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// --- Lifecycle Hook ---
onMounted(async () => {
  planStore.initDebouncedFetch();
  if (!planStore.userPlans.length && !planStore.isUserPlansLoading) {
       await planStore.fetchUserPlans(planStore.searchTerm);
  }
  if (authStore.isAuthenticated && !progressStore.isLoadingStats) {
      await progressStore.fetchUserStats();
      statsLoadedInitially.value = true;
  } else if (progressStore.userStats.totalTasksToday > 0 || progressStore.userStats.currentStreak > 0) {
      statsLoadedInitially.value = true;
  }
});

// --- Methods ---
const handleSearchInput = (value) => { planStore.triggerDebouncedFetch(value || ''); };
watch(selectedStatusFilter, () => { planStore.fetchUserPlans(planStore.searchTerm); });
const refreshUserPlans = async () => {
    statsLoadedInitially.value = false;
    await planStore.fetchUserPlans(planStore.searchTerm);
    if (authStore.isAuthenticated) {
        await progressStore.fetchUserStats();
        statsLoadedInitially.value = true;
    }
}

// Các hàm helpers
const getStatusText = (status) => {
    switch (status) { case 'ACTIVE': return 'Đang diễn ra'; case 'COMPLETED': return 'Hoàn thành'; case 'ARCHIVED': return 'Lưu trữ'; default: return status || 'N/A'; }
};
const getFilterText = (filterValue) => {
    switch (filterValue) { case 'ACTIVE': return 'Đang diễn ra'; case 'COMPLETED': return 'Hoàn thành'; case 'ARCHIVED': return 'Lưu trữ'; default: return 'Tất cả'; }
};
const getStatusColor = (status) => {
     switch (status) { case 'ACTIVE': return 'success'; case 'COMPLETED': return 'primary'; case 'ARCHIVED': return 'grey-darken-1'; default: return 'grey'; }
};
const getStatusIcon = (status) => {
    switch (status) { case 'ACTIVE': return 'mdi-progress-check'; case 'COMPLETED': return 'mdi-check-decagram-outline'; case 'ARCHIVED': return 'mdi-archive-arrow-down-outline'; default: return 'mdi-help-circle-outline'; }
}
const formatDate = (dateString) => {
    if (!dateString) return ''; try { const date = new Date(dateString); if (isNaN(date.getTime())) return dateString; return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return dateString; }
};
const formatDateRangeShort = (start, end) => {
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    if (!formattedStart) return `Đến ${formattedEnd || 'N/A'}`;
    return `${formattedStart} - ${formattedEnd || 'N/A'}`;
};
const goToFirstActivePlan = () => {
    if (firstActivePlanLink.value) {
        router.push(firstActivePlanLink.value);
    } else {
        alert("Hiện không có kế hoạch nào đang hoạt động để check-in.");
        console.warn("Không tìm thấy kế hoạch nào đang hoạt động.");
    }
};

</script>

<style scoped>
.home-view-container {
  max-width: 1400px; /* Giới hạn chiều rộng tối đa */
  margin: 0 auto;
}

.stat-card {
  text-align: center;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(var(--v-theme-on-surface), 0.08) !important;
}

.create-plan-btn {
   transition: background-color 0.2s ease-out, transform 0.2s ease-out;
}
.create-plan-btn:hover {
    background-color: rgb(var(--v-theme-primary-darken-1)) !important;
    transform: scale(1.02);
}

.plan-card-modern {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out;
  border-color: rgba(var(--v-theme-border), var(--v-border-opacity));
}
.plan-card-modern:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(var(--v-theme-on-surface), 0.07), 0 3px 6px rgba(var(--v-theme-on-surface), 0.05) !important;
  border-color: rgba(var(--v-theme-primary), 0.6) !important;
}

.plan-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(1.5em * 1.2 * 2); /* line-height * font-size * number of lines */
  line-height: 1.2;
}

.search-field { min-width: 250px; }
.filter-container { width: 100%; justify-content: space-between; }
.filter-chips { flex-wrap: nowrap; overflow-x: auto; flex-grow: 1; }

@media (min-width: 600px) { /* sm breakpoint */
  .filter-container { width: auto; }
}

/* Style cho chip filter (sử dụng variant="tonal") */
/* .v-chip-group .v-chip { ... } */ /* Không cần style nền nữa */

/* Style cho chip được chọn (ghi đè selected-class nếu cần) */
.v-chip-group .v-chip--selected.bg-primary-lighten-4 {
    background-color: rgba(var(--v-theme-primary), 0.15) !important; /* Làm đậm hơn nữa */
    color: rgb(var(--v-theme-primary-darken-1)) !important;
    font-weight: 500;
}
.v-card-actions { background-color: transparent; }
.v-card-actions > *:not(:last-child) { margin-right: 8px; }

.v-alert--density-compact.pa-4 { padding: 16px !important; }

/* Community Feed List */
.v-list { background-color: transparent; }
.v-list-item { padding-left: 8px; padding-right: 8px; }
.v-list-item-subtitle { font-size: 0.75rem; }
.v-divider--inset { margin-left: 56px; } /* Align divider with text */

/* Bottom Nav (Optional) */
.bottom-nav .v-btn { min-width: auto; font-size: 0.7rem; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); }
.bottom-nav .v-btn--active { color: rgb(var(--v-theme-primary)); }

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

/* Thêm style cho progress circular trong stat card */
.stat-card .v-progress-circular { margin-bottom: 12px; }
</style>