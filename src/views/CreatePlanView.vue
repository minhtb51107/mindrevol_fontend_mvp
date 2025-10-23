<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-4 pa-md-6">
          <v-card-title class="text-center text-h5 mb-6">Tạo Kế hoạch học tập mới</v-card-title>
          <v-card-text>
            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="mb-4"
              closable
              rounded="lg"
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <v-form @submit.prevent="handleCreatePlan" ref="createPlanForm">
              <v-text-field
                v-model="form.title"
                label="Tên kế hoạch *"
                :rules="[rules.required]"
                placeholder="Ví dụ: Học ReactJS trong 7 ngày"
                class="mb-4"
              ></v-text-field>

              <v-textarea
                v-model="form.description"
                label="Mô tả ngắn"
                rows="3"
                placeholder="Mục tiêu chính của kế hoạch này là gì?"
                class="mb-4"
              ></v-textarea>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.durationInDays"
                    label="Thời lượng (ngày) *"
                    type="number"
                    :rules="[rules.required, rules.minValue(1)]"
                    min="1"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                     v-model="form.startDate"
                     label="Ngày bắt đầu *"
                     type="date"
                     :rules="[rules.required, rules.dateNotInPast]"
                     class="mb-4"
                   ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field
                v-model="form.dailyGoal"
                label="Mục tiêu chung mỗi ngày (tùy chọn)"
                placeholder="Ví dụ: Hoàn thành 1 chương, code 1 component..."
                class="mb-5"
              ></v-text-field>

              <v-divider class="mb-5"></v-divider>

              <div class="mb-5">
                <p class="text-subtitle-1 font-weight-medium mb-3">Công việc cụ thể cần làm (tùy chọn)</p>
                <div v-for="(task, index) in form.dailyTasks" :key="index" class="d-flex align-center mb-3">
                  <v-text-field
                    v-model="task.description"
                    :label="`Công việc ${index + 1}`"
                    hide-details="auto"
                    class="me-2"
                    :rules="[rules.taskDescriptionRequired(task.description, index)]"
                  ></v-text-field>
                  <v-btn
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    color="grey"
                    @click="removeTask(index)"
                    :disabled="form.dailyTasks.length <= 1 && !form.dailyTasks[0].description"
                  ></v-btn>
                </div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="addTask"
                  prepend-icon="mdi-plus"
                  rounded="lg"
                 >
                  Thêm công việc
                </v-btn>
              </div>
              <v-divider class="mb-6"></v-divider>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                rounded="lg"
                elevation="2"
              >
                Tạo kế hoạch
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, VTextField, VTextarea, VBtn, VAlert, VDivider, VIcon } from 'vuetify/components';

const planStore = usePlanStore();
const createPlanForm = ref(null);

const form = reactive({
  title: '',
  description: '',
  durationInDays: 7,
  startDate: '',
  dailyGoal: '',
  dailyTasks: [{ description: '' }]
});
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
  form.startDate = getTodayDate();
});

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minValue: (min) => value => (value >= min) || `Giá trị phải lớn hơn hoặc bằng ${min}.`,
  dateNotInPast: value => {
      const selectedDate = new Date(value);
      selectedDate.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);
      return selectedDate >= today || 'Ngày bắt đầu không được là quá khứ.';
  },
  taskDescriptionRequired: (value, index) => {
      const isLastEmptyTask = index === form.dailyTasks.length - 1 && !value?.trim();
      if (form.dailyTasks.length === 1 && isLastEmptyTask) return true;
      if (isLastEmptyTask && form.dailyTasks.length > 1) return true;
      return !!value?.trim() || 'Mô tả công việc không được để trống.';
  }
};

const addTask = () => {
  form.dailyTasks.push({ description: '' });
};

const removeTask = (index) => {
  if (form.dailyTasks.length > 1) {
    form.dailyTasks.splice(index, 1);
  } else {
    form.dailyTasks[0].description = '';
  }
};


const handleCreatePlan = async () => {
  if (!createPlanForm.value) return;
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
      ...form,
      dailyTasks: form.dailyTasks
                      .map(task => ({ description: task.description.trim() }))
                      .filter(task => task.description !== '')
  };

  try {
    await planStore.createNewPlan(payload);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo kế hoạch, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.d-flex.align-center.mb-3 {
  margin-bottom: 1rem !important;
}
</style>