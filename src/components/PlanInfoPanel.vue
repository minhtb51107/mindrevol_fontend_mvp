<template>
  <v-card class="plan-info-panel d-flex flex-column fill-height" elevation="2" rounded="lg">

    <v-card-item class="pt-4">
      <v-card-title class="text-h6 pb-1 font-weight-medium">{{ plan?.title || 'Đang tải...' }}</v-card-title>
      <v-card-subtitle class="text-wrap">{{ plan?.description }}</v-card-subtitle>
    </v-card-item>

    <v-tabs v-model="tab" color="primary" align-tabs="center" class="mt-2" grow>
      <v-tab value="info">
        <v-icon start>mdi-information-outline</v-icon>
        Chi tiết
      </v-tab>
      <v-tab value="members">
         <v-icon start>mdi-account-group-outline</v-icon>
         Thành viên ({{ plan?.members?.length || 0 }})
      </v-tab>
      <v-tab value="actions" v-if="isOwner">
         <v-icon start>mdi-cog-outline</v-icon>
         Quản lý
      </v-tab>
    </v-tabs>
    
    <v-divider></v-divider>

    <v-card-text class="flex-grow-1 pa-0" style="overflow-y: auto;">
      <v-window v-model="tab">

        <v-window-item value="info">
            <v-container fluid class="pa-4">
              <v-row>
                <v-col cols="6" sm="6">
                  <div class="text-caption text-medium-emphasis">Trạng thái</div>
                  <v-chip :color="statusColor" size="small" label class="mt-1">{{ displayStatusText }}</v-chip>
                </v-col>
                <v-col cols="6" sm="6">
                  <div class="text-caption text-medium-emphasis">Mục tiêu ngày</div>
                  <div class="text-subtitle-1 font-weight-medium mt-1">{{ plan?.dailyGoal || 'Chưa đặt' }}</div>
                </v-col>
                <v-col cols="12" sm="6" class="mt-3">
                    <div class="text-caption text-medium-emphasis d-flex align-center">
                      <v-icon size="small" start>mdi-calendar-check-outline</v-icon>
                      Bắt đầu
                    </div>
                    <div class="text-subtitle-1 font-weight-medium ml-7">{{ plan?.startDate ? formatDate(plan.startDate) : 'N/A' }}</div>
                </v-col>
                <v-col cols="12" sm="6" class="mt-3">
                    <div class="text-caption text-medium-emphasis d-flex align-center">
                      <v-icon size="small" start>mdi-calendar-end-outline</v-icon>
                      Kết thúc
                    </div>
                    <div class="text-subtitle-1 font-weight-medium ml-7">{{ plan?.endDate ? formatDate(plan.endDate) : 'N/A' }}</div>
                </v-col>
              </v-row>
            </v-container>
            
            <v-divider></v-divider>
            
            <div class="pa-4">
                 <v-list-subheader>Chia sẻ kế hoạch</v-list-subheader>
                 <v-btn
                    @click="$emit('copy-invite-link')"
                    :prepend-icon="linkCopied ? 'mdi-check' : 'mdi-clipboard-plus-outline'"
                    :disabled="linkCopied"
                    variant="tonal"
                    color="success"
                    block
                    class="mb-2"
                >
                    {{ linkCopyText }}
                </v-btn>
            </div>
           
            <v-alert v-if="error" type="error" density="compact" class="ma-4" rounded="md"> {{ error }} </v-alert>

        </v-window-item>

        <v-window-item value="members">
          <v-list lines="one" density="compact" class="member-list pa-0">
            <v-list-item
              v-for="member in plan?.members"
              :key="member.userId"
              :title="member.userFullName"
              :subtitle="member.userEmail"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="32" class="mr-3">
                    <span class="text-caption font-weight-medium">{{ getInitials(member.userFullName) }}</span>
                </v-avatar>
              </template>

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
            <v-list-item v-if="!plan?.members?.length" class="text-caption text-medium-emphasis pa-4">
              Chưa có thành viên nào khác.
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="actions" v-if="isOwner">
            <v-list density="compact" class="pa-2">
                <v-list-subheader>Quản lý kế hoạch</v-list-subheader>
                 <div class="px-2">
                     <v-btn
                        v-if="isOwner && plan?.status !== 'ARCHIVED'"
                        @click="$emit('archive-plan', true)"
                        :loading="isLoadingAction && isArchiving === true"
                        :disabled="isLoadingAction"
                        variant="outlined"
                        color="orange"
                        block
                        class="mb-3"
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
                        class="mb-3"
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
                 </div>
            </v-list>
            <v-alert v-if="error" type="error" density="compact" class_alias="ma-4" rounded="md"> {{ error }} </v-alert>

        </v-window-item>

      </v-window>
    </v-card-text>

  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'; // Thêm ref
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

// --- State for Tabs ---
const tab = ref('info'); // Mặc định mở tab 'info'

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

// Hàm mới để lấy chữ cái đầu cho Avatar
const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 0) return '?';
    // Lấy chữ cái đầu của tên (phần tử cuối cùng)
    const lastName = names[names.length - 1];
    return lastName.charAt(0).toUpperCase();
}

</script>

<style scoped>
.plan-info-panel {
  /* Đảm bảo panel chiếm toàn bộ chiều cao và nội dung cuộn bên trong */
  display: flex;
  flex-direction: column;
  max-height: 100%; /* Giới hạn chiều cao */
}

/* Style này không còn cần thiết vì v-card-text bên ngoài đã xử lý
  .member-list {
    flex-grow: 1; 
    overflow-y: auto; 
    max-height: 300px; 
  }
*/

.text-wrap {
    white-space: normal; /* Cho description xuống dòng */
}
</style>