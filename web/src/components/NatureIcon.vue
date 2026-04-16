<template>
  <img
    v-if="nid"
    :src="`${BASE}${nid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/nature_icon/'

const props = defineProps({
  nid: { type: String, default: '' },
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
