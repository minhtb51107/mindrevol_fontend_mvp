<template>
  <v-card class="pa-5 pa-md-6">
    <div v-if="!isSuccess">
      <v-card-title class="text-center text-h5 mb-6">Tạo tài khoản</v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
          rounded="lg"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form @submit.prevent="handleRegister" ref="registerForm">
          <v-text-field
            v-model="form.fullname"
            label="Họ và tên *"
            prepend-inner-icon="mdi-account-outline"
            :rules="[rules.required]"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="form.email"
            label="Email *"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            :rules="[rules.required, rules.email]"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="form.phoneNumber"
            label="Số điện thoại *"
            type="tel"
            prepend-inner-icon="mdi-phone-outline"
            :rules="[rules.required]"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="form.password"
            label="Mật khẩu *"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[rules.required, rules.minLength(8)]"
            class="mb-4"
            hint="Ít nhất 8 ký tự"
            persistent-hint
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="isLoading"
            :disabled="isLoading"
            class="mt-5 mb-5"
            rounded="lg"
            elevation="2"
          >
            Đăng ký
          </v-btn>
        </v-form>
        <div class="text-center mt-4">
          <p class="text-body-2">
            Đã có tài khoản?
            <RouterLink to="/login" class="text-primary text-decoration-none font-weight-medium"> Đăng nhập</RouterLink>
          </p>
        </div>
      </v-card-text>
    </div>

    <div v-else class="text-center pa-5">
       <v-icon icon="mdi-email-check-outline" color="success" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Đăng ký thành công!</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Chúng tôi đã gửi một liên kết kích hoạt đến email <strong class="text-black">{{ form.email }}</strong>.
        Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam) để hoàn tất.
      </p>
      <v-btn color="primary" to="/login" variant="flat" rounded="lg">Về trang đăng nhập</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
// [CẬP NHẬT] Chỉ cần sửa đường dẫn store
import { useAuthStore } from '@/features/auth/stores/authStore';
import { VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VIcon } from 'vuetify/components';

const authStore = useAuthStore();
const registerForm = ref(null);

const form = reactive({
  fullname: '',
  email: '',
  phoneNumber: '',
  password: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);
const showPassword = ref(false);

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Email không hợp lệ.'
  },
  minLength: (length) => value => (value && value.length >= length) || `Ít nhất ${length} ký tự.`,
};

const handleRegister = async () => {
  if (!registerForm.value) return;
  const { valid } = await registerForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.register(form);
    isSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.text-decoration-none { text-decoration: none; }
</style>