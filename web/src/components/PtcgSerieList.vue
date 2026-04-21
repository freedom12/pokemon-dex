<template>
  <div class="ptcg-list-grid">
    <div v-for="s in series" :key="s.id" class="ptcg-list-card" @click="$emit('select', s)">
      <img v-if="s.logo" :src="s.logo + '.png'" :alt="s.name" class="ptcg-list-logo" loading="lazy" />
      <div v-else class="ptcg-list-logo ptcg-logo-placeholder">{{ s.name }}</div>
      <div class="ptcg-list-name">{{ s.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SerieBrief } from '../ptcg/types'
defineProps<{ series: SerieBrief[] }>()
defineEmits<{ select: [serie: SerieBrief] }>()
</script>

<style scoped>
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
}
.ptcg-list-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.ptcg-list-logo { width: 180px; height: 48px; object-fit: contain; }
.ptcg-logo-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text2);
  border: 1px dashed var(--border); border-radius: 6px;
}
.ptcg-list-name { font-size: 15px; font-weight: 600; }
@media (max-width: 640px) {
  .ptcg-list-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}
</style>
