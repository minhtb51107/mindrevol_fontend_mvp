<template>
  <div class="check-in-detail-card">
    <div class="d-flex align-center mb-3">
      <v-avatar size="40" class="mr-3" :color="authorColor">
        <v-img v-if="checkIn.authorAvatar" :src="checkIn.authorAvatar" :alt="authorFullName"></v-img>
        <span v-else class="text-h6">{{ authorInitial }}</span>
      </v-avatar>
      <div>
        <div class="font-weight-bold">{{ authorFullName }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ formatTimestamp(checkIn.checkInTimestamp) }}
          <span v-if="isEdited" class="font-italic"> (đã chỉnh sửa)</span>
        </div>
      </div>
      <v-spacer></v-spacer>
      </div>

    <div v-if="checkIn.notes" class="check-in-notes text-body-1 mb-4" style="white-space: pre-wrap; word-break: break-word;">
      <p>{{ checkIn.notes }}</p>
    </div>
    
    <div v-if="checkIn.completedTasks && checkIn.completedTasks.length > 0" class="mb-4">
      <p class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center">
        <v-icon icon="mdi-check-all" color="success" size="small" class="mr-2"></v-icon>
        Công việc đã hoàn thành:
      </p>
      <v-chip-group column>
        <v-chip
          v-for="task in checkIn.completedTasks"
          :key="task.taskId || task.description"
          color="success"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          {{ task.description }}
        </v-chip>
      </v-chip-group>
    </div>

    <div v-if="checkIn.links && checkIn.links.length > 0" class="mb-4">
      <p class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center">
        <v-icon icon="mdi-link-variant" color="primary" size="small" class="mr-2"></v-icon>
        Liên kết minh chứng:
      </p>
      <div v-for="(link, index) in checkIn.links" :key="index" class="link-item">
        <v-btn
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          variant="text"
          color="primary"
          prepend-icon="mdi-open-in-new"
          density="compact"
          class="pa-0"
          style="text-transform: none; text-align: left; height: auto;"
        >
          <span class="text-truncate" style="max-width: 300px;">{{ link }}</span>
        </v-btn>
      </div>
    </div>

    <div v-if="checkIn.attachments && checkIn.attachments.length > 0" class="image-gallery">
      <v-row dense>
        <v-col
          v-for="(att, index) in checkIn.attachments"
          :key="att.id"
          :cols="imageCols"
        >
          <v-img
            :src="att.fileUrl"
            :alt="att.originalFilename"
            aspect-ratio="1"
            class="bg-grey-lighten-2 rounded"
            cover
            @click="openImage(index)"
            style="cursor: pointer;"
          >
            <template v-slot:placeholder>
              <v-sheet class="fill-height d-flex align-center justify-center">
                <v-progress-circular indeterminate color="grey-lighten-2"></v-progress-circular>
              </v-sheet>
            </template>
          </v-img>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="lightbox" max-width="900px" max-height="90vh">
      <v-card>
        <v-card-text class="pa-0">
          <v-carousel v-model="currentImageIndex" hide-delimiters show-arrows="hover">
            <v-carousel-item
              v-for="att in checkIn.attachments"
              :key="att.id"
              :src="att.fileUrl"
              contain
            ></v-carousel-item>
          </v-carousel>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { 
  VAvatar, VImg, VIcon, VChipGroup, VChip, VRow, VCol, 
  VDialog, VCard, VCardText, VCarousel, VCarouselItem, 
  VBtn, VSpacer, VProgressCircular, VSheet
} from 'vuetify/components';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const props = defineProps({
  checkIn: {
    type: Object,
    required: true
  }
});

// Lightbox state
const lightbox = ref(false);
const currentImageIndex = ref(0);

// Computed properties
const authorFullName = computed(() => props.checkIn?.author?.userFullName || props.checkIn?.authorFullName || 'Người dùng');
const authorInitial = computed(() => authorFullName.value?.charAt(0).toUpperCase() || '?');
const authorColor = computed(() => {
  // Simple hash color for avatar
  if (props.checkIn?.authorAvatar) return 'transparent';
  const colors = ['primary', 'secondary', 'accent', 'teal', 'purple-darken-1', 'orange-darken-1'];
  const hash = authorFullName.value.charCodeAt(0) % colors.length;
  return colors[hash] || 'grey-lighten-1';
});

const isEdited = computed(() => {
  // Check if createdAt and updatedAt are different (with a 1-minute threshold)
  if (!props.checkIn.createdAt || !props.checkIn.updatedAt) return false;
  return dayjs(props.checkIn.updatedAt).diff(dayjs(props.checkIn.createdAt), 'minute') > 1;
});

const imageCols = computed(() => {
  const count = props.checkIn.attachments?.length || 0;
  if (count === 1) return 12;
  if (count === 2) return 6;
  if (count === 3) return 4;
  if (count === 4) return 6; // 2x2 grid
  return 4; // 3xN grid
});

// Methods
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  return dayjs(timestamp).diff(dayjs(), 'hour') > -24 
    ? dayjs(timestamp).fromNow() 
    : dayjs(timestamp).format('HH:mm, DD/MM/YYYY');
};

const openImage = (index) => {
  currentImageIndex.value = index;
  lightbox.value = true;
};
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
  vertical-align: bottom;
}
.v-btn--variant-text {
  /* Căn chỉnh lại button link */
  justify-content: flex-start;
}
</style>