<template>
  <v-container>
    <div v-if="planStore.isLoading" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">Đang tải thông tin kế hoạch...</p>
    </div>

    <v-alert
      v-else-if="planStore.error"
      type="error"
      variant="tonal"
      class="my-5"
      closable
      @click:close="planStore.error = null"
    >
      {{ planStore.error }}
    </v-alert>

    <div v-else-if="planStore.currentPlan">

      <v-card v-if="!planStore.currentPlan.members" class="text-center pa-6 elevation-2">
        <v-card-item>
           <v-icon icon="mdi-account-group-outline" size="48" color="primary" class="mb-4"></v-icon>
          <v-card-title class="text-h5 mb-2">Bạn được mời tham gia!</v-card-title>
        </v-card-item>
        <v-card-text>
          <h2 class="text-h4 mb-3">{{ planStore.currentPlan.title }}</h2>
          <p class="text-medium-emphasis mb-5">{{ planStore.currentPlan.description }}</p>
          <v-list lines="one" density="compact" class="text-left mx-auto" max-width="400">
             <v-list-item prepend-icon="mdi-account-outline">
               <v-list-item-title>Người tạo:</v-list-item-title>
               <v-list-item-subtitle>{{ planStore.currentPlan.creatorFullName }}</v-list-item-subtitle>
             </v-list-item>
             <v-divider inset></v-divider>
             <v-list-item prepend-icon="mdi-calendar-clock-outline">
               <v-list-item-title>Thời lượng:</v-list-item-title>
                <v-list-item-subtitle>{{ planStore.currentPlan.durationInDays }} ngày</v-list-item-subtitle>
             </v-list-item>
             <v-divider inset></v-divider>
             <v-list-item prepend-icon="mdi-account-multiple-outline">
               <v-list-item-title>Đã có:</v-list-item-title>
               <v-list-item-subtitle>{{ planStore.currentPlan.memberCount }} thành viên</v-list-item-subtitle>
             </v-list-item>
           </v-list>
           <v-btn
             @click="handleJoinPlan"
             color="primary"
             size="large"
             :loading="isJoining"
             :disabled="isJoining"
             class="mt-6"
             prepend-icon="mdi-account-plus-outline"
           >
             Tham gia ngay
           </v-btn>
           <v-alert
              v-if="joinError"
              type="error"
              density="compact"
              class="mt-4 mx-auto"
              max-width="400"
              closable
              @click:close="joinError = ''"
            >
              {{ joinError }}
           </v-alert>
        </v-card-text>
      </v-card>

      <v-row v-else g-4>
        <v-col cols="12" lg="4">
          <v-card class="mb-4 elevation-1">
            <v-card-item>
               <v-card-title class="text-h6">{{ planStore.currentPlan.title }}</v-card-title>
               <v-card-subtitle>{{ planStore.currentPlan.description }}</v-card-subtitle>
            </v-card-item>
             <v-divider></v-divider>
            <v-card-text>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-calendar-check-outline" title="Bắt đầu" :subtitle="planStore.currentPlan.startDate"></v-list-item>
                <v-list-item prepend-icon="mdi-calendar-end-outline" title="Kết thúc" :subtitle="planStore.currentPlan.endDate"></v-list-item>
                 <v-list-item prepend-icon="mdi-flag-outline" title="Mục tiêu ngày" :subtitle="planStore.currentPlan.dailyGoal || 'Chưa có'"></v-list-item>
                 <v-list-item prepend-icon="mdi-progress-check" title="Trạng thái">
                    <template v-slot:subtitle>
                         <v-chip :color="statusColor" size="small" label>{{ displayStatusText }}</v-chip>
                    </template>
                 </v-list-item>
               </v-list>
              <v-btn
                @click="copyInviteLink"
                variant="outlined"
                color="success"
                block
                class="mt-3"
                :prepend-icon="linkCopied ? 'mdi-check' : 'mdi-clipboard-check-outline'"
                :disabled="linkCopied"
               >
                {{ linkCopyText }}
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card class="elevation-1">
            <v-list-subheader>Thành viên ({{ planStore.currentPlan.members.length }})</v-list-subheader>
            <v-list lines="one" density="compact">
              <v-list-item
                v-for="member in planStore.currentPlan.members"
                :key="member.userEmail"
                :title="member.userFullName"
                :subtitle="member.userEmail"
                prepend-icon="mdi-account-circle-outline"
              >
                 <template v-slot:append>
                    <v-chip v-if="member.role === 'OWNER'" color="primary" size="small" label>Chủ kế hoạch</v-chip>
                 </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <ProgressDashboard
            v-if="planStore.currentPlan && planStore.currentPlan.shareableLink"
            :shareable-link="planStore.currentPlan.shareableLink"
           />
           <div v-else-if="!planStore.isLoading" class="text-center pa-5 text-medium-emphasis">
              Không thể tải bảng tiến độ (thiếu thông tin link).
            </div>
        </v-col>
      </v-row>
    </div>

     <v-snackbar
      v-model="snackbar"
      :timeout="2000"
      color="success"
      location="top right"
    >
      Đã copy link mời vào clipboard!
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import ProgressDashboard from '@/components/ProgressDashboard.vue';
import {
  VContainer, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardText, VCardItem, VList, VListItem, VListItemTitle, VListItemSubtitle, VListSubheader, VDivider, VBtn, VAlert, VProgressCircular, VIcon, VChip, VSnackbar
} from 'vuetify/components';

const route = useRoute();
const planStore = usePlanStore();

const isJoining = ref(false);
const joinError = ref('');
const linkCopyText = ref('Copy link mời');
const linkCopied = ref(false);
const snackbar = ref(false);

onMounted(() => {
  const shareableLink = route.params.shareableLink;
  if (shareableLink) {
    planStore.fetchPlan(shareableLink);
  }
});

const handleJoinPlan = async () => {
  const linkToJoin = route.params.shareableLink;
  if (!linkToJoin) {
    joinError.value = "Không tìm thấy mã mời.";
    return;
  }
  isJoining.value = true;
  joinError.value = '';
  try {
    await planStore.joinCurrentPlan(linkToJoin);
  } catch (error) {
    joinError.value = error.response?.data?.message || 'Không thể tham gia, vui lòng thử lại.';
  } finally {
    isJoining.value = false;
  }
};

const copyInviteLink = () => {
  if (linkCopied.value) return;
  const link = window.location.href;
  navigator.clipboard.writeText(link).then(() => {
      linkCopyText.value = 'Đã copy!';
      linkCopied.value = true;
      snackbar.value = true;
      setTimeout(() => {
          linkCopyText.value = 'Copy link mời';
          linkCopied.value = false;
      }, 2000);
  });
};

const displayStatusText = computed(() => {
    if (!planStore.currentPlan || !planStore.currentPlan.displayStatus) return 'N/A';
    switch (planStore.currentPlan.displayStatus) {
        case 'ACTIVE': return 'Đang diễn ra';
        case 'COMPLETED': return 'Đã hoàn thành';
        case 'ARCHIVED': return 'Đã lưu trữ';
        default: return planStore.currentPlan.displayStatus;
    }
});

const statusColor = computed(() => {
     if (!planStore.currentPlan || !planStore.currentPlan.displayStatus) return 'grey';
     switch (planStore.currentPlan.displayStatus) {
        case 'ACTIVE': return 'success';
        case 'COMPLETED': return 'primary';
        case 'ARCHIVED': return 'grey';
        default: return 'grey';
     }
});

</script>

<style scoped>
</style>