<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">宝可梦图鉴</div>
        <div class="page-count">共 {{ filtered.length }} 条</div>
      </div>
      <input
        class="search-bar" style="max-width:320px"
        v-model="search" placeholder="搜索名称或编号..."
      />
    </div>
    <div class="filter-bar">
      <button
        class="filter-btn" :class="{ active: !typeFilter }"
        @click="typeFilter = ''"
      >全部</button>
      <button
        v-for="ty in types" :key="ty.id"
        class="filter-btn" :class="{ active: typeFilter === ty.id }"
        @click="typeFilter = typeFilter === ty.id ? '' : ty.id"
        :style="typeFilter === ty.id ? { background: ty.color + '33', borderColor: ty.color } : {}"
      >{{ ty.name }}</button>
    </div>
    <div class="card-grid">
      <div
        v-for="p in paged" :key="p.id"
        class="card" @click="$router.push(`/pokemon/${p.id}`)"
      >
        <div class="dex-num" style="position:absolute;top:8px;left:10px">No.{{ String(p.dexNum).padStart(4, '0') }}</div>
        <PokemonIcon v-if="p.icon" :src="p.icon" :alt="p.name" />
        <div class="name">{{ p.name }}<span v-if="p.form" class="form-label">{{ p.form }}</span></div>
        <div style="margin-top:6px">
          <span
            v-for="t in p.types" :key="t.id"
            class="type-badge" :style="{ background: t.color }"
          >{{ t.name }}</span>
        </div>
      </div>
    </div>
    <div v-if="filtered.length > pageSize" style="text-align:center;padding:20px">
      <button
        v-if="page > 1"
        class="filter-btn" @click="page--; window.scrollTo(0,0)"
      >上一页</button>
      <span style="margin:0 12px;font-size:13px;color:var(--text2)">
        {{ page }} / {{ totalPages }}
      </span>
      <button
        v-if="page < totalPages"
        class="filter-btn" @click="page++; window.scrollTo(0,0)"
      >下一页</button>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getPokemon, getTypes } from '../data.js'
import PokemonIcon from '../components/PokemonIcon.vue'

const allPokemon = ref([])
const types = ref([])
const loaded = ref(false)
const search = ref('')
const typeFilter = ref('')
const page = ref(1)
const pageSize = 60

onMounted(async () => {
  const [p, t] = await Promise.all([getPokemon(), getTypes()])
  allPokemon.value = p
  types.value = t
  loaded.value = true
})

const filtered = computed(() => {
  let list = allPokemon.value
  // 每个 dexNum 只保留第一个形态（formNo 最小的）
  const seen = new Set()
  list = list.filter(p => {
    if (seen.has(p.dexNum)) return false
    seen.add(p.dexNum)
    return true
  })
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

watch([search, typeFilter], () => { page.value = 1 })
</script>
