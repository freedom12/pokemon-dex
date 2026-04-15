<template>
  <img
    v-if="kid"
    :src="`${BASE}${kid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/shape_icon/'

const props = defineProps({
  kid: { type: String, default: '' },
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
