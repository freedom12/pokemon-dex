<template>
  <img
    v-if="!errored"
    :src="`${base}img/energy_type_icon/${type.toLowerCase()}.png`"
    :alt="type"
    :title="type"
    :style="{ width: sz + 'px', height: sz + 'px' }"
    class="energy-icon"
    @error="errored = true"
  />
  <span
    v-else
    class="energy-icon energy-fallback"
    :style="{ width: sz + 'px', height: sz + 'px', fontSize: (sz * 0.55) + 'px' }"
    :title="type"
  >{{ type.charAt(0) }}</span>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const base = import.meta.env.BASE_URL

const props = defineProps<{
  type: string
  size?: number
}>()

const sz = computed(() => props.size ?? 20)
const errored = ref(false)

watch(() => props.type, () => { errored.value = false })
</script>

<style scoped>
.energy-icon {
  object-fit: contain;
  flex-shrink: 0;
  vertical-align: middle;
}
.energy-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg3);
  color: var(--text2);
  font-weight: 700;
}
</style>
