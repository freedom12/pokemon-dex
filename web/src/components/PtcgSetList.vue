<template>
  <!-- 主要 sets -->
  <div v-if="mainSets.length" class="ptcg-list-grid">
    <div v-for="s in mainSets" :key="s.id" class="ptcg-list-card" @click="$emit('select', s)">
      <img v-if="s.images?.logo" :src="s.images.logo" :alt="s.name" class="ptcg-list-logo" loading="lazy" />
      <div v-else class="ptcg-list-logo ptcg-logo-placeholder">{{ s.name }}</div>
      <div class="ptcg-list-name">{{ s.name }}</div>
      <div class="ptcg-list-count">{{ s.total }} 张</div>
      <img v-if="s.images?.symbol" :src="s.images.symbol" class="ptcg-set-symbol" />
    </div>
  </div>

  <!-- 附属 sets (Promo / Trainer / Energy) -->
  <template v-if="subSets.length">
    <hr class="ptcg-divider" />
    <div class="ptcg-list-grid">
      <div v-for="s in subSets" :key="s.id" class="ptcg-list-card" @click="$emit('select', s)">
        <img v-if="s.images?.logo" :src="s.images.logo" :alt="s.name" class="ptcg-list-logo" loading="lazy" />
        <div v-else class="ptcg-list-logo ptcg-logo-placeholder">{{ s.name }}</div>
        <div class="ptcg-list-name">{{ s.name }}</div>
        <div class="ptcg-list-count">{{ s.total }} 张</div>
        <img v-if="s.images?.symbol" :src="s.images.symbol" class="ptcg-set-symbol" />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PtcgSet } from '../ptcg/api'
import { MAIN_SERIES_SUB_PATTERNS } from '../constants/ptcg'

const props = defineProps<{ sets: PtcgSet[] }>()
defineEmits<{ select: [set: PtcgSet] }>()

function isSub(s: PtcgSet) {
  return MAIN_SERIES_SUB_PATTERNS.some(p => p.match.test(s.name))
}

const mainSets = computed(() => props.sets.filter(s => !isSub(s)))
const subSets = computed(() => props.sets.filter(s => isSub(s)))
</script>

<style scoped>
.ptcg-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 20px 0;
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
  width: 20px; height: 20px; object-fit: contain; opacity: 0.7;
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
