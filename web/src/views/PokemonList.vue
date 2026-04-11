<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">宝可梦列表</div>
        <div class="page-count">共 {{ filtered.length }} 条</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <IconSelect v-model="typeFilter" :options="typeOptions" placeholder="全部属性">
          <template #icon="{ option }">
            <TypeIcon :tid="option.value" :size="20" />
          </template>
        </IconSelect>
        <DexSelect v-model="dexFilter" :options="dexList" />
        <input
          class="search-bar" style="max-width:320px"
          v-model="search" placeholder="搜索名称或编号..."
        />
      </div>
    </div>
    <div class="card-grid">
      <PokemonCard
        v-for="g in paged" :key="g.forms[0].id"
        :pokemonList="g.forms" @click="(p) => $router.push(`/pokemon/${p.id}`)"
      />
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup lang="ts">
defineOptions({ name: 'PokemonList' })
import { ref, computed, onMounted, watch } from 'vue'
import { getPokemon, getTypes, getDexList, type DexListEntry, type Pokemon, type TypeEntry } from '../data'
import PokemonCard from '../components/PokemonCard.vue'
import DexSelect from '../components/DexSelect.vue'
import IconSelect from '../components/IconSelect.vue'
import TypeIcon from '../components/TypeIcon.vue'
import Pagination from '../components/Pagination.vue'

const allPokemon = ref<Pokemon[]>([])
const types = ref<TypeEntry[]>([])
const dexList = ref<DexListEntry[]>([])
const loaded = ref(false)
const error = ref('')
const search = ref('')
const typeFilter = ref('')
const dexFilter = ref('')
const page = ref(1)
const pageSize = 60

onMounted(async () => {
  try {
    const [p, t, d] = await Promise.all([getPokemon(), getTypes(), getDexList()])
    allPokemon.value = p
    types.value = t
    dexList.value = d
    loaded.value = true
  } catch {
    error.value = '数据加载失败，请刷新重试'
  }
})

const typeOptions = computed(() =>
  types.value.map(ty => ({ value: ty.id, label: ty.name }))
)

const filtered = computed(() => {
  let groups: Array<{ dexNum: number; forms: Pokemon[] }>
  if (dexFilter.value) {
    // 图鉴模式：按图鉴内顺序排列，只包含图鉴内的形态，按 dexNum 分组
    const dex = dexList.value.find(d => d.id === dexFilter.value)
    if (dex) {
      const pokemonMap = new Map(allPokemon.value.map(p => [p.id, p]))
      const groupMap = new Map()
      for (const id of dex.pokemonIds) {
        const p = pokemonMap.get(id)
        if (!p) continue
        if (!groupMap.has(p.dexNum)) groupMap.set(p.dexNum, { dexNum: p.dexNum, forms: [] })
        groupMap.get(p.dexNum).forms.push(p)
      }
      groups = [...groupMap.values()]
    } else {
      groups = allPokemon.value.map(p => ({ dexNum: p.dexNum, forms: [p] }))
    }
  } else {
    // 全国图鉴模式：按 dexNum 分组，包含所有形态
    const groupMap = new Map()
    for (const p of allPokemon.value) {
      if (!groupMap.has(p.dexNum)) groupMap.set(p.dexNum, { dexNum: p.dexNum, forms: [] })
      groupMap.get(p.dexNum).forms.push(p)
    }
    groups = [...groupMap.values()]
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    groups = groups.filter(g =>
      g.forms.some(p => p.name.toLowerCase().includes(q)) ||
      String(g.dexNum).includes(q) ||
      String(g.dexNum).padStart(4, '0').includes(q)
    )
  }
  if (typeFilter.value) {
    groups = groups.filter(g => g.forms.some(p => p.types.some(t => t.id === typeFilter.value)))
  }
  return groups
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch([search, typeFilter, dexFilter], () => { page.value = 1 })

</script>
