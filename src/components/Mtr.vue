<template>
  <div>
    <a-spin :spinning="loading">
      <iframe
        :src="`https://docs.google.com/gview?url=${pdfUrl}&embedded=true`"
        width="100%"
        height="800px"
      ></iframe>
    </a-spin>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Spin } from 'ant-design-vue';

// Replace with your PDF URL
const pdfUrl = ref('https://www.mtr.com.hk/archive/ch/services/routemap.pdf');
const loading = ref(false); // Optional: for loading state
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
}
embed,
iframe {
  border: none;
}
</style>