<template>
  <div class="card" :style="highlight ? { borderColor: 'var(--accent)' } : {}" @click="$emit('click')">
    <div class="dex-num" style="position:absolute;top:8px;left:10px">No.{{ String(pokemon.dexNum).padStart(4, '0') }}</div>
    <PokemonIcon v-if="pokemon.icon" :src="pokemon.icon" :alt="pokemon.name" />
    <div class="name">{{ pokemon.name }}<span v-if="pokemon.form" class="form-label">{{ pokemon.form }}</span></div>
    <div style="margin-top:6px">
      <span v-for="t in pokemon.types" :key="t.id" class="type-badge" :style="{ background: t.color }">{{ t.name }}</span>
    </div>
  </div>
</template>

<script setup>
import PokemonIcon from './PokemonIcon.vue'

defineProps({
  pokemon: { type: Object, required: true },
  highlight: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
