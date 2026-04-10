<template>
  <div class="card" :style="highlight ? { borderColor: 'var(--accent)' } : {}" @click="$emit('click', current)">
    <div class="dex-num" style="position:absolute;top:8px;left:10px">No.{{ String(current.dexNum).padStart(4, '0') }}</div>
    <div v-if="list.length > 1" class="form-carousel">
      <button class="form-switch" @click.stop="prev">‹</button>
      <PokemonIcon v-if="current.icon" :src="current.icon" :alt="current.name" />
      <button class="form-switch" @click.stop="next">›</button>
    </div>
    <PokemonIcon v-else-if="current.icon" :src="current.icon" :alt="current.name" />
    <div class="name">{{ current.name }}<span v-if="current.form" class="form-label">{{ current.form }}</span></div>
    <div style="margin-top:6px;display:flex;justify-content:center;gap:4px">
      <TypeIcon v-for="t in current.types" :key="t.id" :tid="t.id" :alt="t.name" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PokemonIcon from './PokemonIcon.vue'
import TypeIcon from './TypeIcon.vue'

const props = defineProps({
  pokemon: { type: Object, default: null },
  pokemonList: { type: Array, default: null },
  highlight: { type: Boolean, default: false },
})

defineEmits(['click'])

const idx = ref(0)

const list = computed(() => {
  if (props.pokemonList && props.pokemonList.length > 0) return props.pokemonList
  if (props.pokemon) return [props.pokemon]
  return []
})

const current = computed(() => list.value[idx.value] ?? list.value[0])

function prev() { idx.value = (idx.value - 1 + list.value.length) % list.value.length }
function next() { idx.value = (idx.value + 1) % list.value.length }
</script>

<style scoped>
.form-carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.form-switch {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text2);
  font-size: 18px;
  line-height: 1;
  padding: 2px 6px;
  cursor: pointer;
  flex-shrink: 0;
}
.form-switch:hover {
  background: var(--hover);
  color: var(--text);
}
</style>
