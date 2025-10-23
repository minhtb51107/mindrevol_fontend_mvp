<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-2 pa-5">
          <v-card-title class="text-h5 mb-6">Thông tin cá nhân</v-card-title>
          <v-card-text>
            <div v-if="authStore.isLoadingProfile && !authStore.profile" class="text-center py-10">
              <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
              <p class="mt-3 text-medium-emphasis">Đang tải thông tin...</p>
            </div>

            <v-alert v-else-if="authStore.profileError && !authStore.profile" type="error" density="compact" class="mb-4">
              {{ authStore.profileError }}. Vui lòng thử lại sau.
            </v-alert>

            <div v-else-if="authStore.profile">
              <v-alert
                v-if="successMessage"
                type="success" density="compact" class="mb-4" closable @click:close="successMessage = ''">
                {{ successMessage }}
              </v-alert>
               <v-alert
                v-if="errorMessage"
                type="error" density="compact" class="mb-4" closable @click:close="errorMessage = ''">
                {{ errorMessage }}
              </v-alert>

              <div class="text-center mb-5">
                  <v-avatar :image="avatarPreview || defaultAvatar" size="120" color="grey-lighten-3" class="elevation-1 profile-avatar">
                     <template v-slot:error>
                        <span class="text-h4 text-grey-darken-1">{{ authStore.userInitial }}</span>
                     </template>
                     <span v-if="!avatarPreview" class="text-h4 text-grey-darken-1">{{ authStore.userInitial }}</span>
                  </v-avatar>
              </div>

              <v-form @submit.prevent="updateProfile" ref="profileFormRef">
                <v-text-field
                  :model-value="profileForm.email"
                  label="Email" variant="outlined" density="compact" readonly disabled class="mb-3" prepend-inner-icon="mdi-email-outline">
                </v-text-field>

                <v-text-field
                  v-model="profileForm.fullname"
                  label="Họ và tên *" variant="outlined" density="compact" :rules="[rules.required, rules.minLength(2)]" class="mb-3" prepend-inner-icon="mdi-account-outline" counter="100" maxlength="100">
                </v-text-field>

                <v-text-field
                  v-model="profileForm.photoUrl"
                  label="URL Ảnh đại diện (tùy chọn)" variant="outlined" density="compact" class="mb-3" prepend-inner-icon="mdi-image-outline" placeholder="https://..." clearable @update:model-value="updateAvatarPreview">
                </v-text-field>

                <v-text-field
                  :model-value="profileForm.userTypeDisplay"
                  label="Loại tài khoản" variant="outlined" density="compact" readonly disabled class="mb-3" prepend-inner-icon="mdi-account-tie-outline">
                </v-text-field>

                <v-text-field
                  :model-value="profileForm.statusDisplay"
                  label="Trạng thái" variant="outlined" density="compact" readonly disabled class="mb-3" prepend-inner-icon="mdi-check-decagram-outline">
                </v-text-field>

                <v-btn type="submit" color="primary" size="large" :loading="isLoadingUpdate" :disabled="isLoadingUpdate || !isFormChanged" class="mt-4">
                  Lưu thay đổi
                </v-btn>
              </v-form>
            </div>

            <div v-else class="text-center text-medium-emphasis py-5">
               Không thể tải thông tin cá nhân.
             </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VProgressCircular, VAvatar } from 'vuetify/components';

const authStore = useAuthStore();
const profileFormRef = ref(null);
// Default SVG Avatar (simple user icon)
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2JkYmRiZCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYuMjItMy4yMy4wMi0uOTggMS45OC0xLjgyIDQuMjItMi40MSAxLjEzLjM1IDIuMzkuNTYgMy43OC41NnMyLjY1LS4yMSAzLjc4LS41NmMyLjI0LjU5IDQuMiAxLjQ0IDQuMiAyLjQxLTEuNTEgMi45NS0zLjcyIDMuMjMtNi4yMiAzLjIzeiIvPjwvc3ZnPg==';

const profileForm = reactive({
  email: '',
  fullname: '',
  photoUrl: '',
  userType: '',
  status: '',
  // Computed properties for display text
  userTypeDisplay: computed(() => profileForm.userType === 'CUSTOMER' ? 'Khách hàng' : (profileForm.userType === 'EMPLOYEE' ? 'Nhân viên' : 'Không xác định')),
  statusDisplay: computed(() => profileForm.status === 'ACTIVE' ? 'Đang hoạt động' : (profileForm.status === 'PENDING_ACTIVATION' ? 'Chờ kích hoạt' : 'Đã khóa')),
});

const originalProfileData = ref({});
const avatarPreview = ref('');
const isLoadingUpdate = ref(false); // Loading state specifically for update action
const errorMessage = ref('');
const successMessage = ref('');

// Rules
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minLength: (length) => value => (!value || value.length >= length) || `Ít nhất ${length} ký tự.`,
  // Basic URL check (optional, can be improved)
  // url: value => (!value || /^(https?:\/\/).*/.test(value)) || 'URL không hợp lệ.',
};

// Check if form data differs from original
const isFormChanged = computed(() => {
    // Treat null/undefined/empty string as the same for photoUrl comparison
    const originalPhoto = originalProfileData.value.photoUrl || '';
    const currentPhoto = profileForm.photoUrl || '';
    return profileForm.fullname !== originalProfileData.value.fullname ||
           currentPhoto !== originalPhoto;
});

// Populate form from store data
const populateForm = (profileData) => {
    if (profileData) {
        profileForm.email = profileData.email || '';
        profileForm.fullname = profileData.fullname || '';
        profileForm.photoUrl = profileData.photoUrl || '';
        profileForm.userType = profileData.userType || '';
        profileForm.status = profileData.status || '';
        // Store original data for change comparison
        originalProfileData.value = { fullname: profileForm.fullname, photoUrl: profileForm.photoUrl || '' };
        avatarPreview.value = profileForm.photoUrl; // Update preview
    } else {
        // Reset form if profile data is null
        profileForm.email = '';
        profileForm.fullname = '';
        profileForm.photoUrl = '';
        profileForm.userType = '';
        profileForm.status = '';
        originalProfileData.value = {};
        avatarPreview.value = '';
    }
};

// Watch for changes in the store's profile data
watch(() => authStore.profile, (newProfile) => {
    console.log("Profile changed in store:", newProfile);
    populateForm(newProfile);
}, { immediate: true, deep: true }); // Use deep watch if profile object structure might change internally

onMounted(async () => {
    // Attempt to fetch profile if not available and not already loading
    if (!authStore.profile && !authStore.isLoadingProfile) {
        console.log("Profile not found on mount, fetching...");
        await authStore.fetchUserProfile();
        // populateForm(authStore.profile); // Watcher will handle this
    } else {
        console.log("Profile found on mount or already loading.");
        // Ensure form is populated even if watcher didn't trigger initially
        populateForm(authStore.profile);
    }
});

// Update avatar preview immediately when URL input changes
const updateAvatarPreview = (newUrl) => {
    avatarPreview.value = newUrl || '';
};

// Handle profile update submission
const updateProfile = async () => {
    if (!profileFormRef.value) return;
    const { valid } = await profileFormRef.value.validate();
    if (!valid || !isFormChanged.value) {
        if (!isFormChanged.value) {
            errorMessage.value = "Bạn chưa thay đổi thông tin nào.";
        }
        return;
    }

    isLoadingUpdate.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
        const dataToUpdate = {
            fullname: profileForm.fullname,
            photoUrl: profileForm.photoUrl || null, // Send null if empty
        };
        const updatedProfile = await authStore.updateUserProfile(dataToUpdate);
        populateForm(updatedProfile); // Re-populate form with response and update original data
        successMessage.value = "Cập nhật thông tin thành công!";
    } catch (error) {
        errorMessage.value = authStore.profileError || 'Có lỗi xảy ra, vui lòng thử lại.';
    } finally {
        isLoadingUpdate.value = false;
    }
};
</script>

<style scoped>
.profile-avatar {
    border: 3px solid white;
}
/* Thêm CSS tùy chỉnh nếu cần */
</style>