// File: src/main.js

// Import CSS của Vuetify và Material Design Icons
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Import các thành phần Vue và Pinia
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// (Optional) Import CSS cũ nếu bạn muốn giữ lại một phần, nhưng nên xóa dần
// import "bootstrap/dist/css/bootstrap.min.css"
// import "bootstrap-icons/font/bootstrap-icons.css"

// Khởi tạo Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // Sử dụng Material Design Icons làm mặc định
  },
  // Bạn có thể thêm cấu hình theme (màu sắc, font, etc.) ở đây
  // theme: {
  //   defaultTheme: 'light',
  //   themes: {
  //     light: {
  //       colors: {
  //         primary: '#1976D2', // Màu xanh dương làm màu chính
  //         secondary: '#424242',
  //         accent: '#82B1FF',
  //         error: '#FF5252',
  //         info: '#2196F3',
  //         success: '#4CAF50',
  //         warning: '#FFC107',
  //       },
  //     },
  //   },
  // },
})

// Khởi tạo ứng dụng Vue
const app = createApp(App)

// Sử dụng Pinia, Router và Vuetify
app.use(createPinia())
app.use(router)
app.use(vuetify)

// Mount ứng dụng vào DOM
app.mount('#app')

// (Optional) Không cần import "bootstrap" JS nữa nếu dùng hoàn toàn Vuetify