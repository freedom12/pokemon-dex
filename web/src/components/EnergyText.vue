<template>
  <span class="energy-text">
    <template v-for="(seg, i) in segments" :key="i">
      <EnergyIcon v-if="seg.type" :type="seg.type" :size="size" />
      <template v-else>{{ seg.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EnergyIcon from './EnergyIcon.vue'

const CODE_MAP: Record<string, string> = {
  G: 'Grass',
  R: 'Fire',
  W: 'Water',
  L: 'Lightning',
  P: 'Psychic',
  F: 'Fighting',
  D: 'Darkness',
  M: 'Metal',
  N: 'Dragon',
  C: 'Colorless',
  Y: 'Fairy',
}

const props = defineProps<{ text: string; size?: number }>()
const size = computed(() => props.size ?? 16)

const segments = computed(() => {
  const result: Array<{ text?: string; type?: string }> = []
  const regex = /\{([A-Z])\}/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(props.text)) !== null) {
    if (match.index > last) result.push({ text: props.text.slice(last, match.index) })
    const mapped = CODE_MAP[match[1]]
    if (mapped) result.push({ type: mapped })
    else result.push({ text: match[0] })
    last = regex.lastIndex
  }
  if (last < props.text.length) result.push({ text: props.text.slice(last) })
  return result
})
</script>

<style scoped>
.energy-text { display: inline; }
.energy-text > * { vertical-align: middle; }
</style>
