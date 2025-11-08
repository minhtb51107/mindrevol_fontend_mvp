<template>
  <v-card class="daily-task-list d-flex flex-column" rounded="lg" elevation="2" height="100%">
    <v-card-item class="pt-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-medium">Công việc trong ngày</span>
        <v-chip size="small" variant="text" color="secondary" prepend-icon="mdi-calendar-blank">
          {{ dateFormatted }}
        </v-chip>
      </v-card-title>
    </v-card-item>
    <v-divider></v-divider>

    <div class="task-list-container">
      <div v-if="isLoading" class="d-flex justify-center align-center fill-height pa-5 flex-column">
         <v-progress-circular indeterminate color="primary" size="28"></v-progress-circular>
         <span class="ml-2 text-caption text-medium-emphasis mt-3">Đang tải công việc...</span>
      </div>
      <v-alert
        v-else-if="error"
        type="warning"
        variant="tonal"
        class="ma-3"
        density="compact"
        border="start"
        rounded="md"
      >
        {{ error }}
      </v-alert>

      <div v-else class="task-list-scroll pa-2">
        <draggable
          v-model="localDraggableList"
          item-key="id"
          ghost-class="ghost-item"
          handle=".drag-handle"
          :disabled="!isOwner || isActionLoading"
          @end="onDragEnd"
          tag="div"  
          animation="150"
        >
          <template #item="{ element: task, index }">
            
            <v-list-item
              :key="task.id" 
              class="task-item mb-1" 
              :class="{ 'draggable-item': isOwner }"
              density="compact"
              variant="tonal"
              rounded="lg"
            >
              <template v-slot:prepend>
                 <v-icon 
                    v-if="isOwner" 
                    class="drag-handle" 
                    size="small" 
                    title="Kéo để sắp xếp"
                    :color="getTaskCardColor(index)" 
                  >
                    mdi-drag-vertical
                  </v-icon>
                  <v-icon v-else class="mr-n1" size="small" color="transparent">mdi-circle-small</v-icon>
              </template>

              <v-list-item-title 
                  class="task-description text-wrap"
                  :class="{ 'text-decoration-line-through text-medium-emphasis': task.isCompleted }"
              >
                {{ task.description }}
              </v-list-item-title>

              <v-list-item-subtitle v-if="task.deadlineTime" class="mt-1">
                  <v-icon size="xs" start>mdi-clock-outline</v-icon>
                  Deadline: {{ task.deadlineTime }}
              </v-list-item-subtitle>
              
              <template v-slot:append v-if="isOwner">
                  <v-tooltip location="top" text="Sửa công việc">
                      <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-pencil-outline"
                            size="x-small"
                            variant="text"
                            color="medium-emphasis"
                            @click="emit('open-edit-task', task)"
                            class="ml-1"
                            :disabled="isActionLoading"
                          ></v-btn>
                      </template>
                    </v-tooltip>
                    <v-tooltip location="top" text="Xóa công việc">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-delete-outline"
                            size="x-small"
                            variant="text"
                            color="medium-emphasis"
                            @click="emit('confirm-delete-task', task)"
                            :disabled="isActionLoading"
                          ></v-btn>
                        </template>
                    </v-tooltip>
              </template>
            </v-list-item>
          </template>

          <template #header v-if="!isLoading && !tasks.length">
               <v-card-text class="text-center text-caption text-medium-emphasis py-6">
                  <v-icon size="large" class="mb-2">mdi-format-list-checks</v-icon><br>
                  Chưa có công việc nào cho ngày này.
               </v-card-text>
          </template>
        </draggable>
      </div>
    </div>

    <v-divider></v-divider>
    <v-card-actions v-if="isOwner" class="pa-2">
       <v-btn
        color="primary"
        variant="text"
        @click="emit('open-add-task')"
        prepend-icon="mdi-plus"
        :disabled="isActionLoading"
        block
        class="add-task-btn"
      >
        Thêm công việc
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';

// --- 1. Định nghĩa Props (Input) ---
const props = defineProps({
    tasks: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    isActionLoading: { type: Boolean, default: false },
    error: { type: String, default: null },
    isOwner: { type: Boolean, default: false },
    dateFormatted: { type: String, default: '' }
});

// --- 2. Định nghĩa Emits (Output) ---
const emit = defineEmits([
    'open-add-task', 
    'open-edit-task', 
    'confirm-delete-task', 
    'reorder-tasks' // Sự kiện báo cáo danh sách mới sau khi kéo thả
]);

// --- 3. Local State cho UI Kéo thả ---
const localDraggableList = ref([...props.tasks]);

// Đồng bộ hóa local state khi props.tasks thay đổi từ cha (vd: sau khi fetch lại API)
watch(() => props.tasks, (newTasks) => {
    localDraggableList.value = [...newTasks];
}, { deep: true });

// Khi kết thúc kéo thả, bắn sự kiện lên cha với danh sách mới
const onDragEnd = () => {
    emit('reorder-tasks', localDraggableList.value);
};

// --- 4. UI Helpers ---
const cardColors = ['#F7DC6F', '#F47BBD', '#70F8F8', '#A076F9', '#F7DC6F', '#82E0AA']; 
const getTaskCardColor = (index) => {
  return cardColors[index % cardColors.length];
};
</script>

<style scoped>
.daily-task-list {
  display: flex;
  flex-direction: column;
  height: 100%; 
}
.task-list-container {
   flex-grow: 1; 
   overflow: hidden; 
   display: flex; 
   flex-direction: column;
   min-height: 200px; 
}
.task-list-scroll {
  flex-grow: 1; 
  overflow-y: auto; 
}
.task-list-scroll::-webkit-scrollbar {
  width: 6px;
}
.task-list-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.task-item {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.task-item.draggable-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px -4px rgba(0,0,0,0.2);
}

.task-description {
  white-space: normal; 
  line-height: 1.4;
  flex-grow: 1;
  font-size: 0.9rem; 
}

.drag-handle {
  cursor: move;
  align-self: center; 
  opacity: 0.7;
  transition: opacity 0.2s;
}
.drag-handle:hover {
  opacity: 1;
}
.ghost-item {
  opacity: 0.5;
  background: rgba(var(--v-theme-primary), 0.1); 
  border-radius: 12px;
}

.add-task-btn {
  border: 1px dashed rgba(var(--v-theme-primary), 0.5);
  background-color: transparent !important;
  color: var(--v-theme-primary) !important;
}
.add-task-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>