<template>
  <div class="detail-section">
    <h3 class="section-toggle" @click="open = !open">
      <slot name="title">{{ title }}</slot>
      <span class="toggle-arrow" :class="{ open }">▸</span>
    </h3>
    <div v-show="open">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ title?: string; defaultOpen?: boolean }>(), {
  defaultOpen: true,
})
const open = ref(props.defaultOpen)
</script>
