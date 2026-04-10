<template>
  <img
    v-if="tid"
    :src="`${BASE}${tid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup>
import { computed } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/type_icon/'

const props = defineProps({
  tid: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 32 },
})

const imgStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}))
</script>
