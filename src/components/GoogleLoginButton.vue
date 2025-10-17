<template>
  <div>
    <div id="google-btn"></div>
    <p v-if="error" class="text-danger mt-2 small text-center">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const error = ref('');

// Hàm này sẽ được Google gọi sau khi người dùng đăng nhập thành công
const handleGoogleLogin = async (response) => {
  // response.credential chính là idToken mà backend cần
  const idToken = response.credential;
  try {
    await authStore.handleGoogleLogin(idToken);
    // Chuyển hướng đã được xử lý trong store
  } catch (err) {
    console.error("Lỗi xử lý token Google:", err);
    error.value = 'Xác thực với máy chủ thất bại. Vui lòng thử lại.';
  }
};

// Sử dụng onMounted để đảm bảo mã chỉ chạy sau khi component đã được gắn vào DOM
onMounted(() => {
  // Kiểm tra xem đối tượng 'google' đã tồn tại chưa (được tải từ script trong index.html)
  if (typeof google === 'undefined') {
    error.value = "Không thể tải thư viện Google. Vui lòng kiểm tra kết nối mạng.";
    return;
  }

  // Khởi tạo Google Identity Services
  google.accounts.id.initialize({
    client_id: '758520677856-j98pg9k2fju9545q0ffffmsnr9b1qtk9.apps.googleusercontent.com', // Client ID của bạn
    callback: handleGoogleLogin, // Hàm sẽ được gọi khi đăng nhập thành công
  });

  // Render nút đăng nhập của Google vào thẻ div có id="google-btn"
  google.accounts.id.renderButton(
    document.getElementById('google-btn'),
    { theme: 'outline', size: 'large', width: '330' } // Tùy chỉnh giao diện nút
  );
});
</script>