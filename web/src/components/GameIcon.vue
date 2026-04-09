<template>
  <img
    :src="`${BASE}${sid}.png`"
    :alt="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup>
import { computed } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/game_icon/'

const props = defineProps({
  sid: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 24 },
})

const imgStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}))
</script>
