<template>
  <v-card class="plan-info-panel fill-height" elevation="1">
    <v-card-item>
      <v-card-title class="text-h6 pb-1">{{ plan?.title || 'Đang tải...' }}</v-card-title>
      <v-card-subtitle class="text-wrap">{{ plan?.description }}</v-card-subtitle>
    </v-card-item>
    <v-divider></v-divider>
    <v-card-text>
      <v-list density="compact" class="py-0">
        <v-list-item prepend-icon="mdi-calendar-check-outline" title="Bắt đầu" :subtitle="plan?.startDate ? formatDate(plan.startDate) : 'N/A'"></v-list-item>
        <v-list-item prepend-icon="mdi-calendar-end-outline" title="Kết thúc" :subtitle="plan?.endDate ? formatDate(plan.endDate) : 'N/A'"></v-list-item>
        <v-list-item prepend-icon="mdi-flag-outline" title="Mục tiêu ngày" :subtitle="plan?.dailyGoal || 'Chưa đặt'"></v-list-item>
        <v-list-item prepend-icon="mdi-progress-check" title="Trạng thái">
          <template v-slot:subtitle>
            <v-chip :color="statusColor" size="small" label>{{ displayStatusText }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-divider></v-divider>

    <v-card-text>
        <v-btn
          @click="$emit('copy-invite-link')"
          :prepend-icon="linkCopied ? 'mdi-check' : 'mdi-clipboard-check-outline'"
          :disabled="linkCopied"
          variant="outlined"
          color="success"
          block
          class="mb-2"
        >
          {{ linkCopyText }}
        </v-btn>
        <v-btn
          v-if="isOwner && plan?.status !== 'ARCHIVED'"
          @click="$emit('archive-plan', true)"
          :loading="isLoadingAction && isArchiving === true"
          :disabled="isLoadingAction"
          variant="outlined"
          color="orange"
          block
          class="mb-2"
          prepend-icon="mdi-archive-arrow-down-outline"
        >
          Lưu trữ Kế hoạch
        </v-btn>
        <v-btn
          v-if="isOwner && plan?.status === 'ARCHIVED'"
          @click="$emit('archive-plan', false)"
          :loading="isLoadingAction && isArchiving === false"
          :disabled="isLoadingAction"
          variant="outlined"
          color="blue"
          block
          class="mb-2"
          prepend-icon="mdi-archive-arrow-up-outline"
        >
          Khôi phục Kế hoạch
        </v-btn>
        <v-btn
          v-if="isOwner && otherMembers.length > 0"
          @click="$emit('open-transfer-dialog')"
          :disabled="isLoadingAction"
          variant="outlined"
          color="deep-purple"
          block
          prepend-icon="mdi-crown-outline"
        >
          Chuyển quyền sở hữu
        </v-btn>
        </v-card-text>
    <v-divider></v-divider>

    <v-list-subheader>Thành viên ({{ plan?.members?.length || 0 }})</v-list-subheader>
    <v-list lines="one" density="compact" class="member-list pa-0">
        <v-list-item
        v-for="member in plan?.members"
        :key="member.userId"
        :title="member.userFullName"
        :subtitle="member.userEmail"
        prepend-icon="mdi-account-circle-outline"
      >
        <template v-slot:append>
          <v-chip v-if="member.role === 'OWNER'" color="primary" size="x-small" label class="mr-1">Owner</v-chip>
           <v-btn
            v-if="isOwner && member.role !== 'OWNER'"
            icon="mdi-account-remove-outline"
            size="x-small"
            variant="text"
            color="grey"
            @click="$emit('remove-member', member)"
            :loading="isLoadingAction && removingMemberId === member.userId"
            :disabled="isLoadingAction"
            title="Loại bỏ thành viên"
          ></v-btn>
        </template>
      </v-list-item>
       <v-list-item v-if="!plan?.members?.length" class="text-caption text-medium-emphasis">
            Chưa có thành viên nào khác.
       </v-list-item>
    </v-list>
     <v-alert v-if="error" type="error" density="compact" class="ma-2"> {{ error }} </v-alert>

  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

// --- Props ---
// Props để nhận trạng thái copy link và loading từ component cha (PlanDetailView)
const props = defineProps({
  linkCopied: {
    type: Boolean,
    default: false
  },
  linkCopyText: {
    type: String,
    default: 'Copy link mời'
  },
  isLoadingAction: { // Loading chung cho các action (archive, remove member...)
      type: Boolean,
      default: false
  },
  isArchiving: { // Trạng thái đang archive hay unarchive
      type: Boolean,
      default: null // null, true (archiving), false (unarchiving)
  },
  removingMemberId: { // ID của member đang bị xóa
      type: Number,
      default: null
  },
  error: { // Error chung từ PlanDetailView
      type: String,
      default: null
  }
});

// --- Emits ---
// Định nghĩa các sự kiện component này sẽ phát ra để PlanDetailView xử lý
const emit = defineEmits([
    'copy-invite-link',
    'archive-plan', // Gửi kèm payload true (archive) hoặc false (unarchive)
    'open-transfer-dialog',
    'remove-member' // Gửi kèm thông tin member cần xóa
]);

// --- Store ---
const planStore = usePlanStore();
const authStore = useAuthStore();

// --- Computed Properties ---
const plan = computed(() => planStore.currentPlan);
const isOwner = computed(() => planStore.isCurrentUserOwner);
const currentUserId = computed(() => authStore.currentUser?.id);

// Lấy danh sách thành viên khác để kiểm tra xem có hiển thị nút chuyển quyền không
const otherMembers = computed(() => {
    if (!plan.value?.members || !currentUserId.value) return [];
    return plan.value.members.filter(member => member.role !== 'OWNER' && member.userId !== currentUserId.value);
});

// Trạng thái hiển thị và màu sắc (giống PlanDetailView cũ)
const displayStatusText = computed(() => {
  if (!plan.value?.status) return 'N/A';
  // Sử dụng displayStatus nếu backend cung cấp, nếu không thì tự tính
  const status = plan.value.displayStatus || plan.value.status;
  switch (status) {
    case 'ACTIVE': return 'Đang diễn ra';
    case 'COMPLETED': return 'Hoàn thành';
    case 'ARCHIVED': return 'Đã lưu trữ';
    default: return status;
  }
});

const statusColor = computed(() => {
   if (!plan.value?.status) return 'grey';
   const status = plan.value.displayStatus || plan.value.status;
   switch (status) {
    case 'ACTIVE': return 'success';
    case 'COMPLETED': return 'primary';
    case 'ARCHIVED': return 'grey-darken-1'; // Màu xám đậm hơn cho Archived
    default: return 'grey';
  }
});

// --- Methods ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
}

</script>

<style scoped>
.plan-info-panel {
  display: flex;
  flex-direction: column;
}
.member-list {
  flex-grow: 1; /* Cho phép list member chiếm hết chiều cao còn lại */
  overflow-y: auto; /* Thêm cuộn nếu list dài */
  max-height: 300px; /* Giới hạn chiều cao tối đa (tùy chỉnh) */
}
.text-wrap {
    white-space: normal; /* Cho description xuống dòng */
}
</style>