<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div class="page-title">性格列表</div>
      <div class="page-count">
        <span style="color:#4ade80">↑ 增加</span>
        <span style="margin:0 8px;color:var(--text2)">/</span>
        <span style="color:#f87171">↓ 减少</span>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table nature-table">
        <thead>
          <tr>
            <th>性格</th>
            <th>增加能力 (×1.1)</th>
            <th>减少能力 (×0.9)</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in natures" :key="n.id">
            <td style="font-weight:600">{{ n.name }}</td>
            <td :class="n.plus ? 'plus' : 'neutral'">{{ n.plus || '—' }}</td>
            <td :class="n.minus ? 'minus' : 'neutral'">{{ n.minus || '—' }}</td>
            <td style="color:var(--text2)">{{ n.desc || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getNatures, type NatureEntry } from '../data'

const natures = ref<NatureEntry[]>([])
const loaded = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    natures.value = await getNatures()
    loaded.value = true
  } catch (_e) {
    error.value = '数据加载失败，请刷新重试'
  }
})
</script>
