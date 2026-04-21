<template>
  <template v-if="cards.length">
    <div class="page-count" style="margin-bottom:12px">共 {{ cards.length }} 张卡牌</div>
    <div class="ptcg-grid">
    <router-link v-for="card in paged" :key="card.id" :to="`/ptcg/card/${card.id}`" class="ptcg-card">
      <img
        v-if="card.images?.small" :src="card.images.small"
        :alt="card.name" class="ptcg-card-img" loading="lazy"
      />
      <div v-else class="ptcg-card-placeholder">{{ card.name }}</div>
      <div class="ptcg-card-name">{{ card.name }}</div>
    </router-link>
  </div>
  <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Pagination from './Pagination.vue'
import type { PtcgCardBrief } from '../ptcg/api'

const props = defineProps<{ cards: PtcgCardBrief[] }>()

const page = ref(1)
const PAGE_SIZE = 60
let lastCardsId = ''

const totalPages = computed(() => Math.ceil(props.cards.length / PAGE_SIZE))
const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return props.cards.slice(start, start + PAGE_SIZE)
})

// 只在卡牌列表真正变化时重置页码（通过首张卡 id 判断）
watch(() => props.cards[0]?.id ?? '', (id) => {
  if (id && id !== lastCardsId) {
    page.value = 1
    lastCardsId = id
  }
})
</script>

<style scoped>
.ptcg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.ptcg-card { cursor: pointer; text-align: center; transition: transform .2s; text-decoration: none; display: block; }
.ptcg-card:hover { transform: translateY(-4px); }
.ptcg-card-img {
  width: 100%; border-radius: 8px;
  aspect-ratio: 63/88; object-fit: cover; background: var(--card);
}
.ptcg-card-placeholder {
  width: 100%; aspect-ratio: 63/88;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--text2); padding: 8px;
}
.ptcg-card-name {
  font-size: 13px; margin-top: 6px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (max-width: 640px) {
  .ptcg-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
}
</style>
