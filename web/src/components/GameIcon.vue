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
import { ref, watch, computed } from 'vue'

const FALLBACK = import.meta.env.BASE_URL + 'fallback-item.png'
const BASE = import.meta.env.BASE_URL + 'img/game_icon/'

const props = defineProps({
  sid: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 24 },
})

const currentSrc = ref(props.sid ? `${BASE}${props.sid}.png` : FALLBACK)

watch(() => props.sid, (v) => {
  currentSrc.value = v ? `${BASE}${v}.png` : FALLBACK
})

function onError() {
  if (currentSrc.value !== FALLBACK) currentSrc.value = FALLBACK
}

const imgStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}))
</script>
