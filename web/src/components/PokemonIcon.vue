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
import { ref, computed, watch } from 'vue'
import type { CSSProperties } from 'vue'

const FALLBACK = import.meta.env.BASE_URL + 'img/fallback-pokemon.png'

/** 根据显示尺寸选择合适的图标资源：<=64px 用 pokei（64px），>64px 用 pokei128 */
function adaptIconUrl(url: string, size: number): string {
  if (size <= 64 && url.includes('/pokei128/')) {
    return url.replace('/pokei128/', '/pokei/')
  }
  return url
}

const props = defineProps({
  src: { type: String, default: '' },
  fallbackSrc: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 128 },
})

const currentSrc = ref(adaptIconUrl(props.src, props.size) || FALLBACK)

watch(() => props.src, (v) => {
  currentSrc.value = adaptIconUrl(v, props.size) || FALLBACK
})

function onError() {
  if (currentSrc.value !== props.fallbackSrc && props.fallbackSrc) {
    currentSrc.value = adaptIconUrl(props.fallbackSrc, props.size)
  } else if (currentSrc.value !== FALLBACK) {
    currentSrc.value = FALLBACK
  }
}

const imgStyle = computed((): CSSProperties => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  imageRendering: 'pixelated',
}))
</script>
