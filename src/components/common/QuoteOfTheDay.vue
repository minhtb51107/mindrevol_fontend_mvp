<template>
  <v-card variant="tonal" :color="quoteData.color + '-lighten-4'" rounded="xl" class="pa-4 text-center quote-card">
    <v-icon :color="quoteData.color" class="mb-2">mdi-format-quote-close-outline</v-icon>
    <p class="text-body-2 font-italic mb-1">"{{ quoteData.text }}"</p>
    <p class="text-caption font-weight-medium">- {{ quoteData.author }}</p>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VCard, VIcon } from 'vuetify/components';

// Danh sách quote mẫu
const quotes = [
  { text: "Cách tốt nhất để dự đoán tương lai là tạo ra nó.", author: "Peter Drucker", color: "deep-purple" },
  { text: "Học tập không phải là sự chuẩn bị cho cuộc sống; học tập chính là cuộc sống.", author: "John Dewey", color: "blue" },
  { text: "Kỷ luật là cầu nối giữa mục tiêu và thành tích.", author: "Jim Rohn", color: "teal" },
  { text: "Hãy làm hôm nay những gì người khác không muốn, để ngày mai bạn có thể làm những gì người khác không thể.", author: "Jerry Rice", color: "indigo" },
  { text: "Thất bại duy nhất là không cố gắng.", author: "George Clooney (từ Batman & Robin, nhưng vẫn hay!)", color: "red" },
];

const quoteData = ref(quotes[0]); // Quote mặc định

onMounted(() => {
  // Chọn ngẫu nhiên một quote khi component được mount
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteData.value = quotes[randomIndex];
});

// Logic để fetch quote từ API (nếu có) sẽ thêm sau
</script>

<style scoped>
.quote-card {
  /* Thêm style nếu cần */
  line-height: 1.5;
}
</style>