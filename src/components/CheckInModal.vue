<template>
  <v-dialog v-model="dialogVisible" persistent max-width="600px" @click:outside="close">
    <v-card>
      <v-card-title>
        <span class="text-h5">Ghi nhận tiến độ ngày {{ form.date || 'hôm nay' }}</span>
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form @submit.prevent="handleSubmit" ref="checkInForm">
          <v-text-field
            v-model="form.date"
            label="Ngày check-in *"
            type="date"
            variant="outlined"
            density="compact"
            :rules="[rules.required, rules.dateNotInFuture, rules.dateWithinPlan]"
            class="mb-3"
          ></v-text-field>

          <div v-if="tasks.length > 0" class="mb-4">
            <p class="text-subtitle-1 mb-2">Đánh dấu công việc đã hoàn thành:</p>
            <v-checkbox
              v-for="(task, index) in tasks"
              :key="index"
              v-model="selectedTaskIndices"
              :label="task"
              :value="index"
              density="compact"
              hide-details
              color="primary"
            ></v-checkbox>
            <v-checkbox
                v-model="form.completed"
                label="Hoàn thành tất cả mục tiêu ngày hôm nay"
                density="compact"
                hide-details
                color="primary"
                class="mt-2 font-weight-medium"
            ></v-checkbox>
          </div>
          <div v-else class="mb-3">
              <v-checkbox
                v-model="form.completed"
                label="Tôi đã hoàn thành mục tiêu ngày hôm nay"
                density="compact"
                hide-details
                color="primary"
              ></v-checkbox>
          </div>


          <v-textarea
            v-model="form.notes"
            label="Ghi chú (Cảm nhận, khó khăn...)"
            variant="outlined"
            density="compact"
            rows="3"
            class="mb-3"
          ></v-textarea>

          <v-text-field
            v-model="form.evidence"
            label="Link bằng chứng (Github, Figma, ảnh...)"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link-variant"
            placeholder="https://..."
            clearable
            class="mb-3"
          ></v-text-field>

        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">Hủy</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleSubmit"
        >
          Lưu tiến độ
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import { VDialog, VCard, VCardTitle, VCardText, VCardActions, VForm, VTextField, VTextarea, VCheckbox, VBtn, VSpacer, VAlert } from 'vuetify/components';

const props = defineProps({
  shareableLink: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const progressStore = useProgressStore();
const planStore = usePlanStore();
const dialogVisible = ref(true);
const checkInForm = ref(null);

const form = reactive({
  date: '',
  completed: false, // Default là false, sẽ tự check nếu chọn hết tasks
  notes: '',
  evidence: '',
});

const selectedTaskIndices = ref([]); // Mảng chứa index các task được chọn

const tasks = computed(() => planStore.currentPlan?.dailyTasks || []);
const planStartDate = computed(() => planStore.currentPlan?.startDate);
const planEndDate = computed(() => planStore.currentPlan?.endDate);

const isLoading = ref(false);
const errorMessage = ref('');

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

onMounted(() => {
  form.date = getTodayDate();
  // TODO: Fetch existing progress for the selected date if available and pre-fill form, including selectedTaskIndices
});

// Watch khi danh sách task được chọn thay đổi
watch(selectedTaskIndices, (newIndices) => {
    // Tự động check ô "Hoàn thành tất cả" nếu tất cả task con được chọn
    if (tasks.value.length > 0) {
        form.completed = newIndices.length === tasks.value.length;
    }
}, { deep: true }); // deep watch cần thiết cho mảng

// Watch khi ô "Hoàn thành tất cả" thay đổi
watch(() => form.completed, (isCompleted) => {
    if (tasks.value.length > 0) {
        if (isCompleted && selectedTaskIndices.value.length !== tasks.value.length) {
            // Nếu check "Hoàn thành tất cả" -> chọn tất cả task con
            selectedTaskIndices.value = tasks.value.map((_, index) => index);
        } else if (!isCompleted && selectedTaskIndices.value.length === tasks.value.length) {
            // Nếu bỏ check "Hoàn thành tất cả" (khi tất cả đang được chọn) -> bỏ chọn tất cả task con
             selectedTaskIndices.value = [];
        }
    }
});


const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  dateNotInFuture: value => {
      const selectedDate = new Date(value);
      selectedDate.setHours(23, 59, 59, 999);
      const today = new Date();
      return selectedDate <= today || 'Không thể check-in cho ngày tương lai.';
  },
   dateWithinPlan: value => {
       if (!planStartDate.value || !planEndDate.value) return true;
       const selectedDate = new Date(value);
       selectedDate.setHours(0,0,0,0);
       const startDate = new Date(planStartDate.value);
       startDate.setHours(0,0,0,0);
       const endDate = new Date(planEndDate.value);
       endDate.setHours(0,0,0,0);
       return (selectedDate >= startDate && selectedDate <= endDate) || 'Ngày check-in phải nằm trong thời gian kế hoạch.';
   }
};


const close = () => {
  dialogVisible.value = false;
  // Không emit('close') ngay lập tức, đợi watch dialogVisible xử lý
};

const handleSubmit = async () => {
  const { valid } = await checkInForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
     const payload = {
       date: form.date,
       completed: form.completed,
       notes: form.notes,
       evidence: form.evidence,
       // Gửi đi mảng các index đã chọn
       completedTaskIndices: selectedTaskIndices.value,
     };
    await progressStore.logDailyProgress(props.shareableLink, payload);
    close();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể ghi nhận, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

// Đảm bảo emit close khi dialog bị đóng từ bên ngoài hoặc khi tự đóng
watch(dialogVisible, (newValue) => {
  if (!newValue) {
     setTimeout(() => emit('close'), 300); // Đợi hiệu ứng đóng dialog
  }
});

</script>

<style scoped>
</style>