<template>
  <img
    :src="`${base}img/energy_type_icon/${type.toLowerCase()}.png`"
    :alt="type"
    :title="type"
    :style="{ width: sz + 'px', height: sz + 'px' }"
    class="energy-icon"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const base = import.meta.env.BASE_URL

const props = defineProps<{
  type: string
  size?: number
}>()

const sz = computed(() => props.size ?? 20)
</script>

<style scoped>
.energy-icon {
  object-fit: contain;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
