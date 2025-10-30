<template>
  <!-- 
    Sử dụng v-app và áp dụng theme. 
    Theme 'neoFuturisticDark' này được định nghĩa trong main.js 
  -->
  <v-app theme="neoFuturisticDark" class="neo-dashboard-wrapper">
    
    <!-- ============================================= -->
    <!-- 🧭 A. SIDEBAR (Các mục học tập & Thử thách) -->
    <!-- ============================================= -->
    <v-navigation-drawer
      permanent
      width="280"
      class="glass-effect"
      app
    >
      <!-- Profile Người dùng -->
      <v-list class="pa-4">
        <v-list-item
          :prepend-avatar="user.avatar"
          :title="user.name"
          :subtitle="user.title"
          class="pa-0"
        >
          <template v-slot:append>
            <v-btn icon="mdi-bell-outline" variant="text" size="small" color="grey-lighten-1"></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-divider class="mx-4 neon-divider"></v-divider>

      <!-- Menu Điều hướng chính -->
      <v-list density="compact" nav class="pa-4">
        <v-list-item prepend-icon="mdi-view-dashboard-variant-outline" title="Dashboard" rounded="lg" active></v-list-item>
        <v-list-item prepend-icon="mdi-compass-outline" title="Khám phá Thử thách" rounded="lg"></v-list-item>
        <v-list-item prepend-icon="mdi-trophy-outline" title="Tiến độ của tôi" rounded="lg"></v-list-item>
        <v-list-item prepend-icon="mdi-forum-outline" title="Cộng đồng" rounded="lg"></v-list-item>
      </v-list>

      <v-divider class="mx-4 neon-divider"></v-divider>

      <!-- Sub-menu: Mục tiêu học tập (Project) -->
      <v-list density="compact" nav class="pa-4">
        <v-list-subheader class="text-medium-emphasis">MỤC TIÊU HỌC TẬP</v-list-subheader>
        <v-list-item 
          v-for="goal in learningGoals" 
          :key="goal.id" 
          :title="goal.name"
          rounded="lg"
        >
          <template v-slot:prepend>
            <v-icon :color="goal.color" icon="mdi-circle-medium"></v-icon>
          </template>
        </v-list-item>
      </v-list>

      <!-- Nút Call-to-Action -->
      <template v-slot:append>
        <div class="pa-4">
          <v-btn 
            block 
            color="neon-cyan" 
            prepend-icon="mdi-plus" 
            class="add-project-btn"
            size="large"
          >
            Mục tiêu mới
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- ============================================= -->
    <!-- 📅 B. MAIN WORKSPACE (Timeline Hoạt động) -->
    <!-- ============================================= -->
    <v-main>
      <v-container fluid class="pa-6">
        <h1 class="text-h4 font-weight-bold mb-6">Hoạt động Tuần này</h1>
        
        <v-row>
          <!-- Cột cho mỗi ngày -->
          <v-col v-for="day in tasksByDay" :key="day.name" cols="12" md="6" lg="3">
            <h2 class="text-h6 font-weight-medium mb-3">{{ day.name }}</h2>
            
            <!-- Các Card (Plan/Task/Reflection) -->
            <div class="tasks-container">
              <v-card 
                v-for="task in day.tasks" 
                :key="task.id" 
                class="mb-4 task-card"
                :class="`neon-border-${task.color}`"
              >
                <v-card-text>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <v-chip :color="task.color" variant="tonal" label size="small">{{ task.type }}</v-chip>
                    <span class="text-caption text-medium-emphasis">{{ task.time }}</span>
                  </div>
                  
                  <h3 class="text-h6 font-weight-medium mb-4">{{ task.title }}</h3>
                  
                  <v-progress-linear 
                    :model-value="task.progress"
                    :color="task.color"
                    rounded
                    height="6"
                    class="mb-4"
                  ></v-progress-linear>
                  
                  <div class="d-flex justify-space-between align-center">
                    <!-- Avatars -->
                    <v-avatar-group size="32">
                      <v-avatar v-for="avatar in task.avatars" :key="avatar" :image="avatar"></v-avatar>
                    </v-avatar-group>
                    
                    <!-- Nút -->
                    <v-btn 
                      v-if="task.action === 'join'" 
                      variant="tonal" 
                      color="white" 
                      size="small"
                    >
                      Tham gia
                    </v-btn>
                    <v-btn 
                      v-if="task.action === 'reflect'" 
                      variant="text" 
                      color="grey-lighten-1" 
                      size="small"
                    >
                      Phản ánh
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- ============================================= -->
    <!-- 📊 C. FOOTER / INSIGHTS (Tiến độ, Streak) -->
    <!-- ============================================= -->
    <v-footer app height="220" class="footer-insights glass-effect">
      <v-container fluid>
        <v-row>
          <!-- Cột "Phản ánh gần đây" -->
          <v-col cols="12" md="4">
            <h3 class="text-subtitle-1 font-weight-medium mb-3">Phản ánh gần đây</h3>
            <v-card 
              v-for="reflection in recentReflections" 
              :key="reflection.id"
              class="mb-2 insight-card" 
              variant="outlined"
            >
              <v-list-item :title="reflection.title" :subtitle="reflection.date" class="py-2">
                <template v-slot:prepend>
                  <v-icon :color="reflection.color" icon="mdi-lightbulb-on-outline"></v-icon>
                </template>
              </v-list-item>
            </v-card>
          </v-col>
          
          <!-- Cột "Thống kê Nhóm" -->
          <v-col cols="12" md="8">
            <h3 class="text-subtitle-1 font-weight-medium mb-3">Thống kê & Cảm xúc</h3>
            <v-row>
              <!-- Card Thống kê (Streak) -->
              <v-col cols="12" sm="4">
                <v-card class="d-flex flex-column justify-center align-center pa-4 text-center fill-height insight-card" variant="outlined">
                  <div class="text-h3 font-weight-bold neon-text-green">{{ streak }} 🔥</div>
                  <div class="text-caption text-medium-emphasis mt-1">Ngày streak hiện tại</div>
                </v-card>
              </v-col>
              <!-- Biểu đồ (Cảm xúc) -->
              <v-col cols="12" sm="8">
                <v-card class="pa-2 fill-height insight-card" variant="outlined">
                  <!-- Sử dụng component apexchart -->
                  <apexchart
                    type="donut"
                    height="150"
                    :options="chartOptions"
                    :series="chartSeries"
                  ></apexchart>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

  </v-app>
</template>

<script setup>
import { ref } from 'vue';
// Import ApexCharts
import apexchart from 'vue3-apexcharts';

// --- Dữ liệu giả lập (Mock Data) ---

// A. Sidebar
const user = ref({
  avatar: 'https://avatar.iran.liara.run/public/boy?username=MindRevol',
  name: 'Mind Revol',
  title: 'Người học trọn đời',
});

const learningGoals = ref([
  { id: 1, name: 'Học Vue 3 Reactivity', color: 'neon-yellow' },
  { id: 2, name: 'Thử thách Python 30 ngày', color: 'neon-pink' },
  { id: 3, name: 'Thiết kế hệ thống', color: 'neon-cyan' },
]);

// B. Main Workspace
const tasksByDay = ref([
  {
    name: 'Hôm nay (Thứ 5)',
    tasks: [
      { id: 1, title: 'Hoàn thành Module 1 Vue', time: '9:00 AM - 11:00 AM', type: 'Học tập', color: 'neon-yellow', progress: 75, avatars: ['https://avatar.iran.liara.run/public/girl?username=Ana'], action: 'reflect' },
      { id: 2, title: 'Check-in Thử thách Python', time: '11:30 AM', type: 'Check-in', color: 'neon-pink', progress: 100, avatars: ['https://avatar.iran.liara.run/public/boy?username=Max', 'https://avatar.iran.liara.run/public/girl?username=Mia'], action: 'join' },
    ]
  },
  {
    name: 'Ngày mai (Thứ 6)',
    tasks: [
      { id: 3, title: 'Buổi học nhóm Thiết kế CSDL', time: '2:00 PM', type: 'Học nhóm', color: 'neon-cyan', progress: 0, avatars: ['https://avatar.iran.liara.run/public/boy?username=Tom'], action: 'join' },
    ]
  },
  {
    name: 'Thứ 7',
    tasks: [
      { id: 4, title: 'Viết phản ánh tuần', time: 'Cả ngày', type: 'Phản ánh', color: 'neon-purple', progress: 0, avatars: [], action: 'reflect' },
    ]
  },
  {
    name: 'Chủ Nhật',
    tasks: []
  },
]);

// C. Footer Insights
const recentReflections = ref([
  { id: 1, title: 'Tuần 1: Hiểu về "state"', date: '29/10/2025', color: 'neon-yellow' },
  { id: 2, title: 'Data Structures (Python)', date: '28/10/2025', color: 'neon-pink' },
]);

const streak = ref(12);

// D. Dữ liệu giả lập cho biểu đồ (ApexCharts)
const chartSeries = ref([44, 55, 13, 8]);
const chartOptions = ref({
  chart: { type: 'donut', background: 'transparent' },
  theme: { mode: 'dark' },
  labels: ['Tập trung', 'Vui vẻ', 'Hơi mệt', 'Bối rối'],
  colors: ['#70F8F8', '#63F28F', '#F7DC6F', '#F47BBD'], // neon-cyan, neon-green, neon-yellow, neon-pink
  dataLabels: { enabled: false },
  legend: {
    position: 'left',
    offsetY: 20,
    labels: {
      colors: '#E0E0E0' // Màu chữ legend
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Cảm xúc',
            color: '#E0E0E0',
            formatter: () => 'Tuần này'
          },
          value: {
            show: false,
          }
        }
      }
    }
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: (val) => `${val} lượt`,
    }
  },
  stroke: { show: false }, // Tắt viền giữa các miếng
});

</script>

<style scoped>
/* Style scoped chỉ áp dụng cho component này.
  Nó đảm bảo không ảnh hưởng đến các trang khác của bạn.
*/

/* Ghi đè font chữ cho riêng trang này */
.neo-dashboard-wrapper {
  font-family: 'Inter', 'Poppins', sans-serif !important;
}

/* ============================================= */
/* A. SIDEBAR STYLES */
/* ============================================= */
.glass-effect {
  /* Nền mờ, màu hơi sáng */
  background-color: rgba(31, 32, 43, 0.8) !important; /* #1F202B với 80% opacity */
  /* Lọc mờ nền phía sau */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  /* Viền sáng tinh tế (như trong spec) */
  border-right: 1px solid rgba(58, 60, 74, 0.5) !important; /* #3A3C4A */
}

.neon-divider {
  border-color: rgba(58, 60, 74, 0.5) !important;
}

/* Style cho item đang active */
.v-list-item--active {
  background-color: rgba(var(--v-theme-neon-cyan), 0.15) !important;
  color: rgb(var(--v-theme-neon-cyan));
}
.v-list-item--active .v-icon {
  color: rgb(var(--v-theme-neon-cyan));
}

.add-project-btn {
  /* Màu chữ tối để tương phản với nền cyan */
  color: #1A1B25 !important; 
  font-weight: 700;
  letter-spacing: 0.5px;
  /* Hiệu ứng neon glow (như trong spec) */
  box-shadow: 0 0 12px rgba(var(--v-theme-neon-cyan), 0.4), 
              0 0 20px rgba(var(--v-theme-neon-cyan), 0.2);
}

/* ============================================= */
/* B. MAIN WORKSPACE STYLES */
/* ============================================= */
.tasks-container {
  /* Thêm để có thể cuộn các task nếu cột quá cao */
  /* 100vh - header (64px) - footer (220px) - padding (24*2) - title (40+24) */
  max-height: calc(100vh - 64px - 220px - 48px - 64px); 
  overflow-y: auto;
  padding-right: 8px; /* Thêm padding cho thanh cuộn */
}

.task-card {
  /* Soft Neumorphism (bóng đổ mềm, bo tròn lớn) */
  background-color: #1F202B; /* Màu surface */
  border-radius: 20px !important; /* Bo tròn lớn như spec (16-24px) */
  border: 1px solid #3A3C4A; /* Viền tối */
  /* Bóng đổ mềm (như spec) */
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.task-card:hover {
  /* Hiệu ứng hover (như spec) */
  transform: scale(1.02);
  box-shadow: 0px 12px 35px rgba(0, 0, 0, 0.25);
}

/* Viền màu neon (dùng border-left cho tinh tế) */
.neon-border-neon-yellow { border-left: 4px solid rgb(var(--v-theme-neon-yellow)); }
.neon-border-neon-pink { border-left: 4px solid rgb(var(--v-theme-neon-pink)); }
.neon-border-neon-cyan { border-left: 4px solid rgb(var(--v-theme-neon-cyan)); }
.neon-border-neon-purple { border-left: 4px solid rgb(var(--v-theme-neon-purple)); }
.neon-border-neon-green { border-left: 4px solid rgb(var(--v-theme-neon-green)); }

/* ============================================= */
/* C. FOOTER INSIGHTS STYLES */
/* ============================================= */
.footer-insights {
  /* Dùng chung style với sidebar */
  border-top: 1px solid rgba(58, 60, 74, 0.5) !important; /* #3A3C4A */
  padding: 16px;
  overflow: hidden;
}

.insight-card {
  background-color: rgba(31, 32, 43, 0.5) !important; /* #1F202B */
  border: 1px solid #3A3C4A;
  border-radius: 20px !important;
  height: 100%;
}

.neon-text-green {
  color: rgb(var(--v-theme-neon-green)) !important;
  text-shadow: 0 0 8px rgba(var(--v-theme-neon-green), 0.7) !important;
}
</style>
