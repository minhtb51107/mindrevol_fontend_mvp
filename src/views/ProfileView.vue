<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        
        <v-snackbar
          v-model="showEmailSentAlert"
          color="success"
          timeout="5000"
          location="top"
        >
          Đã gửi email tạo mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
          <template v-slot:actions>
            <v-btn variant="text" @click="showEmailSentAlert = false">Đóng</v-btn>
          </template>
        </v-snackbar>
        
        <v-snackbar
          v-model="errorMessage"
          color="error"
          timeout="5000"
          location="top"
        >
          {{ errorMessage }}
          <template v-slot:actions>
            <v-btn variant="text" @click="errorMessage = ''">Đóng</v-btn>
          </template>
        </v-snackbar>

        <v-card class="pa-4">
          <v-card-title class="text-h5 mb-4">
            Quản lý tài khoản
          </v-card-title>
          
          <v-skeleton-loader v-if="authStore.isLoadingProfile" type="article"></v-skeleton-loader>
          
          <v-card-text v-else-if="authStore.userProfile">
            <h3 class="text-h6">Thông tin cá nhân</h3>
            <p class="text-medium-emphasis mb-4">Cập nhật thông tin cá nhân của bạn.</p>
            <v-text-field
              :model-value="authStore.userProfile.fullname"
              label="Họ và tên"
              class="mb-4"
              readonly
              hint="Chức năng cập nhật profile sẽ ở đây"
            ></v-text-field>
            <v-text-field
              :model-value="authStore.currentUser.email"
              label="Email"
              readonly
            ></v-text-field>
            
            <v-divider class="my-6"></v-divider>

            <h3 class="text-h6">Bảo mật</h3>
            <p class="text-medium-emphasis mb-4">Quản lý mật khẩu đăng nhập của bạn.</p>
            
            <v-btn
              v-if="authStore.currentUser?.authProvider === 'LOCAL'"
              color="primary"
              @click="showChangePasswordModal = true"
              prepend-icon="mdi-lock-reset"
            >
              Đổi mật khẩu
            </v-btn>
            
            <div v-else>
              <v-btn
                color="secondary"
                @click="handleSetPasswordRequest"
                prepend-icon="mdi-lock-plus-outline"
                :loading="isSendingEmail"
              >
                Tạo mật khẩu đăng nhập
              </v-btn>
              <p class="text-caption text-medium-emphasis mt-2">
                Tài khoản của bạn hiện đang đăng nhập qua Google. Tạo mật khẩu để có thể đăng nhập bằng email và mật khẩu.
              </p>
            </div>
            
            </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <ChangePasswordModal v-model="showChangePasswordModal" />

  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import ChangePasswordModal from '@/components/ChangePasswordModal.vue';
import { VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VBtn, VDivider, VTextField, VSkeletonLoader, VSnackbar } from 'vuetify/components';

const authStore = useAuthStore();

// State cho modal đổi mật khẩu (LOCAL)
const showChangePasswordModal = ref(false);

// State cho việc tạo mật khẩu (GOOGLE)
const isSendingEmail = ref(false);
const showEmailSentAlert = ref(false);
const errorMessage = ref('');


/**
 * Xử lý khi người dùng GOOGLE nhấn nút "Tạo mật khẩu".
 * Chúng ta sẽ tái sử dụng action `handleForgotPassword`
 * để gửi email đặt lại (cũng là "đặt mới") mật khẩu.
 */
const handleSetPasswordRequest = async () => {
  if (!authStore.currentUser?.email) {
    errorMessage.value = "Không tìm thấy email người dùng.";
    return;
  }

  isSendingEmail.value = true;
  errorMessage.value = '';
  try {
    // Gọi action "Quên mật khẩu" với email của người dùng hiện tại
    await authStore.handleForgotPassword(authStore.currentUser.email);
    // Hiển thị thông báo thành công
    showEmailSentAlert.value = true;
  } catch (error) {
    // Xử lý lỗi (ví dụ: lỗi mạng)
    if (error.response) {
      errorMessage.value = error.response.data?.message || 'Gửi email thất bại. Vui lòng thử lại.';
    } else if (error.request) {
      errorMessage.value = 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.';
    } else {
      errorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
  } finally {
    isSendingEmail.value = false;
  }
};
</script>