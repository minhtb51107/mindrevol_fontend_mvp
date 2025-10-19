<template>
  <v-card class="elevation-3 pa-5">
    <div v-if="!isSuccess">
      <v-card-title class="text-center text-h5 mb-3">Quên Mật khẩu</v-card-title>
      <v-card-subtitle class="text-center text-medium-emphasis mb-6">
        Nhập email và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
      </v-card-subtitle>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form @submit.prevent="requestReset" ref="forgotPasswordForm">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-email-outline"
            :rules="[rules.required, rules.email]"
            placeholder="email@example.com"
            class="mb-3"
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="isLoading"
            :disabled="isLoading"
            class="mt-4"
          >
            Gửi liên kết
          </v-btn>
        </v-form>
        <div class="text-center mt-4">
          <RouterLink to="/login" class="text-primary text-body-2 text-decoration-none">Quay lại đăng nhập</RouterLink>
        </div>
      </v-card-text>
    </div>
    <div v-else class="text-center pa-5">
      <v-icon icon="mdi-email-check-outline" color="success" size="64" class="mb-4"></v-icon>
      <h3 class="text-h6 mb-2">Kiểm tra Email của bạn</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Nếu email <strong class="text-black">{{ email }}</strong> tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.
      </p>
      <v-btn color="primary" to="/login" variant="flat">Về trang đăng nhập</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { VCard, VCardTitle, VCardSubtitle, VCardText, VForm, VTextField, VBtn, VAlert, VIcon } from 'vuetify/components';

const authStore = useAuthStore();
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);
const forgotPasswordForm = ref(null);

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Email không hợp lệ.'
  },
};

const requestReset = async () => {
  const { valid } = await forgotPasswordForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.handleForgotPassword(email.value);
    isSuccess.value = true;
  } catch (error) {
    isSuccess.value = true;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.v-card {
  max-width: 500px;
  margin: auto;
}
.text-decoration-none {
  text-decoration: none;
}
</style>