<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div class="page-title">属性一览</div>
    </div>
    <div class="type-grid">
      <div v-for="ty in types" :key="ty.id" class="type-card">
        <span class="type-badge" :style="{ background: ty.color, fontSize: '14px', padding: '4px 16px' }">
          {{ ty.name }}
        </span>
        <div style="margin-top:10px;text-align:left">
          <div v-if="ty.weakTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">弱点 (2×)</div>
            <span
              v-for="wid in ty.weakTo" :key="wid"
              class="type-badge" :style="{ background: typeColorMap[wid] || '#666', fontSize: '11px' }"
            >{{ typeNameMap[wid] || wid }}</span>
          </div>
          <div v-if="ty.resistTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">抵抗 (0.5×)</div>
            <span
              v-for="rid in ty.resistTo" :key="rid"
              class="type-badge" :style="{ background: typeColorMap[rid] || '#666', fontSize: '11px' }"
            >{{ typeNameMap[rid] || rid }}</span>
          </div>
          <div v-if="ty.immuneTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">免疫 (0×)</div>
            <span
              v-for="iid in ty.immuneTo" :key="iid"
              class="type-badge" :style="{ background: typeColorMap[iid] || '#666', fontSize: '11px' }"
            >{{ typeNameMap[iid] || iid }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTypes } from '../data.js'

const types = ref([])
const loaded = ref(false)

onMounted(async () => {
  types.value = await getTypes()
  loaded.value = true
})

const typeNameMap = computed(() => {
  const m = {}
  for (const t of types.value) m[t.id] = t.name
  return m
})
const typeColorMap = computed(() => {
  const m = {}
  for (const t of types.value) m[t.id] = t.color
  return m
})
</script>
