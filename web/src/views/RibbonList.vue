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
        <div class="ribbon-img-wrap">
          <button v-if="r.hasAlt" class="ribbon-switch" @click="toggleAlt(r.id)">‹</button>
          <img :src="imgSrc(r)" :alt="r.name" class="ribbon-icon" @error="e => e.target.style.visibility='hidden'" />
          <button v-if="r.hasAlt" class="ribbon-switch" @click="toggleAlt(r.id)">›</button>
        </div>
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
const altState = ref({})

onMounted(async () => { ribbons.value = await getRibbons(); loaded.value = true })

function toggleAlt(id) { altState.value[id] = !altState.value[id] }
function imgSrc(r) { return iconBase + r.id + (r.hasAlt && altState.value[r.id] ? 'b' : '') + '.png' }
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
.ribbon-img-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 18px;
}
.ribbon-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
}
.ribbon-switch {
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text2);
  font-size: 18px;
  line-height: 1;
  padding: 2px 6px;
  cursor: pointer;
}
.ribbon-switch:hover {
  background: var(--hover);
  color: var(--text);
}
.ribbon-desc {
  font-size: 13px;
  color: var(--text2);
  text-align: left;
  align-self: stretch;
  margin-top: 4px;
}
</style>
