<template>
  <v-card variant="tonal" class="date-selector-card">
    <v-card-text>
      <v-row align="center" justify="center" dense>
        <v-col cols="auto">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            size="small"
            @click="goToPreviousDay"
            :disabled="!isPreviousDayAllowed"
            aria-label="Ngày hôm trước"
          ></v-btn>
        </v-col>

        <v-col cols="auto">
          <v-menu
            v-model="datePickerMenu"
            :close-on-content-click="false"
            location="bottom center"
            transition="scale-transition"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                color="primary"
                class="mx-2"
                min-width="160"
              >
                {{ displaySelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="pickerDate"
              @update:modelValue="selectDateFromPicker"
              :min="planStartDate"
              :max="planEndDate"
              show-adjacent-months
              hide-header
              color="primary"
              elevation="3"
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="auto">
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            size="small"
            @click="goToNextDay"
            :disabled="!isNextDayAllowed"
            aria-label="Ngày hôm sau"
          ></v-btn>
        </v-col>

        <v-col cols="auto" v-if="!isTodaySelected">
             <v-btn
                variant="text"
                size="small"
                @click="goToToday"
                :disabled="!isTodayAllowed"
             >
                Hôm nay
             </v-btn>
         </v-col>

      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import { usePlanStore } from '@/stores/plan';
import dayjs from 'dayjs';
import 'dayjs/locale/vi'; // Import locale tiếng Việt
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.locale('vi'); // Sử dụng locale tiếng Việt
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// --- Store ---
const progressStore = useProgressStore();
const planStore = usePlanStore();

// --- State ---
const datePickerMenu = ref(false);
// Sử dụng computed để lấy ngày đang chọn từ store
const selectedDate = computed(() => progressStore.getSelectedDate); // Format YYYY-MM-DD
// State riêng cho v-date-picker (cần kiểu Date hoặc giá trị parse được bởi Date.parse)
const pickerDate = ref(dayjs(selectedDate.value).toDate());

// --- Computed Properties ---
const planStartDate = computed(() => planStore.currentPlan?.startDate); // Format YYYY-MM-DD
const planEndDate = computed(() => planStore.currentPlan?.endDate); // Format YYYY-MM-DD
const today = computed(() => dayjs().format('YYYY-MM-DD'));

// Hiển thị ngày dạng "dddd, DD/MM/YYYY" hoặc "Hôm nay", "Hôm qua"
const displaySelectedDate = computed(() => {
  const current = dayjs(selectedDate.value);
  if (current.isSame(today.value, 'day')) {
    return 'Hôm nay';
  }
  if (current.isSame(dayjs(today.value).subtract(1, 'day'), 'day')) {
    return 'Hôm qua';
  }
  // Format khác nếu cần: current.format('dddd, DD/MM/YYYY')
  return current.format('DD/MM/YYYY');
});

const isTodaySelected = computed(() => selectedDate.value === today.value);

// Kiểm tra xem có được phép chuyển sang ngày trước/sau/hôm nay không
const isPreviousDayAllowed = computed(() => {
    if (!planStartDate.value) return true; // Cho phép nếu chưa có plan start date
    const prevDay = dayjs(selectedDate.value).subtract(1, 'day');
    return prevDay.isSameOrAfter(planStartDate.value, 'day');
});

const isNextDayAllowed = computed(() => {
    if (!planEndDate.value) return true; // Cho phép nếu chưa có plan end date
    const nextDay = dayjs(selectedDate.value).add(1, 'day');
    return nextDay.isSameOrBefore(planEndDate.value, 'day');
});

const isTodayAllowed = computed(() => {
     if (!planStartDate.value || !planEndDate.value) return true; // Cho phép nếu chưa có range
     const todayObj = dayjs(today.value);
     return todayObj.isSameOrAfter(planStartDate.value, 'day') && todayObj.isSameOrBefore(planEndDate.value, 'day');
});


// --- Watchers ---
// Cập nhật pickerDate nếu selectedDate trong store thay đổi từ bên ngoài
watch(selectedDate, (newDate) => {
    const newPickerDate = dayjs(newDate).toDate();
    // Chỉ cập nhật nếu khác nhau để tránh vòng lặp vô hạn
    if (newPickerDate.getTime() !== pickerDate.value?.getTime()) {
         pickerDate.value = newPickerDate;
    }
});

// --- Methods ---
// Chọn ngày từ Date Picker
const selectDateFromPicker = (newDate) => {
  if (newDate) {
    const formattedDate = dayjs(newDate).format('YYYY-MM-DD');
    console.log("DateSelector: Date picked:", formattedDate);
    progressStore.setSelectedDate(formattedDate); // Gọi action để cập nhật store
  }
  datePickerMenu.value = false; // Đóng menu sau khi chọn
};

// Đi tới ngày hôm trước
const goToPreviousDay = () => {
  if (!isPreviousDayAllowed.value) return;
  const prevDate = dayjs(selectedDate.value).subtract(1, 'day').format('YYYY-MM-DD');
  progressStore.setSelectedDate(prevDate);
};

// Đi tới ngày hôm sau
const goToNextDay = () => {
  if (!isNextDayAllowed.value) return;
  const nextDate = dayjs(selectedDate.value).add(1, 'day').format('YYYY-MM-DD');
  progressStore.setSelectedDate(nextDate);
};

// Đi tới ngày hôm nay
const goToToday = () => {
   if (!isTodayAllowed.value) return;
   progressStore.setSelectedDate(today.value);
};

</script>

<style scoped>
.date-selector-card {
  /* Tùy chỉnh thêm style nếu cần */
  border: none; /* Bỏ border nếu dùng variant tonal */
}
/* Căn chỉnh các nút cho đẹp hơn nếu cần */
.v-row {
    flex-wrap: nowrap; /* Ngăn nút Hôm nay xuống dòng nếu không đủ chỗ */
    overflow-x: auto; /* Cho phép cuộn ngang trên màn hình nhỏ */
}
</style>