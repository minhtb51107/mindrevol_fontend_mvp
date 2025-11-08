<template>
  <v-row align="center" justify="end" dense class="date-selector-controls">
    <v-col cols="auto" class="pa-0">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        size="small"
        @click="goToPreviousDay"
        :disabled="!isPreviousDayAllowed"
        aria-label="Ngày hôm trước"
        color="medium-emphasis"
      ></v-btn>
    </v-col>

    <v-col cols="auto" class="pa-0">
      <v-menu
        v-model="datePickerMenu"
        :close-on-content-click="false"
        location="bottom end"
        transition="scale-transition"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            color="secondary"
            class="mx-1 neon-text-secondary"
            min-width="120"
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

    <v-col cols="auto" class="pa-0">
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        size="small"
        @click="goToNextDay"
        :disabled="!isNextDayAllowed"
        aria-label="Ngày hôm sau"
        color="medium-emphasis"
      ></v-btn>
    </v-col>

    <v-col cols="auto" v-if="!isTodaySelected" class="pa-0 pr-1">
          <v-btn
            variant="text"
            size="small"
            @click="goToToday"
            :disabled="!isTodayAllowed"
            color="medium-emphasis"
          >
            Hôm nay
          </v-btn>
      </v-col>

  </v-row>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useProgressStore } from '@/features/progress/stores/progressStore';
import { usePlanStore } from '@/features/plan/stores/planStore';
import dayjs from 'dayjs';
import 'dayjs/locale/vi'; 
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.locale('vi'); 
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const progressStore = useProgressStore();
const planStore = usePlanStore();

const datePickerMenu = ref(false);
const selectedDate = computed(() => progressStore.getSelectedDate); 
const pickerDate = ref(dayjs(selectedDate.value).toDate());

const planStartDate = computed(() => planStore.currentPlan?.startDate); 
const planEndDate = computed(() => planStore.currentPlan?.endDate); 
const today = computed(() => dayjs().format('YYYY-MM-DD'));

const displaySelectedDate = computed(() => {
  const current = dayjs(selectedDate.value);
  if (current.isSame(today.value, 'day')) {
    return 'Hôm nay';
  }
  if (current.isSame(dayjs(today.value).subtract(1, 'day'), 'day')) {
    return 'Hôm qua';
  }
  return current.format('DD/MM/YYYY');
});

const isTodaySelected = computed(() => selectedDate.value === today.value);

const isPreviousDayAllowed = computed(() => {
    if (!planStartDate.value) return true; 
    const prevDay = dayjs(selectedDate.value).subtract(1, 'day');
    return prevDay.isSameOrAfter(planStartDate.value, 'day');
});

const isNextDayAllowed = computed(() => {
    if (!planEndDate.value) return true; 
    const nextDay = dayjs(selectedDate.value).add(1, 'day');
    return nextDay.isSameOrBefore(planEndDate.value, 'day');
});

const isTodayAllowed = computed(() => {
     if (!planStartDate.value || !planEndDate.value) return true; 
     const todayObj = dayjs(today.value);
     return todayObj.isSameOrAfter(planStartDate.value, 'day') && todayObj.isSameOrBefore(planEndDate.value, 'day');
});

watch(selectedDate, (newDate) => {
    const newPickerDate = dayjs(newDate).toDate();
    if (newPickerDate.getTime() !== pickerDate.value?.getTime()) {
         pickerDate.value = newPickerDate;
    }
});

const selectDateFromPicker = (newDate) => {
  if (newDate) {
    const formattedDate = dayjs(newDate).format('YYYY-MM-DD');
    console.log("DateSelector: Date picked:", formattedDate);
    progressStore.setSelectedDate(formattedDate); 
  }
  datePickerMenu.value = false; 
};

const goToPreviousDay = () => {
  if (!isPreviousDayAllowed.value) return;
  const prevDate = dayjs(selectedDate.value).subtract(1, 'day').format('YYYY-MM-DD');
  progressStore.setSelectedDate(prevDate);
};

const goToNextDay = () => {
  if (!isNextDayAllowed.value) return;
  const nextDate = dayjs(selectedDate.value).add(1, 'day').format('YYYY-MM-DD');
  progressStore.setSelectedDate(nextDate);
};

const goToToday = () => {
   if (!isTodayAllowed.value) return;
   progressStore.setSelectedDate(today.value);
};

</script>

<style scoped>
.date-selector-controls {
  flex-wrap: nowrap; 
}
.v-btn {
  font-weight: 600; /* Chữ đậm hơn cho hợp theme */
}
/* Làm cho nút ngày chính (màu secondary) nổi bật hơn */
.v-btn[color="secondary"] {
    font-size: 0.9rem;
}
</style>