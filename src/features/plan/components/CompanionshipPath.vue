<template>
  <v-sheet class="pa-4 companionship-path" rounded="lg" border>
    <h3 class="text-subtitle-1 font-weight-bold mb-4">Con Đường Đồng Hành</h3>
    
    <div v-if="isLoading" class="d-flex justify-center py-3">
      <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
    </div>

    <div v-else-if="planDuration > 0" class="path-container">
      <div class="path-line"></div>
      
      <div class="day-marker-end" :style="{ left: '100%' }">
        <v-icon size="small">mdi-flag-checkered</v-icon>
        <span class="day-label">Ngày {{ planDuration }}</span>
      </div>

      <v-tooltip 
        v-for="member in members" 
        :key="member.userId" 
        :text="`${member.fullName} (Ngày ${member.currentDay})`"
        location="top"
      >
        <template v-slot:activator="{ props }">
          <div 
            v-bind="props"
            class="member-avatar-wrapper"
            :style="getMemberPosition(member.currentDay)"
          >
            <v-avatar size="36" :color="member.photoUrl ? undefined : 'primary'">
              <v-img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName"></v-img>
              <span v-else class="text-caption font-weight-bold">{{ getInitials(member.fullName) }}</span>
            </v-avatar>
          </div>
        </template>
      </v-tooltip>
    </div>

    <div v-else class="text-medium-emphasis text-caption">
      Hành trình này chưa có thời gian (số ngày) cụ thể.
    </div>
  </v-sheet>
</template>

<script setup>
import { 
  VSheet, VAvatar, VProgressCircular, VTooltip, VIcon, VImg 
} from 'vuetify/components';

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  },
  planDuration: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

// Tính toán vị trí avatar trên thanh
const getMemberPosition = (currentDay) => {
  if (props.planDuration === 0) return { left: '0%' };
  const progressPercentage = (currentDay / props.planDuration) * 100;
  const leftPosition = Math.min(Math.max(progressPercentage, 0), 100);
  return {
    left: `${leftPosition}%`
  };
};

// Hàm lấy chữ cái đầu
const getInitials = (fullName) => {
  if (!fullName) return '?';
  const names = fullName.trim().split(' ');
  if (names.length === 0) return '?';
  const lastName = names[names.length - 1];
  return lastName.charAt(0).toUpperCase();
};
</script>

<style scoped>
.companionship-path {
  background-color: rgba(var(--v-theme-surface), 0.9);
}
.path-container {
  position: relative;
  height: 40px; /* Chứa avatar */
  width: 100%;
  padding: 0 18px; /* Bằng 1/2 size avatar */
  box-sizing: border-box;
  margin-top: 10px;
}
.path-line {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background-color: rgba(var(--v-border-color), 0.5);
  width: calc(100% - 36px); /* Trừ 2 bên padding */
  left: 18px;
  border-radius: 2px;
}
.member-avatar-wrapper {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%); /* Căn giữa avatar */
  transition: left 0.5s ease-in-out;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 2;
}
.member-avatar-wrapper .v-avatar {
  cursor: pointer;
}
.day-marker-end {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(var(--v-theme-on-surface), 0.6);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -10px; /* Nâng icon lên trên đường 1 chút */
}
.day-marker-end .day-label {
  font-size: 0.7rem;
  margin-top: 18px; /* Đẩy text xuống dưới đường */
}
</style>