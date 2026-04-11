<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
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

    <PokemonLookup :visible="lookupVisible" :title="lookupTitle" :pokemon="lookupResults" @close="closeLookup" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getMoves, getTypes, getPokemon, getLearnsets } from '../data'
import type { Pokemon, MoveEntry, TypeEntry } from '../types'
import { usePokemonLookup } from '../composables/usePokemonLookup'
import type { Learnsets } from '../composables/usePokemonLookup'
import Pagination from '../components/Pagination.vue'
import PokemonLookup from '../components/PokemonLookup.vue'
import MoveCategoryIcon from '../components/MoveCategoryIcon.vue'
import TypeIcon from '../components/TypeIcon.vue'

const allMoves = ref<MoveEntry[]>([])
const types = ref<TypeEntry[]>([])
const allPokemon = ref<Pokemon[]>([])
const allLearnsets = ref<Learnsets>({})
const loaded = ref(false)
const error = ref('')
const search = ref('')
const typeFilter = ref('')
const categoryFilter = ref('')
const page = ref(1)
const pageSize = 50

const { lookupVisible, lookupTitle, lookupResults, lookupByMove, closeLookup } = usePokemonLookup()

onMounted(async () => {
  try {
    const [m, t, p, ls] = await Promise.all([getMoves(), getTypes(), getPokemon(), getLearnsets().catch(() => ({} as Learnsets))])
    allMoves.value = m
    types.value = t
    allPokemon.value = p
    allLearnsets.value = ls
    loaded.value = true
  } catch (_e) {
    error.value = '数据加载失败，请刷新重试'
  }
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

function lookupMove(m: MoveEntry) {
  lookupByMove(
    parseInt(m.id.replace(/\D/g, ''), 10),
    m.name,
    allLearnsets.value,
    allPokemon.value,
  )
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
