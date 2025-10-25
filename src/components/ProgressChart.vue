<template>
  <v-card variant="outlined" rounded="xl" class="progress-chart-card">
    <v-card-item>
      <v-card-title class="text-h6 font-weight-medium d-flex align-center">
        Tiến độ 7 ngày
        <v-progress-circular v-if="progressStore.isChartLoading" indeterminate color="primary" size="20" width="2" class="ms-2"></v-progress-circular>
      </v-card-title>
      <v-card-subtitle>Tỷ lệ hoàn thành công việc</v-card-subtitle>
    </v-card-item>

    <v-card-text class="chart-container pa-2">
       <v-alert v-if="progressStore.errorChart" type="warning" variant="tonal" density="compact" class="ma-2" rounded="lg">
         {{ progressStore.errorChart }}
         <template v-slot:append>
             <v-btn icon="mdi-refresh" variant="text" size="small" @click="retryFetchChartData"></v-btn>
         </template>
       </v-alert>
       <v-skeleton-loader
            v-else-if="progressStore.isChartLoading && !chartSeries[0]?.data?.length"
            type="image"
            height="180"
            class="ma-2"
        ></v-skeleton-loader>
       <apexchart
           v-else-if="chartSeries[0]?.data?.length > 0"
           type="area"
           height="180"
           :options="chartOptions"
           :series="chartSeries"
           ref="realtimeChart"
       ></apexchart>
       <div v-else class="text-center py-8 text-medium-emphasis">
            <v-icon size="x-large" color="grey" class="mb-2">mdi-chart-line-variant</v-icon>
            <div>Chưa có dữ liệu tiến độ.</div>
             <v-btn variant="text" size="small" color="primary" @click="retryFetchChartData" class="mt-2">Thử lại</v-btn>
        </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProgressStore } from '@/stores/progress';
import VueApexCharts from 'vue3-apexcharts'; // Import component
import { useTheme } from 'vuetify'; // Import useTheme để lấy màu theme
import {
  VCard, VCardItem, VCardTitle, VCardSubtitle, VCardText, VIcon, VProgressCircular, VAlert, VSkeletonLoader, VBtn // Thêm VBtn
} from 'vuetify/components';

const apexchart = VueApexCharts; // Assign component locally
const progressStore = useProgressStore();
const theme = useTheme(); // Lấy theme hiện tại
const realtimeChart = ref(null); // Ref để truy cập instance chart

// Hàm format ngày cho trục X (ví dụ: "25/10")
const formatDateLabel = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Tùy chọn: Hiển thị Thứ nếu muốn (ví dụ: "T7 25/10")
        // const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        // return `${weekday} ${dayMonth}`;
        return dayMonth;
    } catch { return dateString; }
};

// Cấu hình biểu đồ ApexCharts
const chartOptions = computed(() => {
    const primaryColor = theme.current.value.colors.primary;
    const textColor = theme.current.value.colors['medium-emphasis'];
    const gridColor = theme.current.value.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'; // Điều chỉnh màu lưới

    return {
        chart: {
            id: 'progress-chart-7days', type: 'area', height: 180,
            parentHeightOffset: 0, toolbar: { show: false }, zoom: { enabled: false },
            fontFamily: 'inherit', background: 'transparent' // Nền trong suốt
        },
        colors: [primaryColor], dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100] } },
        grid: { show: true, borderColor: gridColor, strokeDashArray: 3, padding: { top: 5, right: 15, bottom: 0, left: 10 }, }, // Tăng padding phải
        xaxis: {
            type: 'category',
            categories: progressStore.chartData.map(item => formatDateLabel(item.date)),
            labels: { style: { colors: textColor, fontSize: '11px' }, offsetY: -2, },
            axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false },
        },
        yaxis: {
            min: 0, max: 100, tickAmount: 4,
            labels: { style: { colors: textColor, fontSize: '11px' }, formatter: (value) => `${Math.round(value)}%`, offsetX: -5 }, // Thêm offsetX
        },
        tooltip: {
            enabled: true, theme: theme.current.value.dark ? 'dark' : 'light',
            x: { show: false },
            y: { formatter: (value) => `${value != null ? parseFloat(value).toFixed(1) : 0}%`, title: { formatter: (seriesName) => 'Hoàn thành:' } }, // Xử lý value null
            marker: { show: true },
        },
        markers: { size: 4, colors: [primaryColor], strokeColors: theme.current.value.colors.surface, strokeWidth: 1, hover: { size: 6 } }, // stroke color theo nền
    };
});

// Dữ liệu series cho biểu đồ
const chartSeries = computed(() => [
    {
        name: 'Tỷ lệ hoàn thành',
        // Đảm bảo map trả về số hoặc null/undefined, không phải chuỗi rỗng
        data: progressStore.chartData.map(item => item.completionRate != null ? parseFloat(item.completionRate.toFixed(1)) : null),
    },
]);

// Hàm thử lại fetch data
const retryFetchChartData = () => {
    progressStore.fetchChartData();
};

onMounted(() => {
  if (progressStore.chartData.length === 0 || progressStore.errorChart) { // Fetch nếu chưa có hoặc có lỗi
      progressStore.fetchChartData();
  }
});

// Theo dõi data thay đổi để update chart (nếu cần thiết, thường ApexCharts tự động)
// watch(() => progressStore.chartData, (newData) => {
//   if (realtimeChart.value && newData.length > 0) {
//       realtimeChart.value.updateSeries([{ data: newData.map(item => item.completionRate != null ? parseFloat(item.completionRate.toFixed(1)) : null) }]);
//       realtimeChart.value.updateOptions({ xaxis: { categories: newData.map(item => formatDateLabel(item.date)) } });
//   }
// }, { deep: true });

</script>

<style scoped>
.progress-chart-card { display: flex; flex-direction: column; }
.chart-container { flex-grow: 1; min-height: 220px; /* Tăng chiều cao tối thiểu */ position: relative; }
.v-skeleton-loader { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 8px; /* Thêm padding */}
/* Căn chỉnh lại Alert */
.v-alert { font-size: 0.8rem; }
</style>