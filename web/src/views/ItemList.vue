<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">道具列表</div>
        <div class="page-count">共 {{ filtered.length }} 个道具</div>
      </div>
      <input class="search-bar" style="max-width:320px" v-model="search" placeholder="搜索道具名称..." />
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr><th style="width:50px">#</th><th style="width:48px"></th><th>道具名称</th><th>说明</th></tr></thead>
        <tbody>
          <tr v-for="item in paged" :key="item.id">
            <td style="color:var(--text2);font-size:13px">{{ item.id }}</td>
            <td><ItemIcon :src="`https://resource.pokemon-home.com/battledata/img/item/item_${String(item.id).padStart(4, '0')}.png`" :alt="item.name" /></td>
            <td style="font-weight:600;white-space:nowrap"><a :href="`https://wiki.52poke.com/wiki/${item.name}`" target="_blank" rel="noopener" class="wiki-link">{{ item.name }}</a></td>
            <td style="color:var(--text2);font-size:13px">{{ item.desc || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pagination v-model="page" :totalPages="totalPages" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getItems, type ItemEntry } from '../data'
import ItemIcon from '../components/ItemIcon.vue'
import Pagination from '../components/Pagination.vue'

const allItems = ref<ItemEntry[]>([])
const loaded = ref(false)
const error = ref('')
const search = ref('')
const page = ref(1)
const pageSize = 50

onMounted(async () => {
  try {
    allItems.value = await getItems()
    loaded.value = true
  } catch {
    error.value = '数据加载失败，请刷新重试'
  }
})

const filtered = computed(() => {
  if (!search.value) return allItems.value
  const q = search.value.toLowerCase()
  return allItems.value.filter(i => i.name.toLowerCase().includes(q) || String(i.id).includes(q) || (i.desc && String(i.desc).toLowerCase().includes(q)))
})
const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(search, () => { page.value = 1 })

</script>
