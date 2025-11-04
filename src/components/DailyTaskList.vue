<template>
  <v-card class="daily-task-list d-flex flex-column" rounded="lg" elevation="2" height="100%">
    <v-card-item class="pt-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-medium">Công việc trong ngày</span>
        <v-chip size="small" variant="text" color="secondary" prepend-icon="mdi-calendar-blank">
          {{ selectedDateFormatted }}
        </v-chip>
      </v-card-title>
    </v-card-item>
    <v-divider></v-divider>

    <div class="task-list-container">
      <div v-if="planStore.isLoadingDailyTasks" class="d-flex justify-center align-center fill-height pa-5 flex-column">
         <v-progress-circular indeterminate color="primary" size="28"></v-progress-circular>
         <span class="ml-2 text-caption text-medium-emphasis mt-3">Đang tải công việc...</span>
      </div>
      <v-alert
        v-else-if="planStore.dailyTasksError"
        type="warning"
        variant="tonal"
        class="ma-3"
        density="compact"
        border="start"
        rounded="md"
      >
        {{ planStore.dailyTasksError }}
      </v-alert>

      <div v-else class="task-list-scroll pa-2">
        <draggable
          v-model="draggableTaskList"
          item-key="id"
          ghost-class="ghost-item"
          handle=".drag-handle"
          :disabled="!isOwner || planStore.isTaskLoading"
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

              <v-list-item-title class="task-description text-wrap">
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
              </template>
            </v-list-item>
          </template>

          <template #header v-if="!planStore.isLoadingDailyTasks && !tasks.length">
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
        :disabled="planStore.isTaskLoading"
        block
        class="add-task-btn"
      >
        Thêm công việc
      </v-btn>
    </v-card-actions>
     <v-alert v-if="planStore.taskError" type="error" density="compact" class="ma-2" rounded="md"> {{ planStore.taskError }} </v-alert>
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

// --- GIỮ NGUYÊN 100% SCRIPT GỐC ---
const emit = defineEmits(['open-add-task', 'open-edit-task', 'confirm-delete-task']);

const tasks = computed(() => planStore.getCurrentDailyTasksSorted);
const isOwner = computed(() => planStore.isCurrentUserOwner);
const selectedDate = computed(() => progressStore.getSelectedDate);
const selectedDateFormatted = computed(() => dayjs(selectedDate.value).format('DD/MM/YYYY'));

// Giữ nguyên hàm màu của bạn, vì chúng ta dùng nó cho icon
const cardColors = ['#F7DC6F', '#F47BBD', '#70F8F8', '#A076F9', '#F7DC6F', '#82E0AA']; 
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

/* * Style cho v-list-item tối giản 
 */
.task-item {
  /* * Bỏ --v-list-item-padding: vì density="compact" đã xử lý
   * Bỏ background-color: vì variant="tonal" đã xử lý
   */
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.task-item.draggable-item:hover {
    /* Thêm hiệu ứng nổi nhẹ khi hover */
    transform: translateY(-1px);
    box-shadow: 0 2px 8px -4px rgba(0,0,0,0.2);
}

.task-description {
  white-space: normal; 
  line-height: 1.4;
  flex-grow: 1;
  font-size: 0.9rem; /* Giảm font-size một chút cho gọn */
}

/* Giữ nguyên style gốc của bạn */
.drag-handle {
  cursor: move;
  /* Bỏ color: vì đã dùng :color binding */
  align-self: center; /* Căn giữa icon kéo */
  opacity: 0.7;
  transition: opacity 0.2s;
}
.drag-handle:hover {
  opacity: 1;
}
.ghost-item {
  opacity: 0.5;
  /* * Cho ghost item bo tròn và dùng variant tonal
   * để nó giống hệt item thật khi kéo
   */
  background: rgba(var(--v-theme-primary), 0.1); 
  border-radius: 12px;
}

/* Giữ nguyên style nút Add Task gốc */
.add-task-btn {
  border: 1px dashed rgba(var(--v-theme-primary), 0.5);
  background-color: transparent !important;
  color: var(--v-theme-primary) !important;
}
.add-task-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>