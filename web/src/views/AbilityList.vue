<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">特性列表</div>
        <div class="page-count">共 {{ filtered.length }} 个特性</div>
      </div>
      <input
        class="search-bar" style="max-width:320px"
        v-model="search" placeholder="搜索特性名称..."
      />
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th style="min-width:120px">特性名称</th>
            <th>描述</th>
            <th style="width:36px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in paged" :key="a.id" class="ability-row">
            <td style="color:var(--text2);font-size:13px">{{ parseInt(a.id.replace(/\D/g, ''), 10) }}</td>
            <td style="font-weight:600;white-space:nowrap"><a :href="`https://wiki.52poke.com/wiki/${a.name}`" target="_blank" rel="noopener" class="wiki-link">{{ a.name }}</a></td>
            <td style="font-size:13px;color:var(--text2)">{{ a.desc }}</td>
            <td>
              <button class="lookup-btn" title="查看拥有此特性的宝可梦" @click="lookupAbility(a)">🔍</button>
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
import { getAbilities, getPokemon } from '../data'
import type { Pokemon, AbilityEntry } from '../types'
import { usePokemonLookup } from '../composables/usePokemonLookup'
import Pagination from '../components/Pagination.vue'
import PokemonLookup from '../components/PokemonLookup.vue'

const allAbilities = ref<AbilityEntry[]>([])
const allPokemon = ref<Pokemon[]>([])
const loaded = ref(false)
const error = ref('')
const search = ref('')
const page = ref(1)
const pageSize = 50

const { lookupVisible, lookupTitle, lookupResults, lookupByAbility, closeLookup } = usePokemonLookup()

onMounted(async () => {
  try {
    const [a, p] = await Promise.all([getAbilities(), getPokemon()])
    allAbilities.value = a
    allPokemon.value = p
    loaded.value = true
  } catch {
    error.value = '数据加载失败，请刷新重试'
  }
})

const filtered = computed(() => {
  if (!search.value) return allAbilities.value
  const q = search.value.toLowerCase()
  return allAbilities.value.filter(a => a.name.toLowerCase().includes(q) || (a.desc ?? '').toLowerCase().includes(q))
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch(search, () => { page.value = 1 })

function lookupAbility(ab: AbilityEntry) {
  lookupByAbility(ab.name, allPokemon.value)
}
</script>

<style scoped>
.lookup-btn {
  opacity: 0; background: none; border: none;
  cursor: pointer; font-size: 14px; padding: 2px 6px;
  border-radius: 4px; transition: opacity 0.15s;
}
.ability-row:hover .lookup-btn { opacity: 1; }
.lookup-btn:hover { background: var(--bg2); }
</style>
