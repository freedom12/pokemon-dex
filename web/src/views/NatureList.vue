<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div class="page-title">性格列表</div>
      <div class="page-count" style="display:flex;align-items:center;gap:4px">
        <img :src="addIcon" alt="增加" style="width:16px;height:16px" /> 增加
        <span style="margin:0 8px;color:var(--text2)">/</span>
        <img :src="decIcon" alt="减少" style="width:16px;height:16px" /> 减少
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
            <td style="vertical-align:middle"><span v-if="getNatureSids(n)" style="display:inline-flex;align-items:center;gap:2px"><img :src="addIcon" alt="增加" style="width:14px;height:14px" /><StatIcon :sid="getNatureSids(n)!.plusSid" :label="n.plus" :size="16" /></span><span v-else style="color:var(--text2)">--</span></td>
            <td style="vertical-align:middle"><span v-if="getNatureSids(n)" style="display:inline-flex;align-items:center;gap:2px"><img :src="decIcon" alt="减少" style="width:14px;height:14px" /><StatIcon :sid="getNatureSids(n)!.minusSid" :label="n.minus" :size="16" /></span><span v-else style="color:var(--text2)">--</span></td>
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
import StatIcon from '../components/StatIcon.vue'

const BASE = import.meta.env.BASE_URL + 'img/statistic_icon/'
const addIcon = BASE + 'statistic_add.png'
const decIcon = BASE + 'statistic_dec.png'

// 性格ID PE0000~PE0024 排列为 5×5 矩阵
// 行(plus): 攻击(02) 防御(03) 速度(06) 特攻(04) 特防(05)
// 列(minus): 攻击(02) 防御(03) 速度(06) 特攻(04) 特防(05)
// 对角线(n%6==0)为无影响性格
const statSids = ['02', '03', '06', '04', '05']

function getNatureSids(n: NatureEntry): { plusSid: string; minusSid: string } | null {
  const num = parseInt(n.id.replace(/\D/g, ''), 10)
  if (num % 6 === 0) return null // 无影响性格
  const row = Math.floor(num / 5)
  const col = num % 5
  return { plusSid: statSids[row], minusSid: statSids[col] }
}

const natures = ref<NatureEntry[]>([])
const loaded = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    natures.value = await getNatures()
    loaded.value = true
  } catch {
    error.value = '数据加载失败，请刷新重试'
  }
})
</script>
