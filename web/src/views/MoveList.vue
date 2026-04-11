<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">招式列表</div>
        <div class="page-count">共 {{ filtered.length }} 个招式</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="type-select" v-model="typeFilter">
          <option value="">全部属性</option>
          <option v-for="ty in types" :key="ty.id" :value="ty.id">{{ ty.name }}</option>
        </select>
        <select class="type-select" v-model="categoryFilter">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <input
          class="search-bar" style="max-width:320px"
          v-model="search" placeholder="搜索招式名称..."
        />
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th>招式名称</th>
            <th>属性</th>
            <th>分类</th>
            <th>描述</th>
            <th style="width:36px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in paged" :key="m.id" class="move-row">
            <td style="color:var(--text2);font-size:13px">{{ parseInt(m.id.replace(/\D/g, ''), 10) }}</td>
            <td style="font-weight:600;white-space:nowrap"><a :href="`https://wiki.52poke.com/wiki/${m.name}`" target="_blank" rel="noopener" class="wiki-link">{{ m.name }}</a></td>
            <td>
              <TypeIcon :tid="m.type" :alt="m.typeName" />
            </td>
            <td><MoveCategoryIcon :cid="m.categoryId" :alt="m.category" :size="32" /></td>
            <td style="font-size:13px;color:var(--text2);max-width:400px">{{ m.desc }}</td>
            <td>
              <button class="lookup-btn" title="查看可学习此招式的宝可梦" @click="lookupMove(m)">🔍</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />

    <PokemonLookup :visible="lookupVisible" :title="lookupTitle" :pokemon="lookupResults" @close="lookupVisible = false" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getMoves, getTypes, getPokemon, getLearnsets } from '../data'
import Pagination from '../components/Pagination.vue'
import PokemonLookup from '../components/PokemonLookup.vue'
import MoveCategoryIcon from '../components/MoveCategoryIcon.vue'
import TypeIcon from '../components/TypeIcon.vue'

const allMoves = ref([])
const types = ref([])
const allPokemon = ref([])
const allLearnsets = ref({})
const loaded = ref(false)
const search = ref('')
const typeFilter = ref('')
const categoryFilter = ref('')
const page = ref(1)
const pageSize = 50

const lookupVisible = ref(false)
const lookupTitle = ref('')
const lookupResults = ref([])

onMounted(async () => {
  const [m, t, p, ls] = await Promise.all([getMoves(), getTypes(), getPokemon(), getLearnsets().catch(() => ({}))])
  allMoves.value = m
  types.value = t
  allPokemon.value = p
  allLearnsets.value = ls
  loaded.value = true
})

const categories = computed(() => {
  const set = new Set(allMoves.value.map(m => m.category).filter(Boolean))
  return [...set]
})

const filtered = computed(() => {
  let list = allMoves.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(q))
  }
  if (typeFilter.value) {
    list = list.filter(m => m.type === typeFilter.value)
  }
  if (categoryFilter.value) {
    list = list.filter(m => m.category === categoryFilter.value)
  }
  return list
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch([search, typeFilter, categoryFilter], () => { page.value = 1 })

function lookupMove(move) {
  const moveNum = parseInt(move.id.replace(/\D/g, ''), 10)
  const seen = new Set()
  const results = []
  for (const [dexNum, speciesData] of Object.entries(allLearnsets.value)) {
    let found = false
    for (const formData of Object.values(speciesData)) {
      for (const vgData of Object.values(formData)) {
        const allMoveIds = [
          ...(vgData['level-up'] || []).map(e => e.move),
          ...(vgData.machine || []),
          ...(vgData.egg || []),
          ...(vgData.tutor || []),
        ]
        if (allMoveIds.includes(moveNum)) { found = true; break }
      }
      if (found) break
    }
    if (found) {
      const num = parseInt(dexNum, 10)
      if (!seen.has(num)) {
        const p = allPokemon.value.find(pk => pk.dexNum === num && pk.formNo === 0)
        if (p) { seen.add(num); results.push(p) }
      }
    }
  }
  results.sort((a, b) => a.dexNum - b.dexNum)
  lookupTitle.value = `可学习「${move.name}」的宝可梦 (${results.length})`
  lookupResults.value = results
  lookupVisible.value = true
}
</script>

<style scoped>
.lookup-btn {
  opacity: 0; background: none; border: none;
  cursor: pointer; font-size: 14px; padding: 2px 6px;
  border-radius: 4px; transition: opacity 0.15s;
}
.move-row:hover .lookup-btn { opacity: 1; }
.lookup-btn:hover { background: var(--bg2); }
</style>
