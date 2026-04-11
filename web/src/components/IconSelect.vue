<template>
  <div class="icon-select" ref="root">
    <button class="icon-select-btn" @click="open = !open">
      <template v-if="selectedOption">
        <slot name="icon" :option="selectedOption" />
        <span>{{ selectedOption.label }}</span>
      </template>
      <span v-else class="icon-select-placeholder">{{ placeholder }}</span>
      <span class="icon-select-arrow">▾</span>
    </button>
    <ul v-if="open" class="icon-select-list">
      <li class="icon-select-item" :class="{ active: !modelValue }" @click="pick('')">
        {{ placeholder }}
      </li>
      <li
        v-for="opt in options" :key="opt.value"
        class="icon-select-item" :class="{ active: modelValue === opt.value }"
        @click="pick(opt.value)"
      >
        <slot name="icon" :option="opt" />
        <span>{{ opt.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type PropType } from 'vue'

export interface IconSelectOption {
  value: string
  label: string
  [key: string]: unknown
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array as PropType<IconSelectOption[]>, default: () => [] },
  placeholder: { type: String, default: '全部' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selectedOption = computed(() =>
  props.options.find(o => o.value === props.modelValue) || null
)

function pick(val: string) {
  emit('update:modelValue', val)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
