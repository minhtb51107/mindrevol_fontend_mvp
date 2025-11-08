<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-4 pa-md-6">
          <v-card-title class="text-center text-h5 mb-6">Bắt đầu Hành trình mới</v-card-title>
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
                label="Tên hành trình *"
                :rules="[rules.required]"
                placeholder="Ví dụ: Hành trình chinh phục IELTS 8.0"
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-textarea
                v-model="form.description"
                label="Mô tả ngắn"
                rows="2"
                placeholder="Mục tiêu chính của hành trình này là gì?"
                class="mb-4"
                variant="outlined"
              ></v-textarea>

              <v-textarea
                v-model="form.motivation"
                label="Tại sao bạn muốn bắt đầu? (Động lực)"
                rows="3"
                placeholder="Hãy viết ra lý do sâu sắc nhất thúc đẩy bạn. Nó sẽ được nhắc lại mỗi khi bạn check-in để giữ lửa cho bạn."
                class="mb-6 motivation-field"
                variant="outlined"
                bg-color="amber-lighten-5"
                prepend-inner-icon="mdi-lightbulb-on-outline"
                hint="Đây là 'ngọn hải đăng' giúp bạn không bỏ cuộc khi gặp khó khăn."
                persistent-hint
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
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                     v-model="form.startDate"
                     label="Ngày bắt đầu *"
                     type="date"
                     :rules="[rules.required, rules.dateNotInPast]"
                     class="mb-4"
                     variant="outlined"
                   ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field
                v-model="form.dailyGoal"
                label="Mục tiêu chung mỗi ngày (tùy chọn)"
                placeholder="Ví dụ: Hoàn thành task trước 23h"
                class="mb-5"
                variant="outlined"
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
                class="mb-3 font-weight-bold"
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
                color="secondary"
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
import { useRouter } from 'vue-router';
// [CẬP NHẬT] Stores nội bộ feature Plan
import { usePlanStore } from '@/features/plan/stores/planStore';
import { usePlanCreatorStore } from '@/features/plan/stores/planCreatorStore';
import { 
  VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, 
  VTextField, VTextarea, VBtn, VAlert, VDivider 
} from 'vuetify/components';

const planStore = usePlanStore();
const creatorStore = usePlanCreatorStore();
const router = useRouter();
const createPlanForm = ref(null);

const form = reactive({
  title: '',
  description: '',
  motivation: '', // <-- THÊM VÀO STATE
  durationInDays: 30, // Tăng mặc định lên 30 cho giống "hành trình" hơn
  startDate: '',
  dailyGoal: '',
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

const goToStep2 = async () => {
  if (!createPlanForm.value) return;
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    creatorStore.setPlanDetails(form);
    console.log("Details saved to creator store. Navigating to step 2...");
    router.push({ name: 'plan-schedule' });
  } catch (error) {
    errorMessage.value = 'Không thể chuyển bước. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

const handleQuickCreate = async () => {
  if (!createPlanForm.value) return;
  const { valid } = await createPlanForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
    ...form,
    dailyTasks: [],
    repeatTasks: false,
  };

  try {
    await planStore.createNewPlan(payload);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo hành trình, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.motivation-field :deep(.v-field__input) {
    font-style: italic; /* Làm cho text nhập vào hơi nghiêng để nhấn mạnh */
}
</style>