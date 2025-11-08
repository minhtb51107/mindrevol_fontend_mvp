<!-- <template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card class="neo-dialog-card" rounded="lg">
      <v-form ref="form" @submit.prevent="inviteMember">
        <v-card-title class="font-weight-medium">
          <v-icon start color="grey-lighten-1">mdi-account-plus-outline</v-icon>
          Mời thành viên
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-2 mb-3 text-medium-emphasis">
            Nhập email của người bạn muốn mời tham gia kế hoạch này.
          </p>
          <v-text-field
            v-model="email"
            label="Email thành viên"
            variant="outlined"
            density="compact"
            :rules="[rules.required, rules.email]"
            autofocus
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog" :disabled="isLoading">
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            type="submit"
            :loading="isLoading"
          >
            Gửi lời mời
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { toast } from 'vue-sonner'; // <-- ĐÃ THAY ĐỔI

const props = defineProps({
  modelValue: Boolean,
  planId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'invite-success']);

// --- Store và State ---
const planStore = usePlanStore();
// const snackbar = useSnackbar(); // <-- ĐÃ XÓA
const form = ref(null);
const isLoading = ref(false);
const email = ref('');

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || 'Email không được để trống.',
  email: (value) =>
    /.+@.+\..+/.test(value) || 'Email không đúng định dạng.',
};

// --- Methods ---
const closeDialog = () => {
  emit('update:modelValue', false);
};

const inviteMember = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  isLoading.value = true;
  try {
    await planStore.inviteMember(props.planId, email.value);
    toast.success('Đã gửi lời mời thành công'); // <-- ĐÃ THAY ĐỔI
    emit('invite-success');
    closeDialog();
  } catch (error) {
    console.error('Lỗi khi mời thành viên:', error);
    // <-- ĐÃ THAY ĐỔI
    toast.error('Lỗi', {
      description: error.response?.data?.message || 'Không thể gửi lời mời.',
    });
  } finally {
    isLoading.value = false;
  }
};

// --- Watcher ---
watchEffect(() => {
  if (props.modelValue) {
    email.value = '';
    if (form.value) {
      form.value.resetValidation();
    }
  }
});
</script>

<style scoped>
.neo-dialog-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.3) !important;
}
</style> -->