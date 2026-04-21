<template>
  <div class="page-header">
    <div>
      <div class="page-title">宝可梦卡牌 PTCG</div>
      <div class="ptcg-breadcrumb">
        <router-link to="/ptcg" class="ptcg-crumb" :class="{ active: level === 'series' }">English</router-link>
        <template v-if="level === 'sets'">
          <span class="ptcg-sep">›</span>
          <span class="ptcg-crumb active">{{ serieName }}</span>
        </template>
        <template v-if="level === 'cards'">
          <span class="ptcg-sep">›</span>
          <router-link v-if="serieIdResolved" :to="`/ptcg/serie/${serieIdResolved}`" class="ptcg-crumb">{{ serieName }}</router-link>
          <span class="ptcg-sep">›</span>
          <span class="ptcg-crumb active">{{ setName }}</span>
        </template>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading">加载中...</div>
  <PtcgSerieList v-else-if="level === 'series'" :series="series" @select="goToSerie" />
  <PtcgSetList v-else-if="level === 'sets'" :sets="sets" @select="goToSet" />
  <PtcgCardGrid v-else :cards="cards" />
</template>

<script setup lang="ts">
defineOptions({ name: 'PtcgView' })
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PtcgSerieList from '../components/PtcgSerieList.vue'
import PtcgSetList from '../components/PtcgSetList.vue'
import PtcgCardGrid from '../components/PtcgCardGrid.vue'
import type { SerieBrief, SetBrief, SerieDetail, CardBrief } from '../ptcg/types'

const router = useRouter()
const route = useRoute()
const API = 'https://api.tcgdex.net/v2/en'

const loading = ref(false)
const series = ref<SerieBrief[]>([])
const sets = ref<SetBrief[]>([])
const cards = ref<CardBrief[]>([])
const serieName = ref('')
const serieIdResolved = ref('')
const setName = ref('')

const serieId = computed(() => route.params.serieId as string | undefined)
const setId = computed(() => route.params.setId as string | undefined)
const level = computed(() => {
  if (setId.value) return 'cards'
  if (serieId.value) return 'sets'
  return 'series'
})

async function fetchSeries() {
  loading.value = true
  try {
    const res = await fetch(`${API}/series`)
    if (res.ok) series.value = await res.json()
  } finally { loading.value = false }
}

async function fetchSets(id: string) {
  loading.value = true
  try {
    const res = await fetch(`${API}/series/${id}`)
    if (res.ok) {
      const data: SerieDetail = await res.json()
      sets.value = data.sets ?? []
      serieName.value = data.name
    }
  } finally { loading.value = false }
}

async function fetchCards(id: string) {
  loading.value = true
  try {
    const res = await fetch(`${API}/sets/${id}`)
    if (res.ok) {
      const data = await res.json()
      cards.value = data.cards ?? []
      setName.value = data.name ?? id
      if (data.serie) {
        serieIdResolved.value = data.serie.id ?? ''
        serieName.value = data.serie.name ?? ''
      }
    }
  } finally { loading.value = false }
}

function goToSerie(s: SerieBrief) { router.push(`/ptcg/serie/${s.id}`) }
function goToSet(s: SetBrief) { router.push(`/ptcg/set/${s.id}`) }

function loadForRoute() {
  if (setId.value) fetchCards(setId.value)
  else if (serieId.value) fetchSets(serieId.value)
  else fetchSeries()
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
</style>
