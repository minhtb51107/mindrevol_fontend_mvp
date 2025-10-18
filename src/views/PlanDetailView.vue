<template>
  <div>
    <div v-if="planStore.isLoading" class="text-center mt-5">
            <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Đang tải thông tin kế hoạch...</p>
    </div>

    <div v-else-if="planStore.error" class="alert alert-danger">
      {{ planStore.error }}
    </div>

    <div v-else-if="planStore.currentPlan">
      
      <div v-if="!planStore.currentPlan.members" class="card text-center">
        <div class="card-header">
          <h5 class="card-title mb-0">Bạn được mời tham gia một kế hoạch học tập!</h5>
        </div>
        <div class="card-body">
          <h2 class="card-title">{{ planStore.currentPlan.title }}</h2>
          <p class="card-text text-muted">{{ planStore.currentPlan.description }}</p>
          <ul class="list-group list-group-flush my-4">
            <li class="list-group-item"><strong>Người tạo:</strong> {{ planStore.currentPlan.creatorFullName }}</li>
            <li class="list-group-item"><strong>Thời lượng:</strong> {{ planStore.currentPlan.durationInDays }} ngày</li>
            <li class="list-group-item"><strong>Đã có:</strong> {{ planStore.currentPlan.memberCount }} thành viên</li>
          </ul>
          <button @click="handleJoinPlan" class="btn btn-primary btn-lg" :disabled="isJoining">
            <span v-if="isJoining" class="spinner-border spinner-border-sm"></span>
            <span v-else><i class="bi bi-person-plus-fill me-2"></i>Tham gia ngay</span>
          </button>
          <p v-if="joinError" class="text-danger mt-2 small">{{ joinError }}</p>
        </div>
      </div>

      <div v-else>
              <div class="row g-4">
          <div class="col-lg-4">
            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">{{ planStore.currentPlan.title }}</h5>
                <p class="text-muted">{{ planStore.currentPlan.description }}</p>
                <hr>
                <p><strong><i class="bi bi-calendar-check me-2"></i>Bắt đầu:</strong> {{ planStore.currentPlan.startDate }}</p>
                <p><strong><i class="bi bi-calendar-x me-2"></i>Kết thúc:</strong> {{ planStore.currentPlan.endDate }}</p>
                <p><strong><i class="bi bi-flag me-2"></i>Mục tiêu ngày:</strong> {{ planStore.currentPlan.dailyGoal || 'Chưa có' }}</p>
                <div class="d-grid mt-3">
                  <button @click="copyInviteLink" class="btn btn-outline-success">
                    <i class="bi bi-clipboard-check me-2"></i>{{ linkCopyText }}
                  </button>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                Thành viên ({{ planStore.currentPlan.members.length }})
              </div>
              <ul class="list-group list-group-flush">
                <li v-for="member in planStore.currentPlan.members" :key="member.userEmail" class="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i class="bi bi-person-circle me-2"></i>
                    {{ member.userFullName }}
                  </span>
                  <span v-if="member.role === 'OWNER'" class="badge bg-primary rounded-pill">Chủ kế hoạch</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="col-lg-8">
            <ProgressDashboard :shareable-link="planStore.currentPlan.shareableLink" />
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import ProgressDashboard from '@/components/ProgressDashboard.vue';

const route = useRoute();
const planStore = usePlanStore();

const isJoining = ref(false);
const joinError = ref('');
const linkCopyText = ref('Copy link mời');

// Khi component được tải, gọi action để fetch dữ liệu
onMounted(() => {
  const shareableLink = route.params.shareableLink;
  if (shareableLink) {
    planStore.fetchPlan(shareableLink);
  }
});

// --- BẮT ĐẦU SỬA LỖI ---
const handleJoinPlan = async () => {
  // 1. Lấy link trực tiếp từ route, đây là nguồn tin cậy
  const linkToJoin = route.params.shareableLink;

  // 2. Thêm rào chắn để đảm bảo link tồn tại
  if (!linkToJoin) {
    joinError.value = "Không tìm thấy mã mời. Vui lòng kiểm tra lại đường dẫn.";
    return;
  }
  
  isJoining.value = true;
  joinError.value = '';
  try {
    // 3. Truyền link vào hàm store
    await planStore.joinCurrentPlan(linkToJoin);
    // Giao diện sẽ tự động cập nhật vì state 'currentPlan' đã thay đổi
  } catch (error) {
    joinError.value = error.response?.data?.message || 'Không thể tham gia, vui lòng thử lại.';
  } finally {
    isJoining.value = false;
  }
};
// --- KẾT THÚC SỬA LỖI ---

const copyInviteLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        linkCopyText.value = 'Đã copy!';
        setTimeout(() => {
            linkCopyText.value = 'Copy link mời';
        }, 2000);
    });
};
</script>