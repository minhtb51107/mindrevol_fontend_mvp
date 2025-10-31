<template>
  <div v-if="checkIn">
    <div v-if="checkIn.notes" class="mb-4">
      <p class="text-subtitle-2 font-weight-medium mb-1">
        <v-icon size="small" color="info" class="mr-1">mdi-note-text-outline</v-icon>
        Ghi chú
      </p>
      <v-card variant="tonal" color="info" density="compact">
        <v-card-text class="text-body-2">{{ checkIn.notes }}</v-card-text>
      </v-card>
    </div>

    <div v-if="checkIn.completedTasks?.length > 0" class="mb-4">
      <p class="text-subtitle-2 font-weight-medium mb-2">
        <v-icon size="small" color="success" class="mr-1">mdi-check-all</v-icon>
        Công việc đã hoàn thành
      </p>
      <v-list density="compact" lines="one" class="bg-transparent pa-0">
        <v-list-item 
          v-for="task in checkIn.completedTasks" 
          :key="task.taskId" 
          :title="task.description" 
          class="text-on-surface mb-1 rounded"
          style="background-color: rgba(var(--v-theme-success), 0.1);"
        >
          <template v-slot:prepend>
            <v-icon color="success">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div v-if="checkIn.attachments?.length > 0">
      <p class="text-subtitle-2 font-weight-medium mb-2">
        <v-icon size="small" color="secondary" class="mr-1">mdi-image-multiple-outline</v-icon>
        Hình ảnh/Tệp đính kèm
      </p>
      <v-row dense>
        <v-col v-for="(att, index) in checkIn.attachments" :key="index" cols="6" sm="4">
          <v-img
            :src="att.fileUrl"
            :alt="att.originalFilename || 'Attachment'"
            aspect-ratio="1"
            cover
            class="rounded border cursor-pointer"
            @click="previewImage(att.fileUrl)"
          >
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
              </div>
            </template>
          </v-img>
        </v-col>
      </v-row>
    </div>

    <v-divider class="my-4"></v-divider>
    <div>
      <p class="text-subtitle-2 font-weight-medium mb-2">
        <v-icon size="small" color="warning" class="mr-1">mdi-comment-text-multiple-outline</v-icon>
        Tương tác (Sắp có)
      </p>
      <div class="d-flex align-center text-medium-emphasis">
        <v-btn icon="mdi-emoticon-happy-outline" variant="text" size="small"></v-btn>
        <v-text-field
          density="compact"
          variant="outlined"
          placeholder="Viết bình luận..."
          hide-details
          disabled
        ></v-text-field>
      </div>
    </div>

    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-img :src="previewingImageUrl" contain max-height="80vh"></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="medium-emphasis" text @click="imageDialog = false">Đóng</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
  <div v-else class="text-center text-medium-emphasis">
    Không có dữ liệu chi tiết.
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  VIcon, VCard, VCardText, VList, VListItem, VRow, VCol, VImg, 
  VProgressCircular, VDivider, VBtn, VTextField, VDialog, VCardActions, VSpacer
} from 'vuetify/components';

const props = defineProps({
  checkIn: {
    type: Object,
    default: null
  }
});

const imageDialog = ref(false);
const previewingImageUrl = ref('');

const previewImage = (url) => {
  previewingImageUrl.value = url;
  imageDialog.value = true;
};
</script>

<style scoped>
.border {
  border: 1px solid rgba(var(--v-theme-border), 0.3) !important;
}
.cursor-pointer {
  cursor: pointer;
}
.bg-transparent {
  background-color: transparent !important;
}
</style>