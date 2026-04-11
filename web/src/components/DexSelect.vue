<template>
  <IconSelect v-model="model" :options="selectOptions" placeholder="全部图鉴">
    <template #icon="{ option }">
      <span class="dex-select-icons">
        <GameIcon v-for="sid in option.softwareIds" :key="sid" :sid="sid" :size="20" />
      </span>
    </template>
  </IconSelect>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import GameIcon from './GameIcon.vue'
import IconSelect from './IconSelect.vue'
import type { DexListEntry } from '../data'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array as PropType<DexListEntry[]>, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const selectOptions = computed(() =>
  props.options.map(d => ({ value: d.id, label: d.name, softwareIds: d.softwareIds }))
)
</script>
