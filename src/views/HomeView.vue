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
    <div class="d-flex flex-wrap justify-space-between align-center mb-4 gap-3"> <h3 class="text-h6 me-auto">Các kế hoạch của bạn</h3> <v-text-field
            :model-value="planStore.getSearchTerm"
            @update:model-value="handleSearchInput"
            label="Tìm theo tên kế hoạch..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="search-field"
            style="max-width: 300px;"
        ></v-text-field>
        <div class="d-flex align-center"> <v-chip-group
           v-model="selectedStatusFilter"
           mandatory
           selected-class="text-primary"
           density="compact"
           class="me-1 filter-chips"
         >
           <v-chip value="ALL" size="small">Tất cả</v-chip>
           <v-chip value="ACTIVE" size="small">Đang diễn ra</v-chip>
           <v-chip value="COMPLETED" size="small">Hoàn thành</v-chip>
           <v-chip value="ARCHIVED" size="small">Lưu trữ</v-chip>
         </v-chip-group>
         <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshUserPlans" :loading="planStore.isUserPlansLoading"></v-btn>
       </div>
    </div>

    <div v-if="planStore.isUserPlansLoading" class="text-center py-5">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-alert v-else-if="planStore.userPlansError" type="warning" variant="tonal" density="compact" class="mb-4">
        {{ planStore.userPlansError }}
    </v-alert>
    <v-alert v-else-if="!planStore.userPlans.length && !planStore.searchTerm" type="info" variant="tonal" density="compact"> Bạn chưa tham gia kế hoạch nào. Hãy tạo một kế hoạch mới!
    </v-alert>
    <v-alert v-else-if="!filteredPlans.length" type="info" variant="tonal" density="compact">
      Không có kế hoạch nào khớp với tìm kiếm{{ selectedStatusFilter !== 'ALL' ? ` và bộ lọc "${getFilterText(selectedStatusFilter)}"` : '' }}.
    </v-alert>


    <v-row v-else>
       <v-col v-for="plan in filteredPlans" :key="plan.id" cols="12" md="6" lg="4">
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
import { computed, onMounted, ref, watch } from 'vue'; // Thêm watch
import { useAuthStore } from '@/stores/auth';
import { usePlanStore } from '@/stores/plan';
import {
  VSheet, VDivider, VBtn, VAlert, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VCardActions, VChip, VIcon, VSpacer, VProgressCircular,
  VChipGroup, VTextField // *** THÊM IMPORT VTextField ***
} from 'vuetify/components';

const authStore = useAuthStore();
const planStore = usePlanStore();

const selectedStatusFilter = ref('ACTIVE'); // Mặc định hiển thị plan đang hoạt động
// Không cần searchTerm ở đây vì nó được quản lý trong store

const userFullName = computed(() => {
  return authStore.currentUser?.fullname || 'bạn';
});

// Computed property để lọc plan (giữ nguyên logic lọc status)
// Logic lọc theo searchTerm sẽ nằm trong API call (backend)
const filteredPlans = computed(() => {
  if (!planStore.userPlans) return [];
  if (selectedStatusFilter.value === 'ALL') {
    return planStore.userPlans; // Trả về toàn bộ danh sách đã fetch (đã được lọc bởi searchTerm ở backend)
  }
  // Lọc thêm theo status trên frontend từ danh sách đã nhận được
  return planStore.userPlans.filter(plan => plan.displayStatus === selectedStatusFilter.value);
});

onMounted(() => {
  planStore.initDebouncedFetch(); // Khởi tạo hàm debounce
  // Fetch lần đầu khi component mount (không cần searchTerm)
  if (!planStore.userPlans.length && !planStore.isUserPlansLoading) {
       planStore.fetchUserPlans(''); // Truyền chuỗi rỗng
   }
});

// *** HÀM XỬ LÝ INPUT TÌM KIẾM ***
const handleSearchInput = (value) => {
    // Gọi action triggerDebouncedFetch từ store
    planStore.triggerDebouncedFetch(value || ''); // Gửi '' nếu value là null/undefined (khi clear)
};

// *** WATCHER ĐỂ FETCH LẠI KHI FILTER THAY ĐỔI ***
watch(selectedStatusFilter, (newStatus) => {
    // Không cần debounce khi thay đổi filter, fetch ngay lập tức
    // Nhưng vẫn cần truyền searchTerm hiện tại vào fetch
    planStore.fetchUserPlans(planStore.searchTerm);
});

const refreshUserPlans = () => {
    // Khi refresh, giữ nguyên searchTerm và filter hiện tại
    planStore.fetchUserPlans(planStore.searchTerm);
}

// ... (các hàm getStatusText, getFilterText, getStatusColor, formatDate, formatDateRange giữ nguyên) ...
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
}
/* Responsive layout for controls */
.gap-3 {
    gap: 12px; /* Add gap between elements when wrapped */
}
/* Ensure search field doesn't take full width on small screens */
.search-field {
    flex-grow: 1; /* Allow it to grow */
    min-width: 200px; /* Minimum width */
}
/* Ensure chip group scrolls on small screens */
.filter-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: calc(100% - 40px); /* Adjust based on refresh button size */
}

@media (max-width: 600px) {
  .search-field {
    max-width: 100%; /* Allow full width on small screens */
    order: -1; /* Move search to top on wrap */
    margin-bottom: 8px; /* Add space below when wrapped */
  }
  .filter-chips {
       max-width: 100%;
  }
}
</style>