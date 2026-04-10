<template>
  <div class="card" :style="highlight ? { borderColor: 'var(--accent)' } : {}" @click="$emit('click')">
    <div class="dex-num" style="position:absolute;top:8px;left:10px">No.{{ String(pokemon.dexNum).padStart(4, '0') }}</div>
    <PokemonIcon v-if="pokemon.icon" :src="pokemon.icon" :alt="pokemon.name" />
    <div class="name">{{ pokemon.name }}<span v-if="pokemon.form" class="form-label">{{ pokemon.form }}</span></div>
    <div style="margin-top:6px;display:flex;justify-content:center;gap:4px">
      <TypeIcon v-for="t in pokemon.types" :key="t.id" :tid="t.id" :alt="t.name" />
    </div>
  </div>
</template>

<script setup>
import PokemonIcon from './PokemonIcon.vue'
import TypeIcon from './TypeIcon.vue'

defineProps({
  pokemon: { type: Object, required: true },
  highlight: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
