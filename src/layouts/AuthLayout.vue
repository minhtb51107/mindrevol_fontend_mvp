<template>
  <v-app>
    <v-main class="bg-grey-lighten-3">
      <v-container fluid fill-height> 
        <v-row justify="center" align="center" style="min-height: 100vh;">
          <v-col cols="12" sm="8" md="6" lg="5">
            
            <RouterView />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterView } from 'vue-router';
// Import các component Vuetify cần thiết (thường không cần nếu chỉ dùng layout cơ bản)
import { VApp, VMain, VContainer, VRow, VCol } from 'vuetify/components';
</script>

<style scoped>
/* Có thể thêm CSS tùy chỉnh nếu cần */
</style>