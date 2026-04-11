<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :style="imgStyle"
    loading="lazy"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

const FALLBACK = import.meta.env.BASE_URL + 'img/fallback-item.png'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 32 },
})

const currentSrc = ref(props.src || FALLBACK)

watch(() => props.src, (v) => {
  currentSrc.value = v || FALLBACK
})

function onError() {
  if (currentSrc.value !== FALLBACK) {
    currentSrc.value = FALLBACK
  }
}

const imgStyle: CSSProperties = {
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}
</script>
