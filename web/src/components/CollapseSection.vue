<template>
  <div :class="['detail-section', { bordered }]">
    <h3 class="section-toggle" @click="open = !open">
      <slot name="title">{{ title }}</slot>
      <span class="toggle-arrow" :class="{ open }">▸</span>
    </h3>
    <div v-show="open" :class="{ 'bordered-body': bordered }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ title?: string; defaultOpen?: boolean; bordered?: boolean }>(), {
  defaultOpen: true,
  bordered: false,
})
const open = ref(props.defaultOpen)
</script>

<style scoped>
.bordered {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.bordered > .section-toggle {
  padding: 8px 12px;
  margin-bottom: 0;
  border-bottom: none;
  background: rgba(255,255,255,.04);
}
.bordered > .section-toggle:hover {
  background: rgba(255,255,255,.08);
}
.bordered-body {
  padding: 0 12px 8px;
}
</style>
