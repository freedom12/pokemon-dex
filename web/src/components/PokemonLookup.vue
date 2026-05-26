<template>
  <Teleport to="body">
    <div v-if="visible" class="lookup-overlay" @click.self="$emit('close')">
      <div class="lookup-panel">
        <div class="lookup-header">
          <div class="lookup-title">{{ title }}</div>
          <button class="lookup-close" @click="$emit('close')">✕</button>
        </div>
        <div v-if="pokemon.length === 0" style="padding:24px;text-align:center;color:var(--text2)">
          暂无符合条件的宝可梦
        </div>
        <div v-else class="lookup-grid">
          <PokemonCard
            v-for="p in pokemon" :key="p.id"
            :pokemon="p" @click="go(p)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { type PropType } from 'vue'
import PokemonCard from './PokemonCard.vue'
import type { Pokemon } from '../data'

defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  pokemon: { type: Array as PropType<Pokemon[]>, default: () => [] },
})
const emit = defineEmits(['close'])
const router = useRouter()

function go(p: Pokemon) {
  emit('close')
  router.push(`/pokemon/${p.id}`)
}
</script>

<style scoped>
.lookup-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.lookup-panel {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 90vw; max-width: 800px; max-height: 80vh;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.lookup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.lookup-title { font-weight: 600; font-size: 15px; color: var(--text); }
.lookup-close {
  background: none; border: none; font-size: 18px;
  cursor: pointer; color: var(--text2); padding: 4px 8px;
  border-radius: 4px;
}
.lookup-close:hover { background: var(--bg3); }
.lookup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px; padding: 16px; overflow-y: auto;
}
</style>
