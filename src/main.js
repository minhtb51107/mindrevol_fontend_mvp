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

// Cập nhật đường dẫn store
import { useAuthStore } from '@/features/auth/stores/authStore'

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

// --- THEME NEO FUTURISTIC ---
const neoFuturisticDark = {
  dark: true,
  colors: {
    background: '#1A1B25',
    surface: '#1F202B',
    primary: '#A076F9',
    secondary: '#70F8F8',
    'neon-yellow': '#F7DC6F',
    'neon-pink': '#F47BBD',
    'neon-purple': '#A076F9',
    'neon-cyan': '#70F8F8',
    'neon-green': '#63F28F',
    'on-background': '#E0E0E0',
    'on-surface': '#FFFFFF',
    'on-primary': '#FFFFFF',
    'on-secondary': '#1A1B25',
    'medium-emphasis': 'rgba(255, 255, 255, 0.7)',
    'disabled': 'rgba(255, 255, 255, 0.38)',
    'border': '#3A3C4A',
    error: '#CF6679',
    info: '#64B5F6',
    success: '#63F28F',
    warning: '#F7DC6F',
    'app-bar': 'rgba(26, 27, 37, 0.8)',
  },
  variables: {
    'border-color': '#3A3C4A',
    'border-opacity': 0.8,
    'high-emphasis-opacity': 1.0,
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
    defaultTheme: 'neoFuturisticDark',
    themes: {
      myCustomLightTheme,
      myCustomDarkTheme,
      neoFuturisticDark,
    },
  },
  defaults: {
    global: {
      ripple: true,
    },
    VCard: {
      elevation: 4,
      rounded: 'xl',
      variant: 'elevated',
    },
    VSheet: {
      elevation: 0,
      rounded: 'xl',
      color: 'surface'
    },
    VBtn: {
      rounded: 'xl',
      elevation: 0,
      style: 'text-transform: none; letter-spacing: normal; font-weight: 600;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'xl',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'xl',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'xl',
      color: 'primary',
    },
    VCheckbox: {
      density: 'compact',
      color: 'primary',
    },
    VChip: {
      rounded: 'xl',
      size: 'small',
    },
    VAlert: {
      rounded: 'xl',
      density: 'compact',
      variant: 'tonal',
    },
    VList: {
      bgColor: 'transparent',
    },
    VListItem: {
      rounded: 'lg',
    },
    VDialog: {
      rounded: 'xl',
    },
    VMenu: {
      rounded: 'xl',
    }
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", sans-serif',
    h1: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Poppins", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Poppins", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Poppins", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Poppins", sans-serif', fontWeight: 600 },
  }
})

// --- Khởi tạo App Vue ---
const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(vuetify)

// Lấy store sau khi app đã use(pinia)
const authStore = useAuthStore(pinia)

// Lắng nghe sự kiện storage từ các tab khác để đồng bộ logout
window.addEventListener('storage', (event) => {
  if (event.key === 'accessToken' && event.newValue === null) {
    console.log('Phát hiện logout từ tab khác. Đồng bộ...');
    if (authStore.isAuthenticated) {
      authStore.logout();
    }
  }
});

app.mount('#app')