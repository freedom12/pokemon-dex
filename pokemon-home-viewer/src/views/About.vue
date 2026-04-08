<template>
  <div class="about-section">
    <div class="page-title" style="margin-bottom:16px">关于</div>
    <p>本站可视化展示 Pokémon HOME 手机版的解包数据，数据来源于以下两个开源仓库：</p>
    <div style="margin:16px 0;padding:16px;background:var(--card);border-radius:var(--radius);border:1px solid var(--border)">
      <div style="font-weight:600;margin-bottom:4px">madatsubomi</div>
      <p>Pokémon HOME 手机版历史 Master Data，包含宝可梦种族值、图鉴、招式、特性、性格、精灵球、缎带、成就等 96 个结构化数据表。</p>
    </div>
    <div style="margin:16px 0;padding:16px;background:var(--card);border-radius:var(--radius);border:1px solid var(--border)">
      <div style="font-weight:600;margin-bottom:4px">megaturtle-text</div>
      <p>Pokémon HOME 手机版全部 UI 和游戏文本，支持 11 种语言。本站使用简体中文文本进行本地化。</p>
    </div>

    <div v-if="loaded" style="margin-top:24px">
      <div style="font-weight:600;margin-bottom:8px">数据统计</div>
      <div class="info-grid">
        <div class="info-item"><span class="label">宝可梦</span>{{ stats.pokemon }} 条</div>
        <div class="info-item"><span class="label">招式</span>{{ stats.moves }} 个</div>
        <div class="info-item"><span class="label">属性</span>{{ stats.types }} 种</div>
        <div class="info-item"><span class="label">性格</span>{{ stats.natures }} 种</div>
        <div class="info-item"><span class="label">精灵球</span>{{ stats.balls }} 种</div>
        <div class="info-item"><span class="label">地区</span>{{ stats.regions }} 个</div>
        <div class="info-item"><span class="label">游戏版本</span>{{ stats.softwares }} 个</div>
      </div>
    </div>

    <div v-if="softwares.length" style="margin-top:24px">
      <div style="font-weight:600;margin-bottom:8px">支持的游戏版本</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span
          v-for="s in softwares" :key="s.id"
          class="type-badge" style="background:var(--bg3)"
        >{{ s.name }}</span>
      </div>
    </div>

    <div v-if="regions.length" style="margin-top:24px">
      <div style="font-weight:600;margin-bottom:8px">地区</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span
          v-for="r in regions" :key="r.id"
          class="type-badge" style="background:var(--bg3)"
        >{{ r.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPokemon, getMoves, getTypes, getNatures, getBalls, getRegions, getSoftwares } from '../data.js'

const loaded = ref(false)
const stats = ref({})
const softwares = ref([])
const regions = ref([])

onMounted(async () => {
  const [p, m, t, n, b, r, s] = await Promise.all([
    getPokemon(), getMoves(), getTypes(), getNatures(), getBalls(), getRegions(), getSoftwares()
  ])
  stats.value = {
    pokemon: p.length, moves: m.length, types: t.length,
    natures: n.length, balls: b.length, regions: r.length, softwares: s.length,
  }
  softwares.value = s
  regions.value = r
  loaded.value = true
})
</script>
