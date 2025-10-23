<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue')" persistent max-width="600px">
    <v-card rounded="lg">
      <v-card-title class="pa-4 bg-grey-lighten-3">
        <span class="text-h6">Thông tin cá nhân</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeModal"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text class="pt-4">
        <div v-if="authStore.isLoadingProfile && !initialProfileLoaded" class="text-center py-10">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-3 text-medium-emphasis">Đang tải thông tin...</p>
        </div>

        <v-alert v-else-if="authStore.profileError && !initialProfileLoaded" type="error" density="compact" class="mb-4" rounded="lg">
          {{ authStore.profileError }}. Vui lòng thử lại sau.
        </v-alert>

        <div v-else-if="profileForm.email">
          <v-alert
            v-if="successMessage"
            type="success" density="compact" class="mb-4" closable @click:close="successMessage = ''" rounded="lg">
            {{ successMessage }}
          </v-alert>
          <v-alert
            v-if="errorMessage"
            type="error" density="compact" class="mb-4" closable @click:close="errorMessage = ''" rounded="lg">
            {{ errorMessage }}
          </v-alert>

          <div class="text-center mb-6">
            <v-avatar :image="avatarPreview || defaultAvatar" size="100" color="grey-lighten-3" class="elevation-1 profile-avatar">
              <template v-slot:error>
                <span class="text-h5 text-grey-darken-1">{{ userInitial }}</span>
              </template>
              <span v-if="!avatarPreview" class="text-h5 text-grey-darken-1">{{ userInitial }}</span>
            </v-avatar>
          </div>

          <v-form @submit.prevent="updateProfile" ref="profileFormRef">
            <v-text-field
              :model-value="profileForm.email"
              label="Email" variant="outlined" density="compact" readonly disabled class="mb-4" prepend-inner-icon="mdi-email-outline" rounded="lg">
            </v-text-field>

            <v-text-field
              v-model="profileForm.fullname"
              label="Họ và tên *" variant="outlined" density="compact" :rules="[rules.required, rules.minLength(2)]" class="mb-4" prepend-inner-icon="mdi-account-outline" counter="100" maxlength="100" rounded="lg" autofocus>
            </v-text-field>

            <v-text-field
              v-model="profileForm.photoUrl"
              label="URL Ảnh đại diện (tùy chọn)" variant="outlined" density="compact" class="mb-4" prepend-inner-icon="mdi-image-outline" placeholder="https://..." clearable @update:model-value="updateAvatarPreview" rounded="lg">
            </v-text-field>

            <v-text-field
              :model-value="profileForm.userTypeDisplay"
              label="Loại tài khoản" variant="outlined" density="compact" readonly disabled class="mb-4" prepend-inner-icon="mdi-account-tie-outline" rounded="lg">
            </v-text-field>

            <v-text-field
              :model-value="profileForm.statusDisplay"
              label="Trạng thái" variant="outlined" density="compact" readonly disabled class="mb-4" prepend-inner-icon="mdi-check-decagram-outline" rounded="lg">
            </v-text-field>
          </v-form>
        </div>
        <div v-else class="text-center text-medium-emphasis py-5">
           Không thể tải thông tin cá nhân.
         </div>
      </v-card-text>
      <v-divider></v-divider>
       <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal" :disabled="isLoadingUpdate">Hủy</v-btn>
        <v-btn color="primary" variant="flat" @click="updateProfile" :loading="isLoadingUpdate" :disabled="isLoadingUpdate || !isFormChanged" rounded="lg">
          Lưu thay đổi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { VDialog, VCard, VCardTitle, VCardText, VForm, VTextField, VBtn, VAlert, VProgressCircular, VAvatar, VSpacer, VDivider, VIcon } from 'vuetify/components';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const profileFormRef = ref(null);
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2JkYmRiZCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYuMjItMy4yMy4wMi0uOTggMS45OC0xLjgyIDQuMjItMi40MSAxLjEzLjM1IDIuMzkuNTYgMy43OC41NnMyLjY1LS4yMSAzLjc4LS41NmMyLjI0LjU5IDQuMiAxLjQ0IDQuMiAyLjQxLTEuNTEgMi45NS0zLjcyIDMuMjMtNi4yMiAzLjIzeiIvPjwvc3ZnPg==';

const profileForm = reactive({
  email: '',
  fullname: '',
  photoUrl: '',
  userType: '',
  status: '',
  userTypeDisplay: computed(() => profileForm.userType === 'CUSTOMER' ? 'Khách hàng' : (profileForm.userType === 'EMPLOYEE' ? 'Nhân viên' : 'Không xác định')),
  statusDisplay: computed(() => profileForm.status === 'ACTIVE' ? 'Đang hoạt động' : (profileForm.status === 'PENDING_ACTIVATION' ? 'Chờ kích hoạt' : 'Đã khóa')),
});

const originalProfileData = ref({});
const avatarPreview = ref('');
const isLoadingUpdate = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const initialProfileLoaded = ref(false);

const userInitial = computed(() => {
    const name = profileForm.fullname || authStore.currentUser?.fullname;
    return name ? name.charAt(0).toUpperCase() : '?';
});

const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
  minLength: (length) => value => (!value || value.length >= length) || `Ít nhất ${length} ký tự.`,
};

const isFormChanged = computed(() => {
    const originalPhoto = originalProfileData.value.photoUrl || '';
    const currentPhoto = profileForm.photoUrl || '';
    return profileForm.fullname !== originalProfileData.value.fullname ||
           currentPhoto !== originalPhoto;
});

const populateForm = (profileData) => {
    if (profileData) {
        profileForm.email = profileData.email || '';
        profileForm.fullname = profileData.fullname || '';
        profileForm.photoUrl = profileData.photoUrl || '';
        profileForm.userType = profileData.userType || '';
        profileForm.status = profileData.status || '';
        originalProfileData.value = { fullname: profileForm.fullname, photoUrl: profileForm.photoUrl || '' };
        avatarPreview.value = profileForm.photoUrl;
        initialProfileLoaded.value = true;
    } else {
        initialProfileLoaded.value = false;
    }
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const updateAvatarPreview = (newUrl) => {
    avatarPreview.value = newUrl || '';
};

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
            photoUrl: profileForm.photoUrl || null,
        };
        const updatedProfile = await authStore.updateUserProfile(dataToUpdate);
        successMessage.value = "Cập nhật thông tin thành công!";
        originalProfileData.value = { fullname: updatedProfile.fullname, photoUrl: updatedProfile.photoUrl || '' };
        setTimeout(closeModal, 1500);
    } catch (error) {
        errorMessage.value = authStore.profileError || 'Có lỗi xảy ra, vui lòng thử lại.';
    } finally {
        isLoadingUpdate.value = false;
    }
};

watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    initialProfileLoaded.value = !!authStore.profile;
    errorMessage.value = '';
    successMessage.value = '';
    if (!authStore.profile && !authStore.isLoadingProfile) {
      await authStore.fetchUserProfile();
    }
    nextTick(() => {
        populateForm(authStore.profile);
        profileFormRef.value?.resetValidation();
    });
  }
});

watch(() => authStore.profile, (newProfile) => {
    if (props.modelValue) {
        populateForm(newProfile);
    }
}, { deep: true });

</script>

<style scoped>
.profile-avatar {
    border: 3px solid white;
}
</style>