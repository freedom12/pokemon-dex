<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div class="page-title">属性</div>
    </div>
    <div class="type-grid">
      <div v-for="ty in types" :key="ty.id" class="type-card">
        <TypeIcon :tid="ty.id" :alt="ty.name" :size="48" />
        <div style="margin-top:10px;text-align:left">
          <div v-if="ty.weakTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">弱点 (2×)</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              <TypeIcon v-for="wid in ty.weakTo" :key="wid" :tid="wid" :alt="typeNameMap[wid] || wid" :size="28" />
            </div>
          </div>
          <div v-if="ty.resistTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">抵抗 (0.5×)</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              <TypeIcon v-for="rid in ty.resistTo" :key="rid" :tid="rid" :alt="typeNameMap[rid] || rid" :size="28" />
            </div>
          </div>
          <div v-if="ty.immuneTo.length" style="margin:6px 0">
            <div style="font-size:11px;color:var(--text2);margin-bottom:3px">免疫 (0×)</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              <TypeIcon v-for="iid in ty.immuneTo" :key="iid" :tid="iid" :alt="typeNameMap[iid] || iid" :size="28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTypes, type TypeEntry } from '../data'
import TypeIcon from '../components/TypeIcon.vue'

const types = ref<TypeEntry[]>([])
const loaded = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    types.value = await getTypes()
    loaded.value = true
  } catch {
    error.value = '数据加载失败，请刷新重试'
  }
})

const typeNameMap = computed(() => {
  const m: Record<string, string> = {}
  for (const t of types.value) m[t.id] = t.name
  return m
})
</script>
