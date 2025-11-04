// File: src/main.js

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css' // Import CSS tùy chỉnh của bạn
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/auth' // <-- *** THÊM IMPORT STORE ***

// --- Theme Sáng Tùy Chỉnh (Giữ nguyên) ---
const myCustomLightTheme = {
  dark: false,
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    primary: '#FF6F00',
    'primary-darken-1': '#E65100',
    secondary: '#424242',
    'secondary-darken-1': '#212121',
    error: '#B00020',
    info: '#1976D2',
    success: '#388E3C',
    warning: '#FBC02D',
    'on-background': '#212121',
    'on-surface': '#212121',
    'on-primary': '#FFFFFF',
    'medium-emphasis': 'rgba(0, 0, 0, 0.6)',
    'disabled': 'rgba(0, 0, 0, 0.38)',
    'border': '#E0E0E0',
    'app-bar': '#FFFFFF',
    'primary-lighten-4': 'rgba(255, 111, 0, 0.1)',
  },
  variables: {
    'border-color': '#E0E0E0',
    'border-opacity': 0.8,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.06,
    'focus-opacity': 0.10,
    'selected-opacity': 0.08,
    'activated-opacity': 0.10,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
    'rounded-borders': 'lg',
    'code-font-family': '"Fira Code", monospace',
  }
}

// --- Theme Tối Tùy Chỉnh Cũ (Giữ lại để tham khảo) ---
const myCustomDarkTheme = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#FFA726',
    'primary-darken-1': '#FF8F00',
    secondary: '#B0BEC5',
    'secondary-darken-1': '#78909C',
    error: '#CF6679',
    info: '#64B5F6',
    success: '#81C784',
    warning: '#FFB74D',
    'on-background': '#E0E0E0',
    'on-surface': '#E0E0E0',
    'on-primary': '#000000',
    'medium-emphasis': 'rgba(255, 255, 255, 0.7)',
    'disabled': 'rgba(255, 255, 255, 0.38)',
    'border': '#424242',
    'app-bar': '#1E1E1E',
    'primary-lighten-4': 'rgba(255, 167, 38, 0.1)',
  },
  variables: {
    'border-color': '#424242',
    'border-opacity': 0.8,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.70,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.05,
    'hover-opacity': 0.08,
    'focus-opacity': 0.12,
    'selected-opacity': 0.10,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.16,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#343434',
    'theme-on-code': '#CCCCCC',
    'rounded-borders': 'lg',
    'code-font-family': '"Fira Code", monospace',
  }
}

// --- *** THÊM MỚI: THEME NEO FUTURISTIC *** ---
const neoFuturisticDark = {
  dark: true,
  colors: {
    // Màu nền chủ đạo (Đen xám đậm)
    background: '#1A1B25',
    // Màu nền cho Card, nổi khối nhẹ
    surface: '#1F202B', 
    
    // Màu nhấn Neon Pastel (chọn 1 màu làm primary/secondary)
    primary: '#A076F9',    // Tím Lavender
    secondary: '#70F8F8',  // Xanh Cyan

    // Bổ sung các màu neon khác để dùng tùy chỉnh
    'neon-yellow': '#F7DC6F',
    'neon-pink': '#F47BBD',
    'neon-purple': '#A076F9', // Giống primary
    'neon-cyan': '#70F8F8',   // Giống secondary
    'neon-green': '#63F28F',
    
    // Màu chữ & trạng thái
    'on-background': '#E0E0E0',
    'on-surface': '#FFFFFF',  // Chữ trên card nổi bật hơn
    'on-primary': '#FFFFFF',
    'on-secondary': '#1A1B25',
    'medium-emphasis': 'rgba(255, 255, 255, 0.7)',
    'disabled': 'rgba(255, 255, 255, 0.38)',
    
    // Màu viền
    'border': '#3A3C4A', // Viền tối, tinh tế

    // Các màu mặc định khác
    error: '#CF6679',
    info: '#64B5F6',
    success: '#63F28F', // Dùng màu neon green
    warning: '#F7DC6F', // Dùng màu neon yellow
    
    // Màu riêng (nếu cần)
    'app-bar': 'rgba(26, 27, 37, 0.8)', // App bar có thể hơi trong
  },
  variables: {
    // --- Thay đổi độ bo tròn ---
    // 'rounded-borders': 'xl', // xl = 16px
    'border-color': '#3A3C4A',
    'border-opacity': 0.8,
    
    // Opacity
    'high-emphasis-opacity': 1.0,   // Chữ rõ hơn
    'medium-emphasis-opacity': 0.70,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.05,
    'hover-opacity': 0.08,
    'focus-opacity': 0.12,
    'selected-opacity': 0.10,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.16,
    'dragged-opacity': 0.08,
    
    // Khác
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#343434',
    'theme-on-code': '#CCCCCC',
    'code-font-family': '"Fira Code", monospace',
  }
}


// --- Khởi tạo Vuetify ---

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    // *** SỬA Ở ĐÂY: Đặt theme mới làm mặc định ***
    defaultTheme: 'neoFuturisticDark', 
    themes: {
      myCustomLightTheme, 
      myCustomDarkTheme,  
      neoFuturisticDark, // *** Đăng ký theme mới
    },
  },
  // --- Định nghĩa các giá trị mặc định cho components ---
  defaults: {
    global: {
      ripple: true,
    },
    // *** SỬA Ở ĐÂY: Bo góc lớn hơn cho Card ***
    VCard: {
      elevation: 4,       // Tăng shadow để có hiệu ứng "nổi" mềm
      rounded: 'xl',      // 'xl' = 16px (lớn hơn 'lg' = 8px)
      variant: 'elevated',  // Dùng elevated thay vì flat/border
    },
    VSheet: {
       elevation: 0,
       rounded: 'xl', // 'xl' = 16px
       // border: true, // Bỏ border mặc định, dùng shadow hoặc glass
       color: 'surface' 
    },
    // *** SỬA Ở ĐÂY: Bo góc lớn hơn cho Button ***
    VBtn: {
      rounded: 'xl', // 'xl' = 16px
      elevation: 0, 
      style: 'text-transform: none; letter-spacing: normal; font-weight: 600;', // Chữ đậm hơn
    },
    // *** SỬA Ở ĐÂY: Bo góc lớn hơn cho Input ***
    VTextField: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'xl', // 'xl' = 16px
      color: 'primary',
    },
    VTextarea: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'xl', // 'xl' = 16px
        color: 'primary',
    },
    VSelect: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'xl', // 'xl' = 16px
        color: 'primary',
    },
    VCheckbox: {
        density: 'compact',
        color: 'primary',
    },
    // *** SỬA Ở ĐÂY: Bo góc lớn hơn cho Chip ***
    VChip: {
        rounded: 'xl', // 'xl' = 16px
        size: 'small',
    },
    VAlert: {
        rounded: 'xl', // 'xl' = 16px
        density: 'compact',
        variant: 'tonal',
    },
    VList: {
        bgColor: 'transparent',
    },
    VListItem: {
        rounded: 'lg', // 'lg' = 8px (vừa phải cho list item)
    },
    VDialog: {
        rounded: 'xl', // 'xl' = 16px
    },
    VMenu: {
        rounded: 'xl', // 'xl' = 16px
    }
  },
  // --- (Tùy chọn) Định nghĩa Typography (Font) ---
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", sans-serif', // Dùng font Inter/Poppins
    h1: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
    },
    // Các style khác dùng 'Inter'
  }
})

// --- Khởi tạo App Vue ---

const app = createApp(App)

// --- (PHẦN SỬA ĐỔI) ---
// 1. Khởi tạo Pinia MỘT LẦN
const pinia = createPinia()
// 2. Sử dụng plugin trên instance
pinia.use(piniaPluginPersistedstate) 

// 3. Sử dụng Pinia (đã cấu hình) cho app
app.use(pinia)
// --- (KẾT THÚC SỬA ĐỔI) ---

app.use(router)
app.use(vuetify) // Sử dụng Vuetify đã cấu hình


// --- (PHẦN THÊM MỚI) ---
// 4. Lấy store SAU KHI app đã use(pinia)
// (Truyền pinia instance để đảm bảo store được gắn đúng)
const authStore = useAuthStore(pinia);

// 5. Lắng nghe sự kiện storage từ các tab khác
window.addEventListener('storage', (event) => {
  // Nếu key là 'accessToken' (hoặc 'refreshToken') VÀ nó bị xóa (newValue là null)
  if (event.key === 'accessToken' && event.newValue === null) {
    console.log('Phát hiện logout từ tab khác. Đồng bộ...');
    
    // Chỉ gọi logout nếu state của tab này vẫn đang là "đã đăng nhập"
    if (authStore.isAuthenticated) {
      // Gọi hàm logout của store, hàm này sẽ dọn dẹp state và chuyển trang
      authStore.logout();
    }
  }
});
// --- (KẾT THÚC THÊM MỚI) ---


app.mount('#app')