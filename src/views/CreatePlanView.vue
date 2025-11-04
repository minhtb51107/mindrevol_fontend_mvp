<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-4 pa-md-6">
          <v-card-title class="text-center text-h5 mb-6">Bước 1: Thông tin chung</v-card-title>
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

            <v-form @submit.prevent="goToStep2" ref="createPlanForm">
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
                class="mb-3"
              >
                Tiếp theo: Lập lịch công việc
              </v-btn>
              
              <v-btn
                variant="outlined"
                block
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                rounded="lg"
                @click="handleQuickCreate"
              >
                Tạo nhanh (thêm task sau)
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
import { useRouter } from 'vue-router'; // <-- Thêm
import { usePlanStore } from '@/stores/plan';
import { usePlanCreatorStore } from '@/stores/planCreator'; // <-- Thêm
import { VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, VTextField, VTextarea, VBtn, VAlert, VDivider } from 'vuetify/components';

const planStore = usePlanStore();
const creatorStore = usePlanCreatorStore(); // <-- Thêm
const router = useRouter(); // <-- Thêm
const createPlanForm = ref(null);

const form = reactive({
  title: '',
  description: '',
  durationInDays: 7,
  startDate: '',
  dailyGoal: '',
  // Xóa dailyTasks khỏi đây
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
  // Reset store tạm khi vào Bước 1 (để tránh lỗi khi back)
  creatorStore.clearPlanDetails();
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
};

// Xóa hàm addTask, removeTask

// === HÀM MỚI: Xử lý đi đến Bước 2 ===
const goToStep2 = async () => {
  if (!createPlanForm.value) return;
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 1. Lưu state vào store mới
    creatorStore.setPlanDetails(form);
    console.log("Details saved to creator store. Navigating to step 2...");
    // 2. Điều hướng đến Bước 2
    router.push({ name: 'plan-schedule' });
  } catch (error) {
    errorMessage.value = 'Không thể chuyển bước. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

// === HÀM MỚI: Xử lý Tạo Nhanh (Persona 3) ===
const handleQuickCreate = async () => {
  if (!createPlanForm.value) return;
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  // Gọi API "simple" (endpoint /plans) với task rỗng
  const payload = {
    ...form,
    dailyTasks: [], // Gửi mảng rỗng
    repeatTasks: false,
  };

  try {
    // Dùng planStore cũ để tạo
    await planStore.createNewPlan(payload);
    // planStore sẽ tự điều hướng khi thành công
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo kế hoạch, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* (Không cần CSS gì đặc biệt) */
</style>