<template>
  <span v-if="name" class="color-badge" :style="hex ? { background: hex } : {}">{{ name }}</span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
defineProps({
  name: { type: String, default: '' },
  hex: { type: String, default: '' },
})
</script>

<style scoped>
.color-badge {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 12px;
  font-size: 13px;
  color: #fff;
  text-shadow: 0 0 3px rgba(0,0,0,0.5);
  border: 1px solid var(--border);
}
</style>
