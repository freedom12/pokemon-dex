<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :style="imgStyle"
    loading="lazy"
    @error="onError"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const FALLBACK = import.meta.env.BASE_URL + 'fallback-pokemon.png'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 128 },
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

const imgStyle = {
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  imageRendering: 'pixelated',
}
</script>
