<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-3" style="position: sticky; top: 80px;">
          <v-card-title class="text-h6 mb-2">
            Bước 2: Lập lịch công việc
          </v-card-title>
          <v-card-subtitle class="mb-4">{{ planDetails.title }}</v-card-subtitle>
          
          <v-list density="compact" nav>
            <v-list-item
              value="template"
              @click="selectedTab = 'template'"
              :active="selectedTab === 'template'"
              color="primary"
              rounded="lg"
              class="mb-1"
            >
              <template v-slot:prepend><v-icon icon="mdi-repeat"></v-icon></template>
              <v-list-item-title>Công việc Lặp lại (Template)</v-list-item-title>
            </v-list-item>
            
            <v-divider class="my-2"></v-divider>

            <v-list-subheader>Lịch chi tiết từng ngày</v-list-subheader>
            <v-list-item
              v-for="(day, index) in dateList"
              :key="index"
              :value="day.date"
              @click="selectedTab = day.date"
              :active="selectedTab === day.date"
              color="primary"
              rounded="lg"
              class="mb-1"
            >
              <v-list-item-title>Ngày {{ index + 1 }}: {{ formatDate(day.date) }}</v-list-item-title>
              <template v-slot:append>
                <v-chip size="small" :color="tasksByDay[day.date]?.length > 0 ? 'blue' : 'grey'">
                  {{ tasksByDay[day.date]?.length || 0 }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="pa-4 pa-md-6">
          
          <div v-if="selectedTab === 'template'">
            <p class="text-h6 mb-3">Công việc Lặp lại</p>
            <p class="text-body-2 mb-4">
              Các task tạo ở đây sẽ được áp dụng cho nhiều ngày. (ví dụ: "Nghe 1 bài listening" lặp lại mỗi ngày).
            </p>
            <div v-for="(task, index) in templateTasks" :key="index" class="template-task-row mb-4 pa-3 border rounded-lg">
              <v-text-field v-model="task.description" label="Mô tả công việc" density="compact" class="mb-2"></v-text-field>
              <v-text-field v-model="task.deadlineTime" label="Giờ (HH:mm)" type="time" density="compact" style="max-width: 120px;" class="mb-2"></v-text-field>
              <v-chip-group
                v-model="task.repeatDays"
                multiple
                column
              >
                <v-chip v-for="day in weekDays" :key="day.value" :value="day.value" filter variant="outlined" size="small">{{ day.text }}</v-chip>
              </v-chip-group>
              <v-btn icon="mdi-delete" size="small" variant="text" color="grey" @click="removeTemplateTask(index)"></v-btn>
            </div>
            <v-btn variant="outlined" @click="addTemplateTask" prepend-icon="mdi-plus">Thêm Task Lặp lại</v-btn>
          </div>

          <div v-else>
            <p class="text-h6 mb-3">Công việc cho: Ngày {{ getDayIndex(selectedTab) + 1 }} ({{ formatDate(selectedTab) }})</p>
            <p class="text-body-2 mb-4">
              Các task tạo ở đây chỉ áp dụng cho ngày này. (ví dụ: "Nghe bài listening chủ đề Environment").
            </p>
            <div v-for="(task, index) in tasksByDay[selectedTab]" :key="index" class="d-flex align-center mb-3">
              <v-text-field
                v-model="task.description"
                :label="`Công việc ${index + 1}`"
                density="compact"
                hide-details="auto"
                class="me-2"
              ></v-text-field>
              <v-text-field
                v-model="task.deadlineTime"
                label="Giờ (HH:mm)"
                type="time"
                density="compact"
                hide-details="auto"
                class="me-2"
                style="max-width: 120px;"
              ></v-text-field>
              <v-btn icon="mdi-delete" size="small" variant="text" color="grey" @click="removeDailyTask(selectedTab, index)"></v-btn>
            </div>
            <v-btn variant="outlined" @click="addDailyTask(selectedTab)" prepend-icon="mdi-plus">Thêm Task</v-btn>
          </div>

          <v-divider class="my-6"></v-divider>
          <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>
          <v-btn
            color="primary"
            block
            size="large"
            @click="handleFinalCreate"
            :loading="isLoading"
            rounded="lg"
          >
            Hoàn tất & Tạo Kế Hoạch
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanCreatorStore } from '@/stores/planCreator';
import { usePlanStore } from '@/stores/plan';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
dayjs.locale('vi');

const creatorStore = usePlanCreatorStore();
const planStore = usePlanStore();
const router = useRouter();

const planDetails = reactive({ ...creatorStore });
const dateList = ref([]);
const selectedTab = ref('template'); // Mở tab template đầu tiên

const isLoading = ref(false);
const errorMessage = ref('');

// Model cho các task lặp lại
const templateTasks = reactive([]);
// Model cho các task theo ngày
const tasksByDay = reactive({});

const weekDays = [
  { text: 'T2', value: 1 }, { text: 'T3', value: 2 }, { text: 'T4', value: 3 },
  { text: 'T5', value: 4 }, { text: 'T6', value: 5 }, { text: 'T7', value: 6 }, { text: 'CN', value: 0 }
];

// Khởi tạo danh sách ngày và model
onMounted(() => {
  if (!planDetails.startDate) {
    // Nếu lỡ mất state (ví dụ F5 khi persist chưa bật), quay về Bước 1
    router.push({ name: 'create-plan' });
    return;
  }
  
  const start = dayjs(planDetails.startDate);
  for (let i = 0; i < planDetails.durationInDays; i++) {
    const currentDate = start.add(i, 'day').format('YYYY-MM-DD');
    dateList.value.push({ date: currentDate });
    // Khởi tạo mảng rỗng cho mỗi ngày
    tasksByDay[currentDate] = reactive([]);
  }
});

// --- Các hàm xử lý UI ---
const formatDate = (dateString) => dayjs(dateString).format('DD/MM/YYYY');
const getDayIndex = (dateString) => dateList.value.findIndex(d => d.date === dateString);

// Thêm/Xóa task lặp lại
const addTemplateTask = () => templateTasks.push(reactive({ description: '', deadlineTime: null, repeatDays: [] }));
const removeTemplateTask = (index) => templateTasks.splice(index, 1);

// Thêm/Xóa task theo ngày
const addDailyTask = (date) => tasksByDay[date].push(reactive({ description: '', deadlineTime: null }));
const removeDailyTask = (date, index) => tasksByDay[date].splice(index, 1);

// --- HÀM XỬ LÝ QUAN TRỌNG: Gửi đi ---
const handleFinalCreate = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const finalTaskList = [];

    // 1. Xử lý các task theo ngày (Persona 1)
    Object.keys(tasksByDay).forEach(date => {
      tasksByDay[date].forEach(task => {
        if (task.description && task.description.trim()) {
          finalTaskList.push({
            description: task.description.trim(),
            deadlineTime: task.deadlineTime || null,
            taskDate: date,
          });
        }
      });
    });

    // 2. "Biên dịch" các task lặp lại (Persona 2 & 4)
    templateTasks.forEach(template => {
      if (template.description && template.description.trim() && template.repeatDays.length > 0) {
        dateList.value.forEach(day => {
          const dayOfWeek = dayjs(day.date).day(); // 0=CN, 1=T2, ...
          if (template.repeatDays.includes(dayOfWeek)) {
            finalTaskList.push({
              description: template.description.trim(),
              deadlineTime: template.deadlineTime || null,
              taskDate: day.date,
            });
          }
        });
      }
    });

    // 3. Tạo payload cuối cùng
    const payload = {
      ...planDetails, // title, description, durationInDays, startDate, dailyGoal
      tasks: finalTaskList, // Danh sách task đã được gán ngày
    };

    // 4. Gọi action mới trong planStore (sẽ tạo ở bước sau)
    await planStore.createPlanWithSchedule(payload);

    // 5. Xóa store tạm và điều hướng
    creatorStore.clearPlanDetails();
    // planStore sẽ tự động điều hướng đến trang plan mới
    // (Vì action createPlanWithSchedule đã xử lý điều hướng)

  } catch (error) {
    console.error("Lỗi khi tạo kế hoạch chi tiết:", error);
    errorMessage.value = error.response?.data?.message || 'Không thể tạo kế hoạch. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
.template-task-row {
  background-color: #f9f9f9;
}
</style>