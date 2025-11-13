<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            Kết nối bạn bè
          </v-card-title>
          <v-card-text>
            Thêm bạn bè (người thân) để bắt đầu đồng hành cùng nhau trong các hành trình.
          </v-card-text>
          
          <v-sheet class="pa-4">
            <v-form @submit.prevent="handleSendRequest" class="d-flex ga-2">
              <v-text-field
                v-model="newFriendEmail"
                label="Nhập email của bạn bè"
                variant="outlined"
                density="compact"
                hide-details
                :rules="[v => !!v || 'Email là bắt buộc', v => /.+@.+\..+/.test(v) || 'Email không hợp lệ']"
                :loading="store.isLoading"
                :disabled="store.isLoading"
              ></v-text-field>
              <v-btn 
                type="submit" 
                color="primary"
                :loading="store.isLoading"
                >Gửi lời mời</v-btn
              >
            </v-form>
             <v-alert v-if="successMessage" type="success" density="compact" class="mt-2" closable @click:close="successMessage = ''">
               {{ successMessage }}
             </v-alert>
             <v-alert v-if="errorMessage" type="error" density="compact" class="mt-2" closable @click:close="errorMessage = ''">
               {{ errorMessage }}
             </v-alert>
          </v-sheet>

          <v-tabs v-model="tab" grow bg-color="transparent">
            <v-tab value="friends">
              <v-badge :content="store.friendCount" :model-value="store.friendCount > 0" color="primary">
                Bạn bè
              </v-badge>
            </v-tab>
            <v-tab value="requests">
              <v-badge :content="store.requestCount" :model-value="store.requestCount > 0" color="error">
                Lời mời
              </v-badge>
            </v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="friends">
              <v-list v-if="store.friends.length > 0">
                <v-list-item
                  v-for="friend in store.friends"
                  :key="friend.userId"
                  :prepend-avatar="friend.photoUrl || undefined"
                  :title="friend.fullName"
                  :subtitle="friend.email"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="friend.photoUrl ? undefined : 'primary'">
                      <v-img v-if="friend.photoUrl" :src="friend.photoUrl" :alt="friend.fullName"></v-img>
                      <span v-else class="text-h6">{{ friend.fullName.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <template v-slot:append>
                    <v-btn 
                      color="grey" 
                      variant="text" 
                      icon="mdi-account-remove-outline"
                      @click="handleRemoveFriend(friend.userId)"
                      title="Hủy kết bạn"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <v-sheet v-else height="150" class="d-flex justify-center align-center text-medium-emphasis">
                Chưa có bạn bè nào.
              </v-sheet>
            </v-window-item>

            <v-window-item value="requests">
              <v-list v-if="store.pendingRequests.length > 0">
                <v-list-item
                  v-for="req in store.pendingRequests"
                  :key="req.friendshipId"
                  :prepend-avatar="req.photoUrl || undefined"
                  :title="req.fullName"
                  :subtitle="req.email"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="req.photoUrl ? undefined : 'secondary'">
                      <v-img v-if="req.photoUrl" :src="req.photoUrl" :alt="req.fullName"></v-img>
                      <span v-else class="text-h6">{{ req.fullName.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <template v-slot:append>
                    <v-btn 
                      color="success" 
                      variant="text" 
                      icon="mdi-check"
                      @click="handleAccept(req.friendshipId)"
                      class="mr-1"
                      title="Đồng ý"
                    ></v-btn>
                    <v-btn 
                      color="error" 
                      variant="text" 
                      icon="mdi-close"
                      @click="handleDecline(req.friendshipId)"
                      title="Từ chối"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <v-sheet v-else height="150" class="d-flex justify-center align-center text-medium-emphasis">
                Không có lời mời mới nào.
              </v-sheet>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFriendStore } from '@/features/community/stores/friendStore'; // Cập nhật đường dẫn nếu bạn đổi
import { 
  VContainer, VRow, VCol, VCard, VCardTitle, VCardText, VSheet, VForm, 
  VTextField, VBtn, VTabs, VTab, VWindow, VWindowItem, VList, VListItem, 
  VAvatar, VImg, VBadge, VAlert
} from 'vuetify/components';

const store = useFriendStore();
const tab = ref('friends');
const newFriendEmail = ref('');
const successMessage = ref('');
const errorMessage = ref('');

onMounted(() => {
  store.fetchAll();
});

const handleSendRequest = async () => {
  successMessage.value = '';
  errorMessage.value = '';
  if (!newFriendEmail.value || !/.+@.+\..+/.test(newFriendEmail.value)) {
    errorMessage.value = "Vui lòng nhập email hợp lệ.";
    return;
  }
  
  try {
    await store.sendRequest(newFriendEmail.value);
    successMessage.value = `Đã gửi lời mời đến ${newFriendEmail.value}.`;
    newFriendEmail.value = '';
  } catch (e) {
    errorMessage.value = e.message || 'Gửi lời mời thất bại.';
  }
};

const handleAccept = (friendshipId) => {
  store.acceptRequest(friendshipId);
};

const handleDecline = (friendshipId) => {
  store.declineRequest(friendshipId);
};

const handleRemoveFriend = (friendUserId) => {
  if (confirm("Bạn có chắc chắn muốn hủy kết bạn với người này?")) {
    store.removeFriend(friendUserId);
  }
};
</script>