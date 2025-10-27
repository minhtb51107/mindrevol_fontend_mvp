<template>
  <v-card class="daily-task-list fill-height" elevation="1">
    <v-card-title class="d-flex align-center justify-space-between">
      <span>Công việc cần làm</span>
       <v-chip size="small" variant="outlined">{{ selectedDateFormatted }}</v-chip>
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

      <v-list lines="two" density="compact" class="pa-0 task-list-scroll">
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
            <v-list-item
              :key="task.id"
              class="task-list-item"
              :class="{ 'draggable-item': isOwner }"
            >
              <template v-slot:prepend v-if="isOwner">
                <v-icon class="drag-handle" size="small" title="Kéo để sắp xếp">mdi-drag-vertical</v-icon>
              </template>
              <v-list-item-title class="text-wrap">
                  {{ task.description }}
                </v-list-item-title>
               <v-list-item-subtitle v-if="task.deadlineTime" class="d-flex align-center mt-1">
                 <v-icon size="x-small" color="grey" class="mr-1">mdi-clock-outline</v-icon>
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
                           color="grey"
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
                           color="grey"
                           @click="emit('confirm-delete-task', task)"
                           :disabled="planStore.isTaskLoading"
                         ></v-btn>
                      </template>
                  </v-tooltip>
              </template>
            </v-list-item>
          </template>

          <template #header v-if="!planStore.isLoadingDailyTasks && !tasks.length">
               <v-list-item class="text-center text-caption text-medium-emphasis py-4">
                  Chưa có công việc nào cho ngày này.
               </v-list-item>
            </template>
        </draggable>
      </v-list>
    </div>

    <v-divider></v-divider>
    <v-card-actions v-if="isOwner">
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="text"
        @click="emit('open-add-task')"
        prepend-icon="mdi-plus"
        :disabled="planStore.isTaskLoading"
        block
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
import { vAutoAnimate } from '@formkit/auto-animate/vue' // Import auto-animate
import dayjs from 'dayjs';

// --- Store ---
const planStore = usePlanStore();
const progressStore = useProgressStore();

// --- Emits ---
const emit = defineEmits(['open-add-task', 'open-edit-task', 'confirm-delete-task']);

// --- Computed Properties ---
const tasks = computed(() => planStore.getCurrentDailyTasksSorted);
const isOwner = computed(() => planStore.isCurrentUserOwner);
const selectedDate = computed(() => progressStore.getSelectedDate);
const selectedDateFormatted = computed(() => dayjs(selectedDate.value).format('DD/MM/YYYY'));


// --- Draggable List ---
// `vuedraggable` cần một computed property có cả getter và setter
// Setter sẽ gọi action reorder trong store
const draggableTaskList = computed({
  get() {
    return tasks.value; // Lấy danh sách đã sắp xếp từ store
  },
  set(newOrderedTasks) {
    // Hàm này được gọi ngay sau khi kéo thả xong trên UI
    console.log("Draggable: List updated locally", newOrderedTasks.map(t => t.id));
    // Gọi action trong store để cập nhật thứ tự và gọi API
    // Truyền vào ngày hiện tại và danh sách task đã sắp xếp mới
     planStore.reorderTasksInCurrentPlan(selectedDate.value, newOrderedTasks)
      .then(() => {
          // Xử lý thành công (ví dụ: snackbar) đã được thực hiện trong PlanDetailView
          console.log("Draggable: Reorder action completed.");
      })
      .catch((error) => {
          // Xử lý lỗi (snackbar) đã được thực hiện trong PlanDetailView
          // `planStore.reorderTasksInCurrentPlan` sẽ tự rollback state nếu lỗi API
          console.error("Draggable: Reorder action failed:", error);
      });
  }
});

// --- Methods ---
const onDragEnd = (event) => {
  // `vuedraggable` đã tự động cập nhật `draggableTaskList` thông qua setter
  // Logic gọi API đã nằm trong setter của `draggableTaskList`
  console.log('Drag ended event:', event);
};

</script>

<style scoped>
.daily-task-list {
  display: flex;
  flex-direction: column;
}
.task-list-container {
   flex-grow: 1; /* Cho phép vùng chứa list chiếm hết chiều cao còn lại */
   overflow: hidden; /* Ẩn thanh cuộn của container */
   display: flex; /* Để áp dụng flex cho nội dung bên trong */
   flex-direction: column;
}
.task-list-scroll {
  flex-grow: 1; /* Cho v-list tự động co dãn */
  overflow-y: auto; /* Thêm thanh cuộn dọc cho v-list */
}
.task-list-item {
  border-bottom: 1px solid #eee;
  background-color: white; /* Nền trắng để nổi bật khi kéo */
  transition: background-color 0.2s ease-in-out;
}
.task-list-item:last-child {
  border-bottom: none;
}
.task-list-item.draggable-item:hover {
    background-color: #f9f9f9; /* Hiệu ứng hover nhẹ */
}
.drag-handle {
  cursor: move;
  color: #bdbdbd;
  /* margin-right: 8px; */
  align-self: center;
}
.drag-handle:hover {
  color: #757575;
}
/* Style cho phần tử đang được kéo (ghost) */
.ghost-item {
  opacity: 0.5;
  background: #e3f2fd; /* Màu xanh nhạt */
  border: 1px dashed #90caf9;
}
.text-wrap {
  white-space: normal;
}
</style>