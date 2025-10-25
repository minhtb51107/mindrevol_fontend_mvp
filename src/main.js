// File: src/main.js

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css' // Import CSS tùy chỉnh của bạn
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// --- Định nghĩa Theme tùy chỉnh ---

const myCustomLightTheme = {
  dark: false,
  colors: {
    background: '#F8F9FA', // Màu nền chính (hơi xám nhẹ)
    surface: '#FFFFFF',    // Màu nền cho Card, Sheet, v.v.
    primary: '#FF6F00',    // Màu cam chủ đạo (có thể đổi)
    'primary-darken-1': '#E65100', // Màu cam đậm hơn
    secondary: '#424242',  // Màu xám đậm cho text phụ, icon
    'secondary-darken-1': '#212121', // Xám đen hơn
    error: '#B00020',
    info: '#1976D2',      // Màu xanh dương đậm hơn một chút
    success: '#388E3C',    // Màu xanh lá cây đậm hơn một chút
    warning: '#FBC02D',    // Màu vàng đậm hơn
    'on-background': '#212121', // Màu chữ trên nền background
    'on-surface': '#212121',    // Màu chữ trên nền surface
    'on-primary': '#FFFFFF',    // Màu chữ trên nền primary
    'medium-emphasis': 'rgba(0, 0, 0, 0.6)', // Màu chữ nhấn vừa
    'disabled': 'rgba(0, 0, 0, 0.38)',       // Màu cho trạng thái disabled
    'border': '#E0E0E0',                    // Màu đường viền
    'app-bar': '#FFFFFF',                   // Màu riêng cho App Bar (nếu muốn)
    'primary-lighten-4': 'rgba(255, 111, 0, 0.1)', // Màu cho chip filter được chọn
  },
  variables: {
    'border-color': '#E0E0E0',
    'border-opacity': 0.8, // Giảm nhẹ opacity đường viền
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.06, // Giảm nhẹ hover opacity
    'focus-opacity': 0.10, // Giảm nhẹ focus opacity
    'selected-opacity': 0.08, // Giảm nhẹ selected opacity
    'activated-opacity': 0.10, // Giảm nhẹ activated opacity
    'pressed-opacity': 0.12, // Giảm nhẹ pressed opacity
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
    // --- Thay đổi độ bo tròn ---
    'rounded-borders': 'lg', // lg = 8px (có thể dùng 'xl' = 12px nếu muốn bo nhiều hơn)
    'code-font-family': '"Fira Code", monospace', // Font chữ cho code (tùy chọn)
  }
}

const myCustomDarkTheme = {
  dark: true,
  colors: {
    background: '#121212', // Nền đen sâu hơn
    surface: '#1E1E1E',    // Nền Card, Sheet tối
    primary: '#FFA726',    // Màu cam sáng hơn cho theme tối
    'primary-darken-1': '#FF8F00', // Cam đậm hơn trên nền tối
    secondary: '#B0BEC5',  // Xám xanh nhạt cho text phụ
    'secondary-darken-1': '#78909C',
    error: '#CF6679',
    info: '#64B5F6',      // Xanh dương sáng hơn
    success: '#81C784',    // Xanh lá cây sáng hơn
    warning: '#FFB74D',    // Vàng sáng hơn
    'on-background': '#E0E0E0', // Chữ sáng trên nền tối
    'on-surface': '#E0E0E0',
    'on-primary': '#000000',    // Chữ đen trên nền primary (cam sáng)
    'medium-emphasis': 'rgba(255, 255, 255, 0.7)', // Tăng độ sáng chữ nhấn vừa
    'disabled': 'rgba(255, 255, 255, 0.38)',
    'border': '#424242',       // Đường viền tối hơn
    'app-bar': '#1E1E1E',      // Màu App Bar tối
    'primary-lighten-4': 'rgba(255, 167, 38, 0.1)', // Màu chip filter tối
  },
  variables: {
    'border-color': '#424242',
    'border-opacity': 0.8,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.70, // Tăng nhẹ opacity
    'disabled-opacity': 0.38,
    'idle-opacity': 0.05, // Tăng nhẹ idle
    'hover-opacity': 0.08, // Tăng nhẹ hover
    'focus-opacity': 0.12,
    'selected-opacity': 0.10,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.16,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#343434',
    'theme-on-code': '#CCCCCC',
    // --- Độ bo tròn tương tự theme sáng ---
    'rounded-borders': 'lg',
    'code-font-family': '"Fira Code", monospace',
  }
}

// --- Khởi tạo Vuetify ---

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // Sử dụng Material Design Icons
  },
  theme: {
    defaultTheme: 'myCustomLightTheme', // Theme mặc định là sáng
    themes: {
      myCustomLightTheme, // Đăng ký theme sáng tùy chỉnh
      myCustomDarkTheme,  // Đăng ký theme tối tùy chỉnh
    },
  },
  // --- Định nghĩa các giá trị mặc định cho components ---
  defaults: {
    global: {
      ripple: true, // Bật hiệu ứng ripple mặc định
    },
    VCard: {
      elevation: 1,       // Giảm độ đổ bóng mặc định của Card
      rounded: 'lg',      // Sử dụng độ bo tròn đã định nghĩa ('lg')
      variant: 'flat',    // Thử nghiệm Card phẳng hơn
      border: true,       // Thêm viền nhẹ cho Card
    },
    VSheet: {
       elevation: 0,
       rounded: 'lg',
       border: true, // Thêm viền cho Sheet (ví dụ: phần chào mừng)
       color: 'surface' // Đảm bảo Sheet dùng màu surface
    },
    VBtn: {
      // rounded: 'lg', // Áp dụng bo tròn cho nút
      elevation: 0, // Nút phẳng hơn theo mặc định
      style: 'text-transform: none; letter-spacing: normal; font-weight: 500;', // Chữ thường, không cách chữ, đậm vừa
    },
    VTextField: {
      variant: 'outlined', // Kiểu viền ngoài
      density: 'compact',  // Mật độ gọn gàng
      rounded: 'lg',       // Bo tròn
      color: 'primary',    // Màu viền khi focus
    },
    VTextarea: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'lg',
        color: 'primary',
    },
    VSelect: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'lg',
        color: 'primary',
    },
    VCheckbox: {
        density: 'compact',
        color: 'primary',
    },
    VChip: {
        rounded: 'lg', // Bo tròn Chip
        // variant: 'tonal', // Chip có màu nền nhẹ (tùy chọn)
        size: 'small',    // Chip nhỏ hơn một chút
    },
    VAlert: {
        rounded: 'lg',
        density: 'compact',
        variant: 'tonal', // Alert có nền nhẹ
    },
    VList: {
        bgColor: 'transparent', // Nền list trong suốt theo mặc định
    },
    VListItem: {
        rounded: 'md', // Bo nhẹ các item trong list
    },
    VDialog: {
        // scrollable: true, // Dialog có thể cuộn nếu nội dung dài (tùy chọn)
    }
  },
  // --- (Tùy chọn) Định nghĩa Typography nếu muốn override font ---
  // typography: {
  //   fontFamily: '"Roboto", "Inter", sans-serif', // Thêm font dự phòng
  //   // ... (có thể override các style h1, h2, body1... ở đây)
  // }
})

// --- Khởi tạo App Vue ---

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify) // Sử dụng Vuetify đã cấu hình
app.mount('#app')