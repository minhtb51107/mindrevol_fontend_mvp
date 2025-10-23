import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

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
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'on-background': '#212121',
    'on-surface': '#212121',
    'on-primary': '#FFFFFF',
    'medium-emphasis': 'rgba(0, 0, 0, 0.6)',
    'disabled': 'rgba(0, 0, 0, 0.38)',
    'border': '#E0E0E0',
  },
  variables: {
    'border-color': '#E0E0E0',
    'border-opacity': 1,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.08,
    'focus-opacity': 0.12,
    'selected-opacity': 0.10,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.16,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
    'rounded-borders': 'lg',
  }
}

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
    info: '#2196F3',
    success: '#66BB6A',
    warning: '#FB8C00',
    'on-background': '#E0E0E0',
    'on-surface': '#E0E0E0',
    'on-primary': '#000000',
    'medium-emphasis': 'rgba(255, 255, 255, 0.7)', // Tăng nhẹ opacity cho dễ đọc hơn
    'disabled': 'rgba(255, 255, 255, 0.38)',
    'border': '#424242',
  },
  variables: {
    'border-color': '#424242',
    'border-opacity': 1,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.70, // Tăng nhẹ
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
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
  }
}

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
      myCustomDarkTheme,
    },
  },
  defaults: {
    global: {
      ripple: { class: 'text-grey' }
    },
    VCard: {
      elevation: 1,
      rounded: 'lg',
    },
    VSheet: {
       elevation: 0,
       rounded: 'lg',
    },
    VBtn: {
      style: 'text-transform: none; letter-spacing: normal;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'lg',
    },
    VTextarea: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'lg',
    },
    VSelect: {
        variant: 'outlined',
        density: 'compact',
        rounded: 'lg',
    },
    VCheckbox: {
        density: 'compact',
        color: 'primary',
    },
    VChip: {
        rounded: 'lg',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: '3rem', letterSpacing: '-0.015625em' },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: '2.5rem', letterSpacing: '-0.0083333333em' },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: '2.25rem', letterSpacing: '0em' },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: '2rem', letterSpacing: '0.0073529412em' },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '1.625rem', letterSpacing: '0em' },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: '1.5rem', letterSpacing: '0.0125em' },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: '1.75rem', letterSpacing: '0.009375em' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.375rem', letterSpacing: '0.0071428571em' },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.5rem', letterSpacing: '0.03125em' },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem', letterSpacing: '0.0178571429em' },
    button: { fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.25rem', letterSpacing: '0.0892857143em', textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: '1.25rem', letterSpacing: '0.0333333333em' },
    overline: { fontSize: '0.75rem', fontWeight: 600, lineHeight: '2rem', letterSpacing: '0.1666666667em', textTransform: 'uppercase' },
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')