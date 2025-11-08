<!-- <template>
  <v-sheet
    class="pa-4 neo-sidebar"
    rounded="lg"
    border
    height="100%"
    style="overflow-y: auto"
  >
    <section class="mb-4">
      <div class="d-flex justify-space-between align-center mb-2">
        <v-chip
          v-if="plan.status"
          :color="statusColor(plan.status)"
          size="small"
          label
        >
          {{ plan.status }}
        </v-chip>
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              color="grey-lighten-1"
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="$emit('copy-link')">
              <template v-slot:prepend>
                <v-icon icon="mdi-link"></v-icon>
              </template>
              <v-list-item-title>Copy Link</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="isOwner && plan.status !== 'ARCHIVED'"
              @click="$emit('archive-plan')"
              color="orange"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-archive-outline"></v-icon>
              </template>
              <v-list-item-title>Lưu trữ</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="isOwner && plan.status === 'ARCHIVED'"
              @click="$emit('restore-plan')"
              color="green"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-archive-arrow-up-outline"></v-icon>
              </template>
              <v-list-item-title>Khôi phục</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="isOwner"
              @click="$emit('transfer-ownership')"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-cowboy-hat-outline"></v-icon>
              </template>
              <v-list-item-title>Chuyển quyền</v-list-item-title>
            </v-list-item>
            <v-divider v-if="isOwner"></v-divider>
            <v-list-item
              v-if="isOwner"
              @click="$emit('delete-plan')"
              class="text-error"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-delete-outline"></v-icon>
              </template>
              <v-list-item-title>Xóa Kế hoạch</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <h1 class="text-h5 font-weight-bold mb-2">{{ plan.title }}</h1>
      <p v-if="plan.description" class="text-body-2 text-medium-emphasis mb-3">
        {{ plan.description }}
      </p>

      <div class="d-flex align-center text-caption text-medium-emphasis mb-1">
        <v-icon start size="small">mdi-calendar-range</v-icon>
        <span>{{ formatDateRange(plan.startDate, plan.endDate) }}</span>
      </div>
      <div
        v-if="plan.goal"
        class="d-flex align-center text-caption text-medium-emphasis"
      >
        <v-icon start size="small">mdi-target</v-icon>
        <span>{{ plan.goal }}</span>
      </div>
    </section>

    <v-divider class="mb-4"></v-divider>

    <section class="mb-4">
      <h2 class="text-subtitle-1 font-weight-medium mb-2">Thành viên</h2>
      <v-list density="compact" class="bg-transparent">
        <v-list-item
          v-for="member in members"
          :key="member.userId"
          class="pa-0"
        >
          <template v-slot:prepend>
            <v-avatar size="32" class="mr-3">
              <v-img
                :src="
                  member.userAvatar ||
                  'https://avatar.iran.liara.run/public/boy'
                "
                :alt="member.userFullName"
              ></v-img>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ member.userFullName }}
            <v-chip
              v-if="member.role === 'OWNER'"
              color="amber"
              size="x-small"
              label
              class="ml-1"
            >
              Owner
            </v-chip>
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{
            member.userEmail
          }}</v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              v-if="isOwner && member.role !== 'OWNER'"
              icon="mdi-close"
              variant="text"
              size="small"
              color="grey-lighten-1"
              @click="$emit('remove-member', member)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <v-btn
        block
        variant="tonal"
        color="primary"
        class="mt-2"
        @click="$emit('invite-member')"
        prepend-icon="mdi-plus"
        :disabled="plan.status === 'ARCHIVED'"
      >
        Mời thành viên
      </v-btn>
    </section>

    <v-divider class="mb-4"></v-divider>

    <section>
      <div class="d-flex justify-space-between align-center mb-2">
        <h2 class="text-subtitle-1 font-weight-medium">Công việc hàng ngày</h2>
        <v-btn
          color="primary"
          size="small"
          variant="text"
          @click="$emit('open-task-dialog')"
          :disabled="plan.status === 'ARCHIVED' || !isOwner"
          icon="mdi-plus"
        ></v-btn>
      </div>

      <div
        v-if="!dailyTasks.length"
        class="text-center text-caption text-medium-emphasis pa-4"
      >
        Chưa có công việc nào.
      </div>

      <draggable
        :list="tasks"
        item-key="id"
        handle=".handle"
        @end="$emit('reorder-tasks', tasks)"
        :disabled="plan.status === 'ARCHIVED' || !isOwner"
      >
        <template #item="{ element: task }">
          <v-card
            class="mb-2 task-card-item"
            variant="outlined"
            density="compact"
          >
            <div class="d-flex align-center pa-2">
              <v-icon
                v-if="isOwner && plan.status !== 'ARCHIVED'"
                class="handle mr-2"
                style="cursor: move"
                >mdi-drag-horizontal</v-icon
              >
              <v-icon v-else class="mr-2" color="transparent"
                >mdi-drag-horizontal</v-icon
              >
              <div class="flex-grow-1">
                <p class="text-body-2 font-weight-medium">
                  {{ task.description }}
                </p>
                <span
                  v-if="task.deadlineTime"
                  class="text-caption text-medium-emphasis"
                >
                  <v-icon size="x-small" start>mdi-clock-outline</v-icon>
                  Deadline: {{ task.deadlineTime }}
                </span>
              </div>
              <v-btn
                v-if="isOwner && plan.status !== 'ARCHIVED'"
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="grey-lighten-1"
                @click="$emit('edit-task', task)"
              ></v-btn>
              <v-btn
                v-if="isOwner && plan.status !== 'ARCHIVED'"
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="$emit('delete-task', task)"
              ></v-btn>
            </div>
          </v-card>
        </template>
      </draggable>
    </section>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue';
import draggable from 'vuedraggable';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore,
  addDays,
} from 'date-fns';

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  dailyTasks: {
    type: Array,
    default: () => [],
  },
  members: {
    type: Array,
    default: () => [],
  },
});

// Chúng ta cần tạo một ref 'tasks' nội bộ từ prop 'dailyTasks'
// để vuedraggable có thể cập nhật
// Tuy nhiên, để đơn giản, chúng ta sẽ emit 'tasks' khi kéo thả
// và PlanDetailView sẽ xử lý. Nên chúng ta dùng computed.
// Lưu ý: vuedraggable NÊN dùng v-model:list
// Nhưng ở đây ta tạm dùng :list và @end để emit
const tasks = computed(() => props.dailyTasks);

// Định nghĩa emits để Parent (PlanDetailView) có thể bắt sự kiện
defineEmits([
  'copy-link',
  'archive-plan',
  'restore-plan',
  'transfer-ownership',
  'delete-plan',
  'remove-member',
  'invite-member',
  'open-task-dialog',
  'edit-task',
  'delete-task',
  'reorder-tasks',
]);

// --- Các hàm helpers ---

const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'dd/MM/yyyy');
};

const formatDateRange = (start, end) => {
  if (!start || !end) return 'N/A';
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (isSameDay(startDate, endDate)) {
    return format(startDate, 'dd/MM/yyyy');
  }
  return `${format(startDate, 'dd/MM/yyyy')} - ${format(
    endDate,
    'dd/MM/yyyy'
  )}`;
};

const statusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ARCHIVED':
      return 'grey';
    case 'UPCOMING':
      return 'info';
    case 'COMPLETED':
      return 'primary';
    default:
      return 'default';
  }
};
</script>

<style scoped>
/* Thêm style cho sidebar "Neo" */
.neo-sidebar {
  background-color: rgba(
    var(--v-theme-surface-variant),
    0.3
  ); /* Hơi trong suốt */
  backdrop-filter: blur(10px);
  border-color: rgba(var(--v-border-color), 0.3) !important;
}

.task-card-item {
  background-color: rgba(var(--v-theme-surface), 0.7);
  transition: all 0.2s ease;
}

.task-card-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.7) !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.handle {
  cursor: grab;
}
.handle:active {
  cursor: grabbing;
}
</style> -->