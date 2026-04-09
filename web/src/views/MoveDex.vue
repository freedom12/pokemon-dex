<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">招式列表</div>
        <div class="page-count">共 {{ filtered.length }} 个招式</div>
      </div>
      <input
        class="search-bar" style="max-width:320px"
        v-model="search" placeholder="搜索招式名称..."
      />
    </div>
    <div class="filter-bar">
      <button class="filter-btn" :class="{ active: !typeFilter }" @click="typeFilter = ''">全部</button>
      <button
        v-for="ty in types" :key="ty.id"
        class="filter-btn" :class="{ active: typeFilter === ty.id }"
        @click="typeFilter = typeFilter === ty.id ? '' : ty.id"
        :style="typeFilter === ty.id ? { background: ty.color + '33', borderColor: ty.color } : {}"
      >{{ ty.name }}</button>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in paged" :key="m.id">
            <td style="color:var(--text2);font-size:13px">{{ parseInt(m.id.replace(/\D/g, ''), 10) }}</td>
            <td style="font-weight:600;white-space:nowrap"><a :href="`https://wiki.52poke.com/wiki/${m.name}`" target="_blank" rel="noopener" class="wiki-link">{{ m.name }}</a></td>
            <td>
              <span class="type-badge" :style="{ background: m.typeColor }">{{ m.typeName }}</span>
            </td>
            <td>{{ m.category }}</td>
            <td style="font-size:13px;color:var(--text2);max-width:400px">{{ m.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getMoves, getTypes } from '../data.js'
import Pagination from '../components/Pagination.vue'

const allMoves = ref([])
const types = ref([])
const loaded = ref(false)
const search = ref('')
const typeFilter = ref('')
const page = ref(1)
const pageSize = 50

onMounted(async () => {
  const [m, t] = await Promise.all([getMoves(), getTypes()])
  allMoves.value = m
  types.value = t
  loaded.value = true
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
  return list
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch([search, typeFilter], () => { page.value = 1 })

</script>
