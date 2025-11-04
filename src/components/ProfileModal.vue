<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top"
  >
    {{ snackbar.text }}
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar.show = false">Đóng</v-btn>
    </template>
  </v-snackbar>

  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue')" persistent max-width="700px">
    <v-card rounded="lg">
      <v-card-title class="pa-4 bg-grey-lighten-3">
        <span class="text-h6">Tài khoản của tôi</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <div v-if="authStore.isLoadingProfile && !isUploading" class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Đang tải thông tin...</p>
      </div>

      <div v-else-if="authStore.profileError" class="pa-10 text-center">
         <v-icon icon="mdi-alert-circle-outline" color="error" size="64" class="mb-4"></v-icon>
         <h3 class="text-h6 mb-2">Lỗi tải thông tin</h3>
         <p class="text-medium-emphasis">{{ authStore.profileError }}</p>
         <v-btn color="primary" @click="authStore.fetchUserProfile" class="mt-4">Thử lại</v-btn>
      </div>
      
      <div v-else>
        <v-card-text class="pa-0">
          <v-tabs v-model="currentTab" bg-color="transparent" color="primary" grow>
            <v-tab value="info">
              <v-icon start>mdi-account-circle-outline</v-icon>
              Thông tin
            </v-tab>
            <v-tab value="security">
              <v-icon start>mdi-lock-outline</v-icon>
              Bảo mật
            </v-tab>
          </v-tabs>
          <v-divider></v-divider>

          <v-window v-model="currentTab">
            <v-window-item value="info">
              <v-form @submit.prevent="handleUpdateProfile" ref="profileFormRef">
                <v-card-text class="pa-5">
                  
                  <div class="d-flex align-center mb-5">
                    <v-avatar size="80" class="mr-4">
                      <v-img :src="localPreviewUrl || form.photoUrl || defaultAvatar" alt="Avatar"></v-img>
                    </v-avatar>
                    <div>
                       <v-file-input
                        v-model="selectedFiles"
                        label="Tải ảnh đại diện mới"
                        accept="image/png, image/jpeg, image/webp"
                        variant="outlined"
                        density="compact"
                        prepend-icon="mdi-camera-outline"
                        hide-details
                        @change="onFileSelect"
                        @click:clear="clearFileSelection"
                      ></v-file-input>
                       <span class="text-caption text-medium-emphasis">Nên dùng ảnh vuông (tối đa 2MB).</span>
                    </div>
                  </div>

                  <v-text-field
                    v-model="form.fullname"
                    label="Họ và tên *"
                    prepend-inner-icon="mdi-account-outline"
                    :rules="[rules.required]"
                    class="mb-4"
                  ></v-text-field>

                  <v-textarea
                    v-model="form.bio"
                    label="Giới thiệu"
                    prepend-inner-icon="mdi-text-account"
                    rows="3"
                    auto-grow
                    counter
                    maxlength="200"
                    placeholder="Chia sẻ một chút về bản thân..."
                  ></v-textarea>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions class="pa-4 bg-grey-lighten-4">
                  <v-spacer></v-spacer>
                  <v-btn 
                    color="primary" 
                    type="submit" 
                    variant="flat"
                    :loading="authStore.isLoadingProfile || isUploading"
                    :disabled="authStore.isLoadingProfile || isUploading"
                  >
                    Lưu thay đổi
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-window-item>

            <v-window-item value="security">
              <v-card-text class="pa-5">
                
                <div v-if="authStore.currentUser?.authProvider === 'LOCAL'">
                  <p class="text-body-1 mb-4">Bạn có thể thay đổi mật khẩu đăng nhập của mình tại đây.</p>
                  <v-btn
                    color="primary"
                    @click="openChangePasswordModal = true"
                    prepend-icon="mdi-lock-reset"
                    variant="flat"
                  >
                    Đổi mật khẩu
                  </v-btn>
                </div>
                
                <div v-else>
                   <p class="text-body-1 mb-2">Tài khoản của bạn hiện đang đăng nhập thông qua Google.</p>
                   <p class="text-medium-emphasis mb-4">
                     Bạn có thể tạo một mật khẩu riêng để đăng nhập bằng email và mật khẩu. 
                     Chúng tôi sẽ gửi một liên kết đến email <strong class="text-high-emphasis">{{ authStore.currentUser?.email }}</strong> để bạn tạo mật khẩu.
                   </p>
                  <v-btn
                    color="secondary"
                    @click="handleSetPasswordRequest"
                    prepend-icon="mdi-lock-plus-outline"
                    variant="flat"
                    :loading="isSendingEmail"
                  >
                    Gửi email tạo mật khẩu
                  </v-btn>
                </div>
                
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card-text>
      </div>
    </v-card>

    <ChangePasswordModal v-model="openChangePasswordModal" />
  </v-dialog>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import defaultAvatar from '@/assets/default-avatar.png';
import ChangePasswordModal from './ChangePasswordModal.vue';
import fileUploadService from '@/api/fileUploadService'; // Import dịch vụ upload

// Khai báo props và emits
const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

// Store
const authStore = useAuthStore();

// State chung
const currentTab = ref('info');
const profileFormRef = ref(null);
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
  timeout: 4000
});

// State cho Tab 1: Thông tin
const form = reactive({
  fullname: '',
  bio: '',
  photoUrl: ''
});
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
};
// Sửa: v-file-input trả về một mảng, nên ta init là mảng rỗng
const selectedFiles = ref([]); // (SỬA ĐỔI P4) Lưu file(s) người dùng chọn
const localPreviewUrl = ref(null); 
const isUploading = ref(false); 

// State cho Tab 2: Bảo mật
const openChangePasswordModal = ref(false);
const isSendingEmail = ref(false);


// Đồng bộ form khi modal mở hoặc profile thay đổi
watch(() => [props.modelValue, authStore.profile], ([newModelValue, newProfile]) => {
  if (newModelValue) {
    currentTab.value = 'info'; 
    
    // (SỬA ĐỔI P4) Reset trạng thái upload
    selectedFiles.value = []; // Reset về mảng rỗng
    localPreviewUrl.value = null;
    isUploading.value = false;

    if (newProfile) {
      form.fullname = newProfile.fullname || '';
      form.bio = newProfile.bio || '';
      form.photoUrl = newProfile.photoUrl || '';
    }
  }
}, { immediate: true, deep: true }); 


// (SỬA ĐỔI P4) Xử lý khi người dùng chọn file
const onFileSelect = (event) => {
  const file = event.target.files[0]; // Lấy file đầu tiên
  if (!file) {
    clearFileSelection();
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showSnackbar('File quá lớn. Vui lòng chọn ảnh dưới 2MB.', 'error');
    selectedFiles.value = []; // Xóa file khỏi v-model
    return;
  }
  
  // selectedFiles (v-model) đã được cập nhật tự động
  // Chỉ cần tạo link preview
  localPreviewUrl.value = URL.createObjectURL(file);
};

// (SỬA ĐỔI P4) Xử lý khi người dùng nhấn nút 'x' của v-file-input
const clearFileSelection = () => {
    selectedFiles.value = [];
    localPreviewUrl.value = null;
};


// (SỬA ĐỔI P4) Xử lý cập nhật profile
const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return;
  const { valid } = await profileFormRef.value.validate();
  if (!valid) return;

  const fileToUpload = selectedFiles.value[0]; // Lấy file từ v-model

  // 1. (MỚI) Xử lý upload ảnh nếu có file mới
  if (fileToUpload) {
    isUploading.value = true;
    
    // Tạo FormData
    const formData = new FormData();
    // Thêm file với key là "files" (số nhiều) để khớp backend
    formData.append('files', fileToUpload);

    try {
      // Gọi API upload VỚI CONTEXT 'avatar'
      const response = await fileUploadService.uploadFiles(formData, 'avatar');
      
      // ----- [BẮT ĐẦU SỬA LỖI LOGIC] -----
      // SỬA 1: Dữ liệu trả về từ axios nằm trong 'response.data'
      const fileList = response.data;
      
      // SỬA 2: Kiểm tra 'fileList' (là mảng) thay vì 'response' (là object)
      if (fileList && fileList.length > 0) {
        // SỬA 3: Lấy url từ 'fileList'
        form.photoUrl = fileList[0].url; 
      } else {
        throw new Error("Server không trả về URL file.");
      }
      // ----- [KẾT THÚC SỬA LỖI LOGIC] -----

    } catch (uploadError) {
      const message = uploadError.response?.data?.message || 'Tải ảnh lên thất bại.';
      showSnackbar(message, 'error');
      isUploading.value = false;
      return; // Dừng lại nếu upload lỗi
    } finally {
      isUploading.value = false;
    }
  }

  // 2. (Như cũ) Cập nhật thông tin profile (với photoUrl cũ hoặc mới)
  try {
    await authStore.updateUserProfile(form);
    showSnackbar('Cập nhật thông tin thành công!', 'success');
    clearFileSelection();
  } catch (updateError) {
     const message = updateError.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
     showSnackbar(message, 'error');
  }
};

// (HÀM TỪ P3 - Giữ nguyên) Xử lý gửi email tạo mật khẩu
const handleSetPasswordRequest = async () => {
  if (!authStore.currentUser?.email) {
    showSnackbar("Không tìm thấy email người dùng.", "error");
    return;
  }

  isSendingEmail.value = true;
  try {
    await authStore.handleForgotPassword(authStore.currentUser.email);
    showSnackbar(`Đã gửi email tạo mậtK_KHA_KHA_KHA_KHA_KHA_KHA khẩu đến ${authStore.currentUser.email}.`, 'success', 6000);
  } catch (error) {
    const message = error.response?.data?.message || 'Gửi email thất bại. Vui lòng thử lại.';
    showSnackbar(message, 'error');
  } finally {
    isSendingEmail.value = false;
  }
};

// (HÀM TỪ P3 - Giữ nguyên) Tiện ích hiển thị thông báo
const showSnackbar = (text, color = 'success', timeout = 4000) => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.timeout = timeout;
  snackbar.show = true;
};

</script>