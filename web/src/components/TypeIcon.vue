<template>
  <img
    v-if="tid"
    :src="`${BASE}${resolvedTid}.png`"
    :alt="alt"
    :title="alt"
    :style="imgStyle"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const BASE = import.meta.env.BASE_URL + 'img/type_icon/'

const props = defineProps({
  tid: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: Number, default: 32 },
  tera: { type: Boolean, default: false },
})

const resolvedTid = computed(() => {
  if (props.tera && props.tid.startsWith('TY')) {
    return 'GT' + props.tid.slice(2)
  }
  return props.tid
})

const imgStyle = computed((): CSSProperties => ({
  width: props.size + 'px',
  height: props.size + 'px',
  objectFit: 'contain',
  verticalAlign: 'middle',
}))
</script>
