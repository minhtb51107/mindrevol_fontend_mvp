<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h4 class="mb-0">Bảng tiến độ nhóm</h4>
      <button class="btn btn-primary" @click="openCheckInModal">
        <i class="bi bi-check-circle-fill me-2"></i>Check-in hôm nay
      </button>
    </div>
    <div class="card-body">
      <div v-if="progressStore.isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Đang tải dữ liệu tiến độ...</p>
      </div>
      <div v-else-if="progressStore.error" class="alert alert-warning">
        {{ progressStore.error }}
      </div>
      <div v-else-if="progressStore.dashboard" class="table-responsive">
        <table class="table table-bordered table-hover text-center align-middle">
          <thead class="table-light">
            <tr>
              <th class="text-start">Thành viên</th>
              <th v-for="(status, date) in firstMemberDailyStatus" :key="date" class="day-header">
                {{ formatDate(date) }}
              </th>
            </tr>
          </thead>
<tbody>
            <tr v-for="member in progressStore.dashboard.membersProgress" :key="member.userEmail">
              <td class="text-start fw-bold">{{ member.userFullName }}</td>

              <td v-for="(completed, date) in member.dailyStatus" :key="date" 
                  @click="openDetailModal(member.userEmail, date)" 
                  class="progress-cell"
                  :class="{ 'completed': completed }">
                <i 
                  class="bi fs-4" 
                  :class="{ 
                    'bi-check-circle-fill text-success': completed, 
                    'bi-circle text-muted': !completed && isPastOrToday(date),
                    'bi-dash-circle text-light': !isPastOrToday(date)
                  }"
                  :title="completed ? 'Hoàn thành' : 'Chưa hoàn thành'"
                ></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <CheckInModal 
    v-if="isCheckInModalVisible" 
    :shareable-link="shareableLink"
    @close="closeCheckInModal"
  />

  <ProgressDetailModal
    v-if="communityStore.selectedProgress"
    @close="closeDetailModal"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { useCommunityStore } from '@/stores/community'; // <-- THÊM IMPORT
import CheckInModal from '@/components/CheckInModal.vue';
import ProgressDetailModal from '@/components/ProgressDetailModal.vue'; // <-- THÊM IMPORT

const props = defineProps({
  shareableLink: {
    type: String,
    required: true
  }
});

const progressStore = useProgressStore();
const communityStore = useCommunityStore(); // <-- KHỞI TẠO STORE
const isModalVisible = ref(false);

// Lấy dữ liệu của thành viên đầu tiên để render header của bảng
const firstMemberDailyStatus = computed(() => {
  return progressStore.dashboard?.membersProgress[0]?.dailyStatus || {};
});

// Lấy dữ liệu khi component được tạo
onMounted(() => {
  progressStore.fetchDashboard(props.shareableLink);
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const isPastOrToday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bỏ qua giờ, phút, giây
    const date = new Date(dateString);
    return date <= today;
};

const openDetailModal = (memberEmail, date) => {
  const memberProgress = progressStore.dashboard.membersProgress.find(m => m.userEmail === memberEmail);
  if (!memberProgress) return;

  // Lấy data chi tiết thực từ store
  const progressDetail = memberProgress.dailyStatus[date];

  // Chỉ mở modal nếu ngày đó đã có check-in
  if (progressDetail) {
    // Thêm trường 'memberFullName' vào để modal có thể hiển thị
    const fullProgressData = {
      ...progressDetail,
      memberFullName: memberProgress.userFullName,
      date: date,
    };
    communityStore.selectProgress(fullProgressData);
  } else {
    // Nếu không có dữ liệu, không làm gì cả (hoặc có thể mở modal check-in)
    console.log("Chưa có check-in cho ngày này.");
  }
};

const closeDetailModal = () => {
    communityStore.clearSelectedProgress();
};

const isCheckInModalVisible = ref(false); // Đổi tên cho rõ ràng

const openCheckInModal = () => {
  isModalVisible.value = true;
};
const closeCheckInModal = () => {
  isModalVisible.value = false;
};
</script>

<style scoped>
/* File: src/components/ProgressDashboard.vue -> <style scoped> */
.progress-cell {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}
.progress-cell:hover {
  background-color: #f8f9fa;
}
.progress-cell.completed:hover {
    background-color: #d1e7dd;
}
/* ... (CSS cũ) ... */
.day-header {
  min-width: 60px;
}
.fs-4 {
  font-size: 1.25rem;
}
</style>