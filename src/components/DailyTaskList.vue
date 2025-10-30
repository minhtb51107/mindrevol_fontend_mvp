<template>
  <v-card class="daily-task-list glass-effect">
    <v-card-title class="d-flex align-center justify-space-between">
      <span class="text-h6">Công việc trong ngày</span>
       <v-chip size="small" variant="text" color="secondary">{{ selectedDateFormatted }}</v-chip>
    </v-card-title>
    <v-divider></v-divider>

    <div class="task-list-container">
      <div v-if="planStore.isLoadingDailyTasks" class="d-flex justify-center align-center fill-height pa-5">
         <v-progress-circular indeterminate color="primary" size="small"></v-progress-circular>
         <span class="ml-2 text-caption text-medium-emphasis">Đang tải công việc...</span>
      </div>
      <v-alert
        v-else-if="planStore.dailyTasksError"
        type="warning"
        variant="tonal"
        class="ma-2"
        density="compact"
        border="start"
      >
        {{ planStore.dailyTasksError }}
      </v-alert>

      <div v-else class="task-list-scroll pa-2">
        <draggable
          :list="draggableTaskList"
          item-key="id"
          ghost-class="ghost-item"
          handle=".drag-handle"
          :disabled="!isOwner || planStore.isTaskLoading"
          @end="onDragEnd"
          tag="div"  
           v-auto-animate="{ duration: 300 }"
        >
          <template #item="{ element: task, index }">
            <v-card 
              :key="task.id" 
              class="task-card mb-2" 
              :class="{ 'draggable-item': isOwner }"
              variant="outlined"
              :color="getTaskCardColor(index)"
            >
              <v-card-text class="pa-3">
                 <div class="d-flex align-start">
                    <v-icon 
                      v-if="isOwner" 
                      class="drag-handle mr-2" 
                      size="small" 
                      title="Kéo để sắp xếp"
                    >
                      mdi-drag-vertical
                    </v-icon>
                    <v-icon v-else class="mr-2" size="small" color="medium-emphasis">mdi-circle-small</v-icon>
                    
                    <span class="task-description text-on-surface">{{ task.description }}</span>
                 </div>
                 
                 <v-row dense align="center" class="mt-2">
                   <v-col cols="auto">
                      <v-chip 
                        v-if="task.deadlineTime" 
                        size="x-small" 
                        color="medium-emphasis" 
                        variant="tonal" 
                        prepend-icon="mdi-clock-outline"
                      >
                        Deadline: {{ task.deadlineTime }}
                      </v-chip>
                   </v-col>
                   <v-spacer></v-spacer>
                   <v-col cols="auto" v-if="isOwner">
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
                                :disabled="planStore.isTaskLoading"
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
                                :disabled="planStore.isTaskLoading"
                              ></v-btn>
                            </template>
                        </v-tooltip>
                   </v-col>
                 </v-row>
              </v-card-text>
            </v-card>
          </template>

          <template #header v-if="!planStore.isLoadingDailyTasks && !tasks.length">
               <v-card-text class="text-center text-caption text-medium-emphasis py-4">
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
        :disabled="planStore.isTaskLoading"
        block
        class="add-task-btn"
      >
        Thêm công việc
      </v-btn>
    </v-card-actions>
     <v-alert v-if="planStore.taskError" type="error" density="compact" class="ma-2"> {{ planStore.taskError }} </v-alert>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { useProgressStore } from '@/stores/progress';
import draggable from 'vuedraggable';
import { vAutoAnimate } from '@formkit/auto-animate/vue' 
import dayjs from 'dayjs';

const planStore = usePlanStore();
const progressStore = useProgressStore();

const emit = defineEmits(['open-add-task', 'open-edit-task', 'confirm-delete-task']);

const tasks = computed(() => planStore.getCurrentDailyTasksSorted);
const isOwner = computed(() => planStore.isCurrentUserOwner);
const selectedDate = computed(() => progressStore.getSelectedDate);
const selectedDateFormatted = computed(() => dayjs(selectedDate.value).format('DD/MM/YYYY'));

const cardColors = ['#F7DC6F', '#F47BBD', '#70F8F8', '#A076F9', '#F7DC6F']; 

const getTaskCardColor = (index) => {
  return cardColors[index % cardColors.length];
};

const draggableTaskList = computed({
  get() {
    return tasks.value; 
  },
  set(newOrderedTasks) {
    console.log("Draggable: List updated locally", newOrderedTasks.map(t => t.id));
     planStore.reorderTasksInCurrentPlan(selectedDate.value, newOrderedTasks)
      .then(() => {
          console.log("Draggable: Reorder action completed.");
      })
      .catch((error) => {
          console.error("Draggable: Reorder action failed:", error);
      });
  }
});

const onDragEnd = (event) => {
  console.log('Drag ended event:', event);
};

</script>

<style scoped>
.daily-task-list {
  display: flex;
  flex-direction: column;
  height: 100%; /* Đảm bảo component cha chiếm 100% chiều cao */
}
.task-list-container {
   flex-grow: 1; /* Cho phép vùng chứa list chiếm hết chiều cao còn lại */
   overflow: hidden; 
   display: flex; 
   flex-direction: column;
   min-height: 200px; 
}
.task-list-scroll {
  flex-grow: 1; 
  overflow-y: auto; 
  /* *** THAY ĐỔI Ở ĐÂY *** */
  /* max-height: 450px; Xóa bỏ max-height cố định */
}
.task-card {
  background-color: rgba(var(--v-theme-surface), 0.7);
  transition: background-color 0.2s ease-out, box-shadow 0.2s ease-out;
  border-width: 1px;
}
.task-card.draggable-item:hover {
    background-color: rgba(var(--v-theme-surface), 1); 
    box-shadow: 0 0 8px rgba(var(--v-theme-primary), 0.3);
}
.task-description {
  white-space: normal; 
  line-height: 1.4;
  flex-grow: 1;
}
.drag-handle {
  cursor: move;
  color: rgba(var(--v-theme-on-surface), 0.4);
  align-self: flex-start;
  margin-top: 2px;
}
.drag-handle:hover {
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.ghost-item {
  opacity: 0.5;
  background: rgba(var(--v-theme-primary), 0.2);
  border: 1px dashed rgba(var(--v-theme-primary), 0.5);
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