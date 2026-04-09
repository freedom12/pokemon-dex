<template>
  <div v-if="!loaded" class="loading">加载中...</div>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in paged" :key="a.id">
            <td style="color:var(--text2);font-size:13px">{{ parseInt(a.id.replace(/\D/g, ''), 10) }}</td>
            <td style="font-weight:600;white-space:nowrap"><a :href="`https://wiki.52poke.com/wiki/${a.name}`" target="_blank" rel="noopener" class="wiki-link">{{ a.name }}</a></td>
            <td style="font-size:13px;color:var(--text2)">{{ a.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAbilities } from '../data.js'
import Pagination from '../components/Pagination.vue'

const allAbilities = ref([])
const loaded = ref(false)
const search = ref('')
const page = ref(1)
const pageSize = 50

onMounted(async () => {
  allAbilities.value = await getAbilities()
  loaded.value = true
})

const filtered = computed(() => {
  if (!search.value) return allAbilities.value
  const q = search.value.toLowerCase()
  return allAbilities.value.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch(search, () => { page.value = 1 })

</script>
