<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-4 pa-md-6">
          <v-card-title class="text-center text-h5 mb-6">
            Bắt đầu Hành Trình Mới
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="mb-4"
              closable
              rounded="lg"
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <v-form @submit.prevent="handleCreateJourney" ref="journeyFormRef">
              <v-text-field
                v-model="form.title"
                label="Tên hành trình *"
                :rules="[rules.required]"
                placeholder="Ví dụ: Dậy sớm lúc 5h sáng"
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-textarea
                v-model="form.description"
                label="Mô tả ngắn (Tùy chọn)"
                rows="2"
                placeholder="Mục tiêu chính của hành trình này là gì?"
                class="mb-4"
                variant="outlined"
              ></v-textarea>

              <v-textarea
                v-model="form.motivation"
                label="Lý do bạn bắt đầu? (Motivation) *"
                rows="3"
                placeholder="Hãy viết ra lý do sâu sắc nhất thúc đẩy bạn. Nó sẽ được nhắc lại mỗi khi bạn 'Log' (check-in) để giữ lửa cho bạn."
                class="mb-6 motivation-field"
                variant="outlined"
                bg-color="amber-lighten-5"
                prepend-inner-icon="mdi-lightbulb-on-outline"
                hint="Đây là 'ngọn hải đăng' giúp bạn không bỏ cuộc."
                persistent-hint
                :rules="[rules.required]"
              ></v-textarea>
              
              <v-divider class="mb-6"></v-divider>

              <h3 class="text-subtitle-1 font-weight-medium mb-3">
                Mời bạn đồng hành (Tùy chọn)
              </h3>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Chọn bạn bè (từ danh sách bạn đã kết nối) để cùng tham gia hành trình này.
              </p>
              
              <v-sheet v-if="friendStore.isLoading" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-sheet>
              
              <v-alert v-else-if="!friendStore.friends.length && !friendStore.isLoading" type="info" variant="tonal" density="compact">
                Bạn chưa có người bạn nào. Hãy vào <router-link :to="{ name: 'friends' }">trang Kết Nối</router-link> để thêm bạn.
              </v-alert>

              <v-list v-else lines="two" class="friend-list mb-6" style="max-height: 200px; overflow-y: auto;">
                <v-list-item
                  v-for="friend in friendStore.friends"
                  :key="friend.userId"
                  @click="toggleFriendSelection(friend.userId)"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="friend.photoUrl ? undefined : 'primary'" class="mr-3">
                      <v-img v-if="friend.photoUrl" :src="friend.photoUrl" :alt="friend.fullName"></v-img>
                      <span v-else>{{ friend.fullName.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ friend.fullName }}</v-list-item-title>
                  <v-list-item-subtitle>{{ friend.email }}</v-list-item-subtitle>

                  <template v-slot:append>
                    <v-checkbox
                      :model-value="selectedFriendIds.includes(friend.userId)"
                      hide-details
                      density="compact"
                      @click.stop="toggleFriendSelection(friend.userId)"
                    ></v-checkbox>
                  </template>
                </v-list-item>
              </v-list>
              <v-divider class="mb-6"></v-divider>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                rounded="lg"
                elevation="2"
                class="font-weight-bold"
              >
                Bắt đầu Hành Trình
              </v-btn>

              </v-form>
            </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// [CẬP NHẬT] Stores
import { usePlanStore } from '@/features/plan/stores/planStore';
import { useFriendStore } from '@/features/community/stores/friendStore'; // TỪ PHẦN 1
import { 
  VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VForm, 
  VTextField, VTextarea, VBtn, VAlert, VDivider, VProgressCircular,
  VList, VListItem, VAvatar, VImg, VCheckbox, VSheet
} from 'vuetify/components';

// Khởi tạo stores
const planStore = usePlanStore();
const friendStore = useFriendStore(); // TỪ PHẦN 1
const router = useRouter();
const journeyFormRef = ref(null);

// State cho form (Đã xóa các trường không cần thiết)
const form = reactive({
  title: '',
  description: '',
  motivation: '', // <-- Trường "linh hồn"
});
const selectedFriendIds = ref([]); // State cho danh sách bạn bè được chọn
const isLoading = ref(false);
const errorMessage = ref('');

// Tải danh sách bạn bè khi component được mounted
onMounted(() => {
  // Chỉ tải nếu chưa có bạn bè
  if (friendStore.friends.length === 0) {
    friendStore.fetchAll(); // <--- SỬA THÀNH fetchAll()
  }
});

// Rules
const rules = {
  required: value => !!value || 'Thông tin bắt buộc.',
};

// Hàm xử lý khi chọn/bỏ chọn bạn
const toggleFriendSelection = (friendId) => {
  const index = selectedFriendIds.value.indexOf(friendId);
  if (index > -1) {
    selectedFriendIds.value.splice(index, 1);
  } else {
    selectedFriendIds.value.push(friendId);
  }
};

// Hàm xử lý submit (ĐÃ THAY ĐỔI HOÀN TOÀN)
const handleCreateJourney = async () => {
  if (!journeyFormRef.value) return;
  const { valid } = await journeyFormRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
    ...form,
    friendIds: selectedFriendIds.value,
  };

  try {
    // Gọi action mới trong planStore
    await planStore.createNewJourney(payload);
    // (planStore sẽ tự động điều hướng đến 'journey-room')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo hành trình, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.motivation-field :deep(.v-field__input) {
    font-style: italic;
    line-height: 1.4rem;
}
.friend-list {
  border: 1px solid rgba(var(--v-border-color), 0.3);
  border-radius: 8px;
}
.friend-list .v-list-item {
  cursor: pointer;
}
.friend-list .v-list-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
</style>