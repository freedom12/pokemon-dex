<template>
  <div class="page-header">
    <div>
      <div class="page-title">宝可梦卡牌 PTCG</div>
      <div class="ptcg-breadcrumb">
        <router-link to="/ptcg" class="ptcg-crumb" :class="{ active: level === 'series' }">All Series</router-link>
        <template v-if="level === 'sets'">
          <span class="ptcg-sep">›</span>
          <span class="ptcg-crumb active">{{ currentSeriesName }}</span>
        </template>
        <template v-if="level === 'cards'">
          <span class="ptcg-sep">›</span>
          <router-link :to="`/ptcg/serie/${encodeURIComponent(setSeriesName)}`" class="ptcg-crumb">{{ setSeriesName }}</router-link>
          <span class="ptcg-sep">›</span>
          <span class="ptcg-crumb active">{{ currentSet?.name }}</span>
        </template>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading">加载中...</div>

  <!-- 系列列表：主系列 + 特殊系列 -->
  <template v-if="!loading && level === 'series'">
    <PtcgSerieList :series="mainSeries" @select="goToSeries" />
    <div v-if="specialSeries.length" class="ptcg-group-divider"> </div>
    <PtcgSerieList v-if="specialSeries.length" :series="specialSeries" @select="goToSeries" />
  </template>

  <PtcgSetList v-if="!loading && level === 'sets'" :sets="filteredSets" @select="goToSet" />
  <PtcgCardGrid v-show="!loading && level === 'cards'" :cards="cards" />
</template>

<script setup lang="ts">
defineOptions({ name: 'PtcgView' })
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PtcgSerieList from '../components/PtcgSerieList.vue'
import PtcgSetList from '../components/PtcgSetList.vue'
import PtcgCardGrid from '../components/PtcgCardGrid.vue'
import { fetchAllSets, fetchCardsBySet, type PtcgSet, type PtcgCardBrief } from '../ptcg/api'
import { SPECIAL_SET_IDS, SPECIAL_SET_GROUPS, MAIN_SERIES_SUB_PATTERNS } from '../constants/ptcg'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const allSets = ref<PtcgSet[]>([])
const cards = ref<PtcgCardBrief[]>([])
const currentSet = ref<PtcgSet | null>(null)

const serieId = computed(() => route.params.serieId as string | undefined)
const setId = computed(() => route.params.setId as string | undefined)
const level = computed(() => {
  if (setId.value) return 'cards'
  if (serieId.value) return 'sets'
  return 'series'
})

const currentSeriesName = computed(() => serieId.value ? decodeURIComponent(serieId.value) : '')

// 为 set 详情页面包屑找到所属系列名
const setSeriesName = computed(() => {
  if (!currentSet.value) return ''
  // 如果是特殊 set，返回其特殊分组 label
  for (const g of SPECIAL_SET_GROUPS) {
    if (g.ids.includes(currentSet.value.id)) return g.label
  }
  return currentSet.value.series
})

// 主系列：从非特殊 set 中提取唯一 series，倒序
const mainSeries = computed(() => {
  const isSub = (s: PtcgSet) => MAIN_SERIES_SUB_PATTERNS.some(p => p.match.test(s.name))
  const seen = new Map<string, PtcgSet>()
  for (const s of allSets.value) {
    if (SPECIAL_SET_IDS.has(s.id)) continue
    if (isSub(s)) continue
    if (!seen.has(s.series)) seen.set(s.series, s)
  }
  return Array.from(seen.entries()).map(([name, sample]) => ({
    id: name, name, logo: sample.images.logo,
  })).reverse()
})

// 特殊系列：按配置分组，每组作为一个"系列"
const specialSeries = computed(() => {
  const setMap = new Map(allSets.value.map(s => [s.id, s]))
  return SPECIAL_SET_GROUPS.map(g => {
    const sample = g.ids.map(id => setMap.get(id)).find(Boolean)
    return { id: g.label, name: g.label, logo: sample?.images.logo }
  }).filter(s => s.logo) // 只显示有数据的
})

// 当前系列下的 sets
const filteredSets = computed(() => {
  if (!serieId.value) return []
  const name = decodeURIComponent(serieId.value)
  // 检查是否是特殊分组
  const specialGroup = SPECIAL_SET_GROUPS.find(g => g.label === name)
  if (specialGroup) {
    const setMap = new Map(allSets.value.map(s => [s.id, s]))
    return specialGroup.ids.map(id => setMap.get(id)).filter(Boolean).reverse() as PtcgSet[]
  }
  // 主系列：排除特殊 set
  return allSets.value.filter(s => s.series === name && !SPECIAL_SET_IDS.has(s.id)).reverse()
})

async function loadSets() {
  if (allSets.value.length) return
  loading.value = true
  try {
    allSets.value = await fetchAllSets()
  } finally { loading.value = false }
}

async function loadCards(id: string) {
  // 如果已经加载过同一个 set，跳过
  if (currentSet.value?.id === id && cards.value.length) return
  loading.value = true
  cards.value = []
  currentSet.value = allSets.value.find(s => s.id === id) ?? null
  try {
    cards.value = await fetchCardsBySet(id)
  } finally { loading.value = false }
}

function goToSeries(s: { id: string }) {
  router.push(`/ptcg/serie/${encodeURIComponent(s.id)}`)
}

function goToSet(s: PtcgSet) {
  router.push(`/ptcg/set/${s.id}`)
}

async function loadForRoute() {
  await loadSets()
  if (setId.value) {
    loadCards(setId.value)
  } else {
    cards.value = []
    currentSet.value = null
  }
}

watch(() => route.fullPath, loadForRoute)
loadForRoute()
</script>

<style scoped>
.ptcg-breadcrumb {
  display: flex; align-items: center; gap: 4px;
  font-size: 14px; color: var(--text2); margin-top: 4px;
}
.ptcg-crumb {
  cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all .15s;
  text-decoration: none; color: var(--text2);
}
.ptcg-crumb:hover { color: var(--accent); text-decoration: none; }
.ptcg-crumb.active { color: var(--text); cursor: default; }
.ptcg-sep { color: var(--text2); font-size: 12px; }

.ptcg-group-divider {
  margin: 24px 0 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
</style>
