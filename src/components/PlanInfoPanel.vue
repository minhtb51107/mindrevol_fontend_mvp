<template>
  <v-card class="plan-info-panel d-flex flex-column fill-height" elevation="2" rounded="lg">

    <v-card-item class="pt-4">
      <div class="d-flex justify-space-between align-center">
        <v-card-title class="text-h6 pb-1 font-weight-medium">{{ plan?.title || 'Đang tải...' }}</v-card-title>
        <v-btn
          v-if="isOwner && plan?.status !== 'ARCHIVED'"
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
          @click="$emit('open-edit-dialog')"
          title="Sửa chi tiết kế hoạch"
          :disabled="isLoadingAction"
        ></v-btn>
      </div>
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
      <v-tab value="actions"> <v-icon start>mdi-cog-outline</v-icon>
         Hành động
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
                    :disabled="linkCopied || plan?.status === 'ARCHIVED'" variant="tonal"
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
                <div class="d-flex align-center">
                    <v-chip v-if="member.role === 'OWNER'" color="primary" size="x-small" label class="mr-2">Owner</v-chip>
                    
                    <v-btn
                        v-if="shouldShowNudge(member)"
                        icon="mdi-bell-ring-outline"
                        size="small"
                        variant="text"
                        color="warning"
                        :loading="nudgingMemberId === member.userId"
                        :disabled="recentlyNudged[member.userId]"
                        @click="handleNudge(member)"
                        title="Nhắc nhở check-in"
                    ></v-btn>
                    <v-icon
                        v-else-if="member.userId !== currentUserId && member.hasCheckedInToday"
                        color="success"
                        icon="mdi-check-circle"
                        size="small"
                        class="mr-2"
                        title="Đã check-in hôm nay"
                    ></v-icon>
                    <v-btn
                      v-if="isOwner && member.role !== 'OWNER'"
                      icon="mdi-account-remove-outline"
                      size="x-small"
                      variant="text"
                      color="grey"
                      @click="$emit('remove-member', member)"
                      :loading="isLoadingAction && removingMemberId === member.userId"
                      :disabled="isLoadingAction || plan?.status === 'ARCHIVED'" title="Loại bỏ thành viên"
                    ></v-btn>
                </div>
              </template>
            </v-list-item>
            <v-list-item v-if="!plan?.members?.length" class="text-caption text-medium-emphasis pa-4">
              Chưa có thành viên nào khác.
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="actions">
            <v-list density="compact" class="pa-2">
                <div v-if="isOwner">
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

                      <div v-if="isOwner && plan?.status === 'ARCHIVED'">
                          <v-btn
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
                              @click="$emit('open-delete-dialog')" 
                              :disabled="isLoadingAction"
                              variant="outlined"
                              color="error"
                              block
                              class="mb-3"
                              prepend-icon="mdi-alert-octagon-outline"
                          >
                              Xóa Vĩnh Viễn
                          </v-btn>
                          </div>

                      <v-btn
                          v-if="isOwner && otherMembers.length > 0 && plan?.status !== 'ARCHIVED'"
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
                </div>

                <div v-if="!isOwner">
                   <v-list-subheader>Hành động</v-list-subheader>
                    <div class="px-2">
                       <v-btn
                          @click="$emit('leave-plan')"
                          :loading="isLoadingAction && isLeaving === true"
                          :disabled="isLoadingAction"
                          variant="outlined"
                          color="error"
                          block
                          class="mb-3"
                          prepend-icon="mdi-logout"
                      >
                          Rời khỏi kế hoạch
                      </v-btn>
                   </div>
                </div>
            </v-list>
            <v-alert v-if="error" type="error" density="compact" class="ma-4" rounded="md"> {{ error }} </v-alert>

        </v-window-item>

      </v-window>
    </v-card-text>

  </v-card>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { useAuthStore } from '@/stores/auth';
import planService from '@/api/planService'; // THÊM: Import service để gọi API Nudge
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

// --- State for Tabs & Nudge ---
const tab = ref('info');
const nudgingMemberId = ref(null); // State loading cho nút nudge đang được bấm
const recentlyNudged = reactive({}); // State lưu trữ tạm thời các member đã bị nudge để disable nút

// --- Props ---
const props = defineProps({
  linkCopied: { type: Boolean, default: false },
  linkCopyText: { type: String, default: 'Copy link mời' },
  isLoadingAction: { type: Boolean, default: false },
  isArchiving: { type: Boolean, default: null },
  isLeaving: { type: Boolean, default: false },
  removingMemberId: { type: Number, default: null },
  error: { type: String, default: null }
});

// --- Emits ---
const emit = defineEmits([
    'copy-invite-link', 'archive-plan', 'open-transfer-dialog',
    'remove-member', 'open-edit-dialog', 'leave-plan', 'open-delete-dialog'
]);

// --- Store ---
const planStore = usePlanStore();
const authStore = useAuthStore();

// --- Computed Properties ---
const plan = computed(() => planStore.currentPlan);
const isOwner = computed(() => planStore.isCurrentUserOwner);
const currentUserId = computed(() => authStore.currentUser?.id);

const otherMembers = computed(() => {
    if (!plan.value?.members || !currentUserId.value) return [];
    return plan.value.members.filter(member => member.role !== 'OWNER' && member.userId !== currentUserId.value);
});

const displayStatusText = computed(() => {
  if (!plan.value?.status) return 'N/A';
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
    case 'ARCHIVED': return 'grey-darken-1';
    default: return 'grey';
  }
});

// --- Methods ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
}

const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 0) return '?';
    return names[names.length - 1].charAt(0).toUpperCase();
}

// --- NUDGE LOGIC (MỚI) ---
const shouldShowNudge = (member) => {
    // 1. Không hiện cho chính mình
    if (member.userId === currentUserId.value) return false;
    
    // 2. Kiểm tra xem họ đã check-in hôm nay chưa.
    // LƯU Ý: Backend cần trả về field 'hasCheckedInToday' trong thông tin member của API getPlanDetails.
    // Nếu backend chưa có, nút này có thể sẽ luôn hiện (vì undefined là falsy -> !undefined là true).
    return !member.hasCheckedInToday; 
};

const handleNudge = async (member) => {
    if (!plan.value?.shareableLink) return;
    
    nudgingMemberId.value = member.userId; // Bật trạng thái loading cho nút này
    try {
        await planService.nudgeMember(plan.value.shareableLink, member.userId);
        
        // Hiển thị thông báo thành công (đơn giản dùng alert, hoặc bạn có thể tích hợp toast library)
        alert(`🔔 Đã gửi lời thúc giục đến ${member.userFullName}!`);
        
        // Optimistic update: Đánh dấu là đã nudge để disable nút
        recentlyNudged[member.userId] = true;

    } catch (error) {
        console.error("Lỗi khi nudge:", error);
        const msg = error.response?.data?.message || "Không thể gửi lời nhắc. Vui lòng thử lại sau.";
        alert(msg);
    } finally {
        nudgingMemberId.value = null; // Tắt trạng thái loading
    }
};

</script>

<style scoped>
.plan-info-panel {
  display: flex;
  flex-direction: column;
  max-height: 100%;
}
.text-wrap {
    white-space: normal;
}
</style>