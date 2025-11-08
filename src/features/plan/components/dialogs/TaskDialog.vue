<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="closeDialog"
    persistent
    max-width="500px"
  >
    <v-card class="glass-effect">
      <v-card-title>
        {{ isEditing ? 'Chỉnh sửa công việc' : 'Thêm công việc mới' }}
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="planTaskStore.taskActionError"
          type="error"
          density="compact"
          class="mb-3"
          closable
        >
          {{ planTaskStore.taskActionError }}
        </v-alert>
        
        <v-form ref="formRef" @submit.prevent="onSave">
          <v-textarea
            v-model="form.description"
            label="Mô tả công việc *"
            rows="3"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || 'Bắt buộc']"
            class="mb-3"
            autofocus
          ></v-textarea>
          
          <v-text-field
            v-model="form.deadlineTime"
            label="Deadline (HH:mm - tùy chọn)"
            type="time"
            variant="outlined"
            density="compact"
            clearable
          ></v-text-field>

          <v-text-field
             v-if="!isEditing"
             v-model="form.taskDate"
             label="Ngày thực hiện *"
             type="date"
             variant="outlined"
             density="compact"
             :rules="[v => !!v || 'Bắt buộc']"
             class="mt-3"
          ></v-text-field>

          <v-text-field
             v-if="isEditing"
             v-model="form.taskDate"
             label="Chuyển sang ngày (tùy chọn)"
             type="date"
             variant="outlined"
             density="compact"
             class="mt-3"
             clearable
             hint="Để trống nếu giữ nguyên ngày cũ"
             persistent-hint
          ></v-text-field>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="medium-emphasis"
          variant="text"
          @click="closeDialog"
          :disabled="planTaskStore.isTaskActionLoading"
        >
          Hủy
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="onSave"
          :loading="planTaskStore.isTaskActionLoading"
        >
          Lưu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { usePlanTaskStore } from '@/features/plan/stores/planTaskStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import { useProgressStore } from '@/features/progress/stores/progressStore';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  task: { type: Object, default: null }, // Nếu có task nghĩa là đang edit
});
const emit = defineEmits(['update:modelValue', 'saved']);

const planTaskStore = usePlanTaskStore();
const planStore = usePlanStore();
const progressStore = useProgressStore();

const formRef = ref(null);
const form = reactive({
  description: '',
  deadlineTime: null,
  taskDate: null,
});

const isEditing = computed(() => !!props.task);

// Reset form khi mở dialog
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.task) {
      // Mode Edit
      form.description = props.task.description;
      form.deadlineTime = props.task.deadlineTime || null;
      // [SỬA LỖI] Dùng ngày đang chọn làm fallback nếu task không có ngày
      form.taskDate = props.task.taskDate || progressStore.getSelectedDate; 
    } else {
      // Mode Add
      form.description = '';
      form.deadlineTime = null;
      // Mặc định lấy ngày đang chọn bên ngoài
      form.taskDate = progressStore.getSelectedDate;
    }
    nextTick(() => formRef.value?.resetValidation());
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

const onSave = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // Validate & Format Time
  let formattedTime = null;
  if (form.deadlineTime) {
      const timeRegex = /^([0-1]?\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
      if (timeRegex.test(form.deadlineTime)) {
           formattedTime = form.deadlineTime.substring(0, 5);
      } else {
           alert('Định dạng giờ không hợp lệ'); return;
      }
  }

  const payload = {
      description: form.description,
      deadlineTime: formattedTime,
      // Nếu user đang edit và xóa ngày (chuyển ngày), taskDate sẽ là null
      // Backend nên hiểu null là "giữ nguyên ngày cũ"
      // Nhưng nếu form.taskDate có giá trị (do user chọn ngày mới), thì dùng nó
      taskDate: form.taskDate || undefined 
  };

  try {
      const link = planStore.currentPlan?.shareableLink;
      if (!link) throw new Error("Missing plan link");

      if (isEditing.value) {
          // [SỬA LỖI] Phải truyền vào ngày GỐC của task (original date)
          // Dùng ngày đang chọn làm fallback
          const originalTaskDate = props.task.taskDate || progressStore.getSelectedDate;

          await planTaskStore.updateTask(link, props.task.id, payload, originalTaskDate);
      } else {
          // Gọi create (payload đã chứa taskDate)
          await planTaskStore.addTask(link, payload);
      }
      emit('saved'); // Báo ra ngoài nếu cần hiển thị snackbar
      closeDialog();
  } catch (e) {
      // Lỗi đã được xử lý trong store và hiển thị lên alert
  }
};
</script>