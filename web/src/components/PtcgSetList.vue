<template>
  <!-- Main sets -->
  <div v-if="mainItems.length" class="ptcg-list-grid">
    <div v-for="s in mainItems" :key="s.id" class="ptcg-list-card" @click="$emit('select', s)">
      <img v-if="s.logo" :src="s.logo + '.png'" :alt="s.name" class="ptcg-list-logo" loading="lazy" />
      <div v-else class="ptcg-list-logo ptcg-logo-placeholder">{{ s.name }}</div>
      <div class="ptcg-list-name">{{ s.name }}</div>
      <div class="ptcg-list-count">{{ s.cardCount?.total ?? '?' }} 张</div>
      <img v-if="s.symbol" :src="s.symbol + '.png'" class="ptcg-set-symbol" />
    </div>
  </div>

  <!-- Promo + Special -->
  <template v-if="extraItems.length">
    <hr class="ptcg-divider" />
    <div class="ptcg-list-grid">
      <div v-for="s in extraItems" :key="s.id" class="ptcg-list-card" @click="$emit('select', s)">
        <img v-if="s.logo" :src="s.logo + '.png'" :alt="s.name" class="ptcg-list-logo" loading="lazy" />
        <div v-else class="ptcg-list-logo ptcg-logo-placeholder">{{ s.name }}</div>
        <div class="ptcg-list-name">{{ s.name }}</div>
        <div class="ptcg-list-count">{{ s.cardCount?.total ?? '?' }} 张</div>
        <img v-if="s.symbol" :src="s.symbol + '.png'" class="ptcg-set-symbol" />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SetBrief } from '../ptcg/types'
import { SET_GROUPS } from '../constants/ptcg'

const props = defineProps<{ sets: SetBrief[] }>()
defineEmits<{ select: [set: SetBrief] }>()

const categorized = new Set(SET_GROUPS.flatMap(g => g.ids))
const promoIds = SET_GROUPS.find(g => g.key === 'promo')?.ids ?? []
const specialIds = SET_GROUPS.find(g => g.key === 'special')?.ids ?? []

const mainItems = computed(() =>
  props.sets.filter(s => !categorized.has(s.id)).reverse()
)

const extraItems = computed(() => {
  const map = new Map(props.sets.map(s => [s.id, s]))
  // promo 先，special 后，各自倒序
  const promo = promoIds.map(id => map.get(id)).filter(Boolean).reverse() as SetBrief[]
  const special = specialIds.map(id => map.get(id)).filter(Boolean).reverse() as SetBrief[]
  return [...promo, ...special]
})
</script>

<style scoped>
.ptcg-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}
.ptcg-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.ptcg-list-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 16px;
  cursor: pointer; text-align: center; transition: all .2s;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  position: relative;
}
.ptcg-list-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.ptcg-set-symbol {
  position: absolute; bottom: 8px; right: 8px;
  width: 20px; height: 20px; object-fit: contain;
  opacity: 0.7;
}
.ptcg-list-logo { width: 180px; height: 48px; object-fit: contain; }
.ptcg-logo-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text2);
  border: 1px dashed var(--border); border-radius: 6px;
}
.ptcg-list-name { font-size: 15px; font-weight: 600; }
.ptcg-list-count { font-size: 12px; color: var(--text2); }
@media (max-width: 640px) {
  .ptcg-list-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}
</style>
