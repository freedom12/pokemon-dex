<template>
  <img
    :src="`${BASE}${rid}.png`"
    :alt="alt"
    :style="imgStyle"
    loading="lazy"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/original_mark_icon/'
const FALLBACK = import.meta.env.BASE_URL + 'img/fallback-item.png'

function onError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith('fallback-item.png')) img.src = FALLBACK
}

const props = defineProps({
  rid: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 24 },
})

const imgStyle = computed((): CSSProperties => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}))
</script>
