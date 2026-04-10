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
      <div v-for="r in ribbons" :key="r.id" class="card ribbon-card">
        <div class="dex-num" style="position:absolute;top:8px;left:10px">{{ r.id }}</div>
        <img :src="iconBase + r.id + '.png'" :alt="r.name" class="ribbon-icon" @error="e => e.target.style.visibility='hidden'" />
        <div class="name">{{ r.name || r.id }}</div>
        <div v-if="r.desc" class="ribbon-desc">{{ r.desc }}</div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRibbons } from '../data.js'

const iconBase = import.meta.env.BASE_URL + 'img/ribbon_icon/'
const ribbons = ref([])
const loaded = ref(false)

onMounted(async () => { ribbons.value = await getRibbons(); loaded.value = true })
</script>

<style scoped>
.ribbon-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}
.ribbon-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-top: 18px;
}
.ribbon-desc {
  font-size: 13px;
  color: var(--text2);
  text-align: left;
  margin-top: 4px;
}
</style>
