<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">宝可梦列表</div>
        <div class="page-count">共 {{ filtered.length }} 条</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select class="type-select" v-model="typeFilter">
          <option value="">全部属性</option>
          <option v-for="ty in types" :key="ty.id" :value="ty.id">{{ ty.name }}</option>
        </select>
        <DexSelect v-model="dexFilter" :options="dexList" />
        <input
          class="search-bar" style="max-width:320px"
          v-model="search" placeholder="搜索名称或编号..."
        />
      </div>
    </div>
    <div class="card-grid">
      <PokemonCard
        v-for="p in paged" :key="p.id"
        :pokemon="p" @click="$router.push(`/pokemon/${p.id}`)"
      />
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup>
defineOptions({ name: 'PokemonList' })
import { ref, computed, onMounted, watch } from 'vue'
import { getPokemon, getTypes, getDexList } from '../data.js'
import PokemonCard from '../components/PokemonCard.vue'
import DexSelect from '../components/DexSelect.vue'
import Pagination from '../components/Pagination.vue'

const allPokemon = ref([])
const types = ref([])
const dexList = ref([])
const loaded = ref(false)
const search = ref('')
const typeFilter = ref('')
const dexFilter = ref('')
const page = ref(1)
const pageSize = 60

onMounted(async () => {
  const [p, t, d] = await Promise.all([getPokemon(), getTypes(), getDexList()])
  allPokemon.value = p
  types.value = t
  dexList.value = d
  loaded.value = true
})

const filtered = computed(() => {
  let list = allPokemon.value

  if (dexFilter.value) {
    // 图鉴模式：按图鉴内顺序排列，保留图鉴指定的形态
    const dex = dexList.value.find(d => d.id === dexFilter.value)
    if (dex) {
      const pokemonMap = new Map(allPokemon.value.map(p => [p.id, p]))
      list = dex.pokemonIds.map(id => pokemonMap.get(id)).filter(Boolean)
    }
  } else {
    // 全国图鉴模式：每个 dexNum 只保留第一个形态
    const seen = new Set()
    list = list.filter(p => {
      if (seen.has(p.dexNum)) return false
      seen.add(p.dexNum)
      return true
    })
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.dexNum).includes(q) ||
      String(p.dexNum).padStart(4, '0').includes(q)
    )
  }
  if (typeFilter.value) {
    list = list.filter(p => p.types.some(t => t.id === typeFilter.value))
  }
  return list
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch([search, typeFilter, dexFilter], () => { page.value = 1 })

</script>
