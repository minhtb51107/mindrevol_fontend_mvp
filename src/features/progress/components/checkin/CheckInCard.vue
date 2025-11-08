<template>
  <div
    v-if="hasAttachments && isActuallyVisible"
    class="checkin-card-modern"
    @click="$emit('click', checkIn)"
  >
    <div class="card-header">
      <span class="card-time">{{ formattedTime }}</span>

      <div class="d-flex align-center btn-wrapper">
        <v-menu v-if="canModify" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="x-small"
              v-bind="props"
              @click.stop
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click.stop="$emit('edit', checkIn)">
              <template v-slot:prepend
                ><v-icon icon="mdi-pencil-outline" size="small"></v-icon
              ></template>
              <v-list-item-title>Sửa</v-list-item-title>
            </v-list-item>
            <v-list-item
              @click.stop="$emit('delete', checkIn)"
              base-color="error"
            >
              <template v-slot:prepend
                ><v-icon icon="mdi-delete-outline" size="small"></v-icon
              ></template>
              <v-list-item-title>Xóa</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          class="toggle-pill-simple"
          density="compact"
          variant="text"
          icon="mdi-image-off-outline"
          size="x-small"
          title="Ẩn ảnh này"
          @click.stop="toggleLocalImage"
        ></v-btn>
      </div>
    </div>

    <div class="card-body">
      <div class="image-container">
        <v-img
          :src="checkIn.attachments[0].fileUrl"
          class="card-image rounded"
          max-height="150px"
          cover
        ></v-img>
      </div>
    </div>

    <div class="stats-footer">
      <v-chip-group class="mr-auto reaction-group" density="compact">
        <v-chip
          size="x-small"
          @click.stop="onToggleReaction('THUMBS_UP')"
          :color="hasMyReaction('THUMBS_UP') ? 'primary' : 'default'"
          variant="tonal"
          class="reaction-chip"
        >
          👍 {{ getReactionCount('THUMBS_UP') }}
        </v-chip>
        <v-chip
          size="x-small"
          @click.stop="onToggleReaction('HEART')"
          :color="hasMyReaction('HEART') ? 'pink' : 'default'"
          variant="tonal"
          class="reaction-chip"
        >
          ❤️ {{ getReactionCount('HEART') }}
        </v-chip>
      </v-chip-group>

      <StatsIcons :check-in="checkIn" />
    </div>
  </div>

  <div v-else class="checkin-card-modern" @click="$emit('click', checkIn)">
    <div class="card-header">
      <span class="card-time">{{ formattedTime }}</span>

      <div class="d-flex align-center btn-wrapper">
        <v-menu v-if="canModify" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="x-small"
              v-bind="props"
              @click.stop
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click.stop="$emit('edit', checkIn)">
              <template v-slot:prepend
                ><v-icon icon="mdi-pencil-outline" size="small"></v-icon
              ></template>
              <v-list-item-title>Sửa</v-list-item-title>
            </v-list-item>
            <v-list-item
              @click.stop="$emit('delete', checkIn)"
              base-color="error"
            >
              <template v-slot:prepend
                ><v-icon icon="mdi-delete-outline" size="small"></v-icon
              ></template>
              <v-list-item-title>Xóa</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          v-if="hasAttachments"
          class="toggle-pill-simple"
          density="compact"
          variant="text"
          icon="mdi-image-outline"
          size="x-small"
          title="Hiện ảnh này"
          @click.stop="toggleLocalImage"
        ></v-btn>
      </div>
    </div>

    <div class="card-body">
      <div class="text-content">
        <p
          v-if="checkIn.completedTasks?.length > 0"
          class="card-title text-truncate-2"
          :title="checkIn.completedTasks[0].description"
        >
          {{ checkIn.completedTasks[0].description }}
        </p>
        <p
          v-if="checkIn.notes"
          class="card-notes text-truncate-2"
          :title="checkIn.notes"
        >
          {{ checkIn.notes }}
        </p>
        <p
          v-if="checkIn.completedTasks?.length === 0 && !checkIn.notes"
          class="card-notes text-truncate-2 text-medium-emphasis"
        >
          (Không có ghi chú)
        </p>
      </div>
    </div>

    <div class="stats-footer">
      <v-chip-group class="mr-auto reaction-group" density="compact">
        <v-chip
          size="x-small"
          @click.stop="onToggleReaction('THUMBS_UP')"
          :color="hasMyReaction('THUMBS_UP') ? 'primary' : 'default'"
          variant="tonal"
          class="reaction-chip"
        >
          👍 {{ getReactionCount('THUMBS_UP') }}
        </v-chip>
        <v-chip
          size="x-small"
          @click.stop="onToggleReaction('HEART')"
          :color="hasMyReaction('HEART') ? 'pink' : 'default'"
          variant="tonal"
          class="reaction-chip"
        >
          ❤️ {{ getReactionCount('HEART') }}
        </v-chip>
      </v-chip-group>

      <StatsIcons :check-in="checkIn" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, defineComponent } from 'vue';
// [CẬP NHẬT] Store
import { useAuthStore } from '@/features/auth/stores/authStore';
import dayjs from 'dayjs';
import {
  VBtn,
  VMenu,
  VList,
  VListItem,
  VListItemTitle,
  VIcon,
  VImg,
  VChipGroup,
  VChip,
} from 'vuetify/components';

// Component con nội bộ để hiển thị các icon stats (tránh lặp code)
const StatsIcons = defineComponent({
  props: ['checkIn'],
  template: `
    <span v-if="checkIn.completedTasks?.length > 0" :title="\`\${checkIn.completedTasks.length} task\`" class="stat-item">
      <v-icon size="small">mdi-check-all</v-icon>
      {{ checkIn.completedTasks.length }}
    </span>
    <span v-if="checkIn.attachments?.length > 0" :title="\`\${checkIn.attachments.length} ảnh\`" class="stat-item">
      <v-icon size="small">mdi-image</v-icon>
      {{ checkIn.attachments.length }}
    </span>
    <span v-if="checkIn.links?.length > 0" :title="\`\${checkIn.links.length} link\`" class="stat-item">
      <v-icon size="small">mdi-link-variant</v-icon>
      {{ checkIn.links.length }}
    </span>
    <span v-if="checkIn.commentCount > 0" :title="\`\${checkIn.commentCount} bình luận\`" class="stat-item">
      <v-icon size="small">mdi-comment-outline</v-icon>
      {{ checkIn.commentCount }}
    </span>
  `,
  components: { VIcon },
});

const props = defineProps({
  checkIn: { type: Object, required: true },
  showImagesGlobal: { type: Boolean, default: true },
});

const emit = defineEmits(['click', 'edit', 'delete', 'toggle-reaction']);
const authStore = useAuthStore();

const localImageOverride = ref(null); // null: theo global, true: hiện, false: ẩn

const hasAttachments = computed(
  () => props.checkIn.attachments && props.checkIn.attachments.length > 0
);
const formattedTime = computed(() =>
  dayjs(props.checkIn.checkInTimestamp).format('HH:mm')
);
const canModify = computed(() => {
  if (!props.checkIn || !authStore.currentUser) return false;
  // Cho phép sửa trong vòng 24h
  return (
    props.checkIn.member?.userId === authStore.currentUser.id &&
    dayjs().diff(props.checkIn.checkInTimestamp, 'hour') < 24
  );
});

// Logic hiển thị ảnh: ưu tiên local override, nếu không có thì theo global
const isActuallyVisible = computed(() => {
  if (localImageOverride.value !== null) {
    return localImageOverride.value;
  }
  return props.showImagesGlobal;
});

const toggleLocalImage = () => {
  // Nếu đang null (theo global), đảo ngược global. Nếu đã có override, đảo ngược override.
  localImageOverride.value = !isActuallyVisible.value;
};

// --- Reaction Helpers ---
const getReactionCount = (type) => {
  const r = props.checkIn.reactions?.find((r) => r.type === type);
  return r ? r.count : 0;
};
const hasMyReaction = (type) => {
  const r = props.checkIn.reactions?.find((r) => r.type === type);
  return r ? r.hasCurrentUserReacted : false;
};
const onToggleReaction = (type) => {
  emit('toggle-reaction', props.checkIn.id, type);
};
</script>

<style scoped>
/* Move CSS related to .checkin-card-modern from TimelineDashboard.vue here */
.checkin-card-modern {
  display: flex;
  flex-direction: column;
  border-radius: 12px; /* Bo tròn mềm mại hơn */
  background-color: rgba(var(--v-theme-surface), 0.6); /* Nền trong suốt nhẹ */
  backdrop-filter: blur(8px); /* Hiệu ứng kính nhẹ cho bản thân card */
  border: 1px solid rgba(var(--v-theme-border), 0.15);
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  overflow: hidden; /* Đảm bảo nội dung không tràn ra ngoài bo góc */
}

.checkin-card-modern:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--v-theme-primary), 0.4);
  background-color: rgba(var(--v-theme-surface), 0.8);
}

/* 1. Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px 4px 10px;
}
.card-time {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  letter-spacing: 0.5px;
}
.btn-wrapper {
  margin-left: auto;
}
.toggle-pill-simple.v-btn {
  color: rgba(var(--v-theme-on-surface), 0.5);
  opacity: 0.7;
  width: 24px;
  height: 24px;
}
.toggle-pill-simple.v-btn:hover {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* 2. Body */
.card-body {
  padding: 0 10px 10px 10px;
  min-height: 40px;
}
.card-image.v-img {
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-border), 0.08);
}
.text-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(var(--v-theme-on-surface));
}
.card-notes {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.4;
}
/* Tiện ích cắt dòng */
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* 3. Footer */
.stats-footer {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background-color: rgba(
    var(--v-theme-on-surface),
    0.02
  ); /* Nền footer tách biệt nhẹ */
  border-top: 1px solid rgba(var(--v-theme-border), 0.08);
}
.reaction-group {
  flex-grow: 1;
  margin-right: auto;
}
.reaction-chip {
  margin: 0 4px 0 0 !important;
  font-weight: 500;
  border: 1px solid transparent; /* Tránh nhảy layout khi hover */
}
.reaction-chip:hover {
  border-color: currentColor;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: 8px;
}
</style>