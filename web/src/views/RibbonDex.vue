<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">奖章 / 证章</div>
        <div class="page-count">共 {{ ribbons.length }} 个</div>
      </div>
    </div>
    <div class="card-grid">
      <div v-for="r in ribbons" :key="r.id" class="card" style="text-align:left">
        <div style="font-weight:600;font-size:15px;margin-bottom:4px">{{ r.name || r.id }}</div>
        <div v-if="r.desc" style="font-size:13px;color:var(--text2)">{{ r.desc }}</div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRibbons } from '../data.js'

const ribbons = ref([])
const loaded = ref(false)

onMounted(async () => { ribbons.value = await getRibbons(); loaded.value = true })
</script>
