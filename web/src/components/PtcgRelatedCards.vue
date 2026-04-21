<template>
  <div v-if="cards.length" class="detail-section">
    <h3 class="section-toggle" @click="open = !open">
      相关卡牌 <span style="font-weight:400;color:var(--text2);font-size:13px">{{ cards.length }} 张</span>
      <span class="toggle-arrow" :class="{ open }">▸</span>
    </h3>
    <div v-show="open" class="ptcg-related-grid">
      <router-link
        v-for="card in visible" :key="card.id"
        :to="`/ptcg/card/${card.id}`"
        class="ptcg-related-item"
      >
        <img
          v-if="card.images?.small" :src="card.images.small"
          :alt="card.name" class="ptcg-related-img" loading="lazy"
        />
        <div v-else class="ptcg-related-img ptcg-related-placeholder">{{ card.name }}</div>
        <div class="ptcg-related-name">{{ card.name }}</div>
      </router-link>
    </div>
    <div v-if="open && cards.length > LIMIT && !showAll" style="text-align:center;padding:8px">
      <button class="filter-btn" @click="showAll = true">显示全部 {{ cards.length }} 张</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { fetchCardsByPokedex, type PtcgCardBrief } from '../ptcg/api'

const props = defineProps<{ dexNum: number }>()

const cards = ref<PtcgCardBrief[]>([])
const open = ref(true)
const showAll = ref(false)
const LIMIT = 12

const visible = computed(() => showAll.value ? cards.value : cards.value.slice(0, LIMIT))

async function loadCards() {
  cards.value = []
  showAll.value = false
  if (!props.dexNum) return
  try {
    cards.value = await fetchCardsByPokedex(props.dexNum)
  } catch { /* ignore */ }
}

watch(() => props.dexNum, loadCards, { immediate: true })
</script>

<style scoped>
.ptcg-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.ptcg-related-item {
  text-align: center; text-decoration: none; color: inherit;
  transition: transform .2s;
}
.ptcg-related-item:hover { transform: translateY(-3px); text-decoration: none; }
.ptcg-related-img {
  width: 100%; border-radius: 6px;
  aspect-ratio: 63/88; object-fit: cover; background: var(--card);
}
.ptcg-related-placeholder {
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border); font-size: 11px; color: var(--text2); padding: 4px;
}
.ptcg-related-name {
  font-size: 12px; margin-top: 4px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
