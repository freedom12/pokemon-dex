<template>
  <span v-if="label" style="display:inline-flex;align-items:center;gap:2px">
    <img
      :src="`${BASE}statistic_${sid}.png`"
      :alt="alt || label"
      :title="alt || label"
      :style="imgStyle"
      loading="lazy"
    />
    <span>{{ label }}</span>
  </span>
  <img
    v-else
    :src="`${BASE}statistic_${sid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/statistic_icon/'

const props = defineProps({
  sid: { type: String, default: '' },
  alt: { type: String, default: '' },
  label: { type: String, default: '' },
  size: { type: Number, default: 20 },
})

const imgStyle = computed((): CSSProperties => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
  flexShrink: '0',
}))
</script>
