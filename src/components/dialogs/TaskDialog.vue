<!-- <template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card class="neo-dialog-card" rounded="lg">
      <v-form ref="form" @submit.prevent="saveTask">
        <v-card-title class="font-weight-medium">
          <v-icon start color="grey-lighten-1">{{
            isEditMode ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline'
          }}</v-icon>
          {{ formTitle }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-text-field
            v-model="taskData.description"
            label="Mô tả công việc"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            autofocus
            class="mb-3"
          ></v-text-field>

          <v-text-field
            v-model="taskData.deadlineTime"
            label="Deadline (ví dụ: 09:00)"
            placeholder="HH:mm"
            variant="outlined"
            density="compact"
            :rules="[rules.timeFormat]"
            hint="Để trống nếu không có deadline cụ thể"
            persistent-hint
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog" :disabled="isLoading">
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            type="submit"
            :loading="isLoading"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from 'vue-sonner'; // <-- ĐÃ THAY ĐỔI

const props = defineProps({
  modelValue: Boolean,
  planId: {
    type: String,
    required: true,
  },
  task: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'task-saved']);

// --- Store và State ---
const taskStore = useTaskStore();
// const snackbar = useSnackbar(); // <-- ĐÃ XÓA
const form = ref(null);
const isLoading = ref(false);

const taskData = ref({
  description: '',
  deadlineTime: '',
});

// --- Computed ---
const isEditMode = computed(() => !!props.task?.id);
const formTitle = computed(() =>
  isEditMode.value ? 'Chỉnh sửa công việc' : 'Công việc mới'
);

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || 'Không được để trống.',
  timeFormat: (value) => {
    if (!value) return true;
    return (
      /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(value) ||
      'Định dạng thời gian không đúng (HH:mm)'
    );
  },
};

// --- Methods ---
const closeDialog = () => {
  emit('update:modelValue', false);
};

const saveTask = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  isLoading.value = true;
  try {
    const payload = {
      description: taskData.value.description,
      deadlineTime: taskData.value.deadlineTime || null,
    };

    if (isEditMode.value) {
      await taskStore.updateTask(props.task.id, payload);
      toast.success('Đã cập nhật công việc'); // <-- ĐÃ THAY ĐỔI
    } else {
      await taskStore.createTask(props.planId, payload);
      toast.success('Đã tạo công việc mới'); // <-- ĐÃ THAY ĐỔI
    }
    emit('task-saved');
    closeDialog();
  } catch (error) {
    console.error('Lỗi khi lưu công việc:', error);
    // <-- ĐÃ THAY ĐỔI
    toast.error('Lỗi', {
      description: error.message || 'Không thể lưu công việc.',
    });
  } finally {
    isLoading.value = false;
  }
};

// --- Watcher ---
watchEffect(() => {
  if (props.modelValue) {
    if (isEditMode.value) {
      taskData.value.description = props.task.description;
      taskData.value.deadlineTime = props.task.deadlineTime || '';
    } else {
      taskData.value.description = '';
      taskData.value.deadlineTime = '';
    }
    if (form.value) {
      form.value.resetValidation();
    }
  }
});
</script>

<style scoped>
.neo-dialog-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.3) !important;
}
</style> -->