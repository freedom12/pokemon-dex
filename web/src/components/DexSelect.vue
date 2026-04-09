<template>
  <div class="dex-select" ref="root">
    <button class="dex-select-btn" @click="open = !open">
      <template v-if="selected">
        <span class="dex-select-icons">
          <GameIcon v-for="sid in selected.softwareIds" :key="sid" :sid="sid" :size="20" />
        </span>
        <span>{{ selected.name }}</span>
      </template>
      <span v-else class="dex-select-placeholder">全部图鉴</span>
      <span class="dex-select-arrow">▾</span>
    </button>
    <ul v-if="open" class="dex-select-list">
      <li class="dex-select-item" :class="{ active: !modelValue }" @click="pick('')">
        全部图鉴
      </li>
      <li v-for="d in options" :key="d.id" class="dex-select-item" :class="{ active: modelValue === d.id }" @click="pick(d.id)">
        <span class="dex-select-icons">
          <GameIcon v-for="sid in d.softwareIds" :key="sid" :sid="sid" :size="20" />
        </span>
        <span>{{ d.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import GameIcon from './GameIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)

const selected = computed(() => props.options.find(d => d.id === props.modelValue) || null)

function pick(id) {
  emit('update:modelValue', id)
  open.value = false
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
