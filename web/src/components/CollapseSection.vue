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
  transition: border-color 0.3s var(--ease-out);
}
.bordered:hover {
  border-color: var(--border-hover);
}
.bordered > .section-toggle {
  padding: 10px 14px;
  margin-bottom: 0;
  border-bottom: none;
  background: rgba(0,0,0,.015);
  border-radius: var(--radius) var(--radius) 0 0;
  transition: background 0.2s var(--ease-out);
}
.bordered > .section-toggle:hover {
  background: rgba(0,0,0,.04);
}
.bordered-body {
  padding: 0 14px 10px;
}
</style>
