<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="elevation-2 pa-4 pa-md-6">
          <v-card-title class="text-center text-h5 mb-6">Tạo Kế hoạch học tập mới</v-card-title>
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

            <v-form @submit.prevent="handleCreatePlan" ref="createPlanForm">
              <v-text-field
                v-model="form.title"
                label="Tên kế hoạch *"
                variant="outlined"
                density="compact"
                :rules="[rules.required]"
                placeholder="Ví dụ: Học ReactJS trong 7 ngày"
                class="mb-3"
              ></v-text-field>

              <v-textarea
                v-model="form.description"
                label="Mô tả ngắn"
                variant="outlined"
                density="compact"
                rows="3"
                placeholder="Mục tiêu chính của kế hoạch này là gì?"
                class="mb-3"
              ></v-textarea>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="form.durationInDays"
                    label="Thời lượng (ngày) *"
                    type="number"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required, rules.minValue(1)]"
                    min="1"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                     v-model="form.startDate"
                     label="Ngày bắt đầu *"
                     type="date"
                     variant="outlined"
                     density="compact"
                     :rules="[rules.required, rules.dateNotInPast]"
                     class="mb-3"
                   ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field
                v-model="form.dailyGoal"
                label="Mục tiêu chung mỗi ngày (tùy chọn)"
                variant="outlined"
                density="compact"
                placeholder="Ví dụ: Hoàn thành 1 chương, code 1 component..."
                class="mb-4"
              ></v-text-field>

              <v-divider class="my-4"></v-divider>

              <div class="mb-4">
                <p class="text-subtitle-1 mb-2">Công việc cụ thể cần làm (tùy chọn)</p>
                <div v-for="(task, index) in form.dailyTasks" :key="index" class="d-flex align-center mb-2">
                  <v-text-field
                    v-model="form.dailyTasks[index]"
                    :label="`Công việc ${index + 1}`"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="me-2"
                  ></v-text-field>
                  <v-btn icon="mdi-delete-outline" size="small" variant="text" color="grey" @click="removeTask(index)"></v-btn>
                </div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="addTask"
                  prepend-icon="mdi-plus"
                 >
                  Thêm công việc
                </v-btn>
              </div>

              <v-divider class="my-4"></v-divider>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                class="mt-4"
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
  dailyTasks: ['']
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
  }
};

const addTask = () => {
  form.dailyTasks.push('');
};

const removeTask = (index) => {
  form.dailyTasks.splice(index, 1);
   if (form.dailyTasks.length === 0) {
        form.dailyTasks.push(''); // Luôn giữ ít nhất 1 ô trống nếu xóa hết
    }
};


const handleCreatePlan = async () => {
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
      ...form,
      // Lọc bỏ các task rỗng trước khi gửi đi
      dailyTasks: form.dailyTasks.filter(task => task && task.trim() !== '')
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
</style>