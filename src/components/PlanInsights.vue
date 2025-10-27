<!-- <template>
  <v-sheet
    class="pa-4 neo-insights-footer"
    rounded="lg"
    border
    height="100%"
  >
    <h2 class="text-subtitle-1 font-weight-medium mb-3">
      <v-icon start color="grey-lighten-1">mdi-chart-line</v-icon>
      Team Insights
    </h2>

    <ProgressChart v-if="planId" :plan-id="planId" />

    <div
      v-else
      class="d-flex align-center justify-center text-caption text-medium-emphasis pa-4"
      style="height: 200px"
    >
      Không thể tải thống kê (thiếu Plan ID).
    </div>
  </v-sheet>
</template>

<script setup>
// Import component biểu đồ đã có
import ProgressChart from '@/components/ProgressChart.vue';

// Component này cần planId để truyền cho ProgressChart
defineProps({
  planId: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.neo-insights-footer {
  /* Style tương tự PlanSidebar để đồng bộ */
  background-color: rgba(
    var(--v-theme-surface-variant),
    0.3
  ); /* Hơi trong suốt */
  backdrop-filter: blur(10px);
  border-color: rgba(var(--v-border-color), 0.3) !important;
  overflow: hidden; /* Đảm bảo chart không bị tràn */
}
</style> -->