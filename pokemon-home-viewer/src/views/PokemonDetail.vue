<template>
  <div v-if="!pokemon" class="loading">加载中...</div>
  <template v-else>
    <div style="padding-top:12px">
      <router-link to="/pokedex" style="font-size:13px">← 返回图鉴</router-link>
    </div>

    <!-- 顶部两栏布局 -->
    <div class="detail-top">
      <!-- 左侧：图片 + 形态 -->
      <div class="detail-top-left">
        <div class="detail-img-container">
          <img v-if="displayImage" :src="displayImage" :alt="pokemon.name" class="detail-main-img" />
          <PokemonIcon v-else-if="displayIcon" :src="displayIcon" :alt="pokemon.name" />
        </div>
        <div v-if="forms.length > 1" class="filter-bar" style="margin-top:8px;justify-content:center;max-width:520px">
          <button v-for="f in forms" :key="f.id" class="filter-btn" :class="{ active: f.id === pokemon.id }" @click="switchForm(f)">{{ f.form || '普通' }}</button>
        </div>
      </div>

      <!-- 右侧：信息 -->
      <div class="detail-top-right">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <div class="detail-dex">No.{{ String(pokemon.dexNum).padStart(4, '0') }}</div>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="detail-name">{{ pokemon.name }}</div>
              <template v-if="pokemon.formGender === 3">
                <button class="gender-btn" :class="{ active: !showFemale }" @click="showFemale = false" title="雄性">♂</button>
                <button class="gender-btn female" :class="{ active: showFemale }" @click="showFemale = true" title="雌性">♀</button>
              </template>
              <span v-else-if="pokemon.formGender === 1" style="font-size:18px;color:#5b9bd5">♂</span>
              <span v-else-if="pokemon.formGender === 2" style="font-size:18px;color:#e87d9f">♀</span>
              <span v-else-if="pokemon.formGender === 0" style="font-size:16px;color:var(--text2)">⚲</span>
            </div>
            <div style="margin-top:8px">
              <span v-for="t in pokemon.types" :key="t.id" class="type-badge" :style="{ background: t.color }">{{ t.name }}</span>
            </div>
          </div>
          <PokemonIcon :src="displayIcon" :alt="pokemon.name" :size="100" />
        </div>

        <!-- 基本信息 -->
        <div class="detail-info-block">
          <div class="info-row"><span class="info-label">分类</span><span>{{ pokemon.category || '—' }}</span></div>
          <div class="info-row"><span class="info-label">身高</span><span>{{ pokemon.height || '—' }}</span></div>
          <div class="info-row"><span class="info-label">体重</span><span>{{ pokemon.weight || '—' }}</span></div>
          <div class="info-row"><span class="info-label">颜色</span><span>{{ pokemon.color || '—' }}</span></div>
        </div>

        <!-- 种族值 -->
        <div v-if="pokemon.stats" class="detail-info-block">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px">
            种族值 <span style="font-weight:400;color:var(--text2);font-size:13px">合计 {{ pokemon.stats.total }}</span>
          </div>
          <div class="stat-row" v-for="s in statList" :key="s.key">
            <span class="stat-label">{{ s.label }}</span>
            <span class="stat-val">{{ pokemon.stats[s.key] }}</span>
            <div class="stat-bar-bg">
              <div class="stat-bar" :style="{ width: (pokemon.stats[s.key] / 255 * 100) + '%', background: statColor(pokemon.stats[s.key]) }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 特性 -->
    <div class="detail-section" v-if="pokemon.abilities.length">
      <h3>特性</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(ab, i) in pokemon.abilities" :key="i" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-weight:600;font-size:14px">{{ ab.name }}</div>
          <div v-if="ab.desc" style="font-size:13px;color:var(--text2);margin-top:4px">{{ ab.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 图鉴描述 -->
    <div class="detail-section" v-if="pokemon.zukanDescs && pokemon.zukanDescs.length">
      <h3>图鉴描述</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(zd, i) in pokemon.zukanDescs" :key="i" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--accent);margin-bottom:4px">{{ zd.game }}</div>
          <div style="font-size:14px;color:var(--text2);white-space:pre-line">{{ zd.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 进化链 -->
    <div class="detail-section" v-if="evoNames.length > 1">
      <h3>进化链</h3>
      <div class="evo-chain">
        <template v-for="(e, i) in evoNames" :key="i">
          <span v-if="i > 0" class="evo-arrow">→</span>
          <div class="card evo-card" :style="e.dexNum === pokemon.dexNum ? { borderColor: 'var(--accent)' } : {}" @click="goTo(e)">
            <PokemonIcon :src="e.icon" :alt="e.name" :size="80" />
            <div class="dex-num">No.{{ String(e.dexNum).padStart(4, '0') }}</div>
            <div class="name">{{ e.name }}</div>
            <div style="margin-top:4px">
              <span v-for="t in e.types" :key="t.id" class="type-badge" :style="{ background: t.color }">{{ t.name }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPokemon } from '../data.js'
import PokemonIcon from '../components/PokemonIcon.vue'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const allPokemon = ref([])
const pokemon = ref(null)
const forms = ref([])
const evoNames = ref([])
const showFemale = ref(false)

const displayIcon = computed(() => {
  if (!pokemon.value) return ''
  if (showFemale.value && pokemon.value.iconFemale) return pokemon.value.iconFemale
  return pokemon.value.icon
})

const displayImage = computed(() => {
  if (!pokemon.value) return ''
  return pokemon.value.image || ''
})

const statList = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: '攻击' },
  { key: 'def', label: '防御' },
  { key: 'spatk', label: '特攻' },
  { key: 'spdef', label: '特防' },
  { key: 'agi', label: '速度' },
]

function statColor(val) {
  if (val < 50) return '#f87171'
  if (val < 80) return '#fb923c'
  if (val < 100) return '#facc15'
  if (val < 130) return '#4ade80'
  return '#22d3ee'
}

async function loadData() {
  const all = await getPokemon()
  allPokemon.value = all
  const p = all.find(x => x.id === route.params.id)
  pokemon.value = p
  showFemale.value = false
  if (p) {
    forms.value = all.filter(x => x.dexNum === p.dexNum)
    if (p.evoChain.length > 0) {
      evoNames.value = p.evoChain.map(dex => {
        const found = all.find(x => x.dexNum === dex && x.formNo === 0)
        return found
          ? { id: found.id, dexNum: found.dexNum, name: found.name, icon: found.icon, types: found.types }
          : { id: '', dexNum: dex, name: `#${dex}`, icon: '', types: [] }
      })
    } else {
      evoNames.value = []
    }
  }
}

function switchForm(f) { router.push(`/pokemon/${f.id}`) }
function goTo(e) { if (e.id) router.push(`/pokemon/${e.id}`) }

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>
