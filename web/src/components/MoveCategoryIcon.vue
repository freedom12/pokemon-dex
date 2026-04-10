<template>
  <img
    v-if="cid"
    :src="`${BASE}${cid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup>
import { computed } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/move_category_icon/'

const props = defineProps({
  cid: { type: String, default: '' },
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
