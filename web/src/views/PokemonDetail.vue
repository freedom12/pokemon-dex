<template>
  <div v-if="!pokemon" class="loading">加载中...</div>
  <template v-else>
    <div style="padding-top:12px">
      <router-link to="/pokemons" style="font-size:13px">← 返回</router-link>
    </div>

    <!-- 顶部两栏布局 -->
    <div class="detail-top">
      <!-- 左侧：图片 + 形态 -->
      <div class="detail-top-left">
        <div class="detail-img-container">
          <a v-if="displayImage" :href="`https://wiki.52poke.com/wiki/${pokemon.name}`" target="_blank" rel="noopener">
            <img :src="displayImage" :alt="pokemon.name" class="detail-main-img" />
          </a>
          <a v-else-if="displayIcon" :href="`https://wiki.52poke.com/wiki/${pokemon.name}`" target="_blank" rel="noopener">
            <PokemonIcon :src="displayIcon" :alt="pokemon.name" />
          </a>
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
      <h3 class="section-toggle" @click="abilityOpen = !abilityOpen">特性 <span class="toggle-arrow" :class="{ open: abilityOpen }">▸</span></h3>
      <div v-show="abilityOpen" style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(ab, i) in pokemon.abilities" :key="i" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-weight:600;font-size:14px"><a :href="`https://wiki.52poke.com/wiki/${ab.name}`" target="_blank" rel="noopener" class="wiki-link">{{ ab.name }}</a></div>
          <div v-if="ab.desc" style="font-size:13px;color:var(--text2);margin-top:4px">{{ ab.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 图鉴描述 -->
    <div class="detail-section" v-if="pokemon.zukanDescs && pokemon.zukanDescs.length">
      <h3 class="section-toggle" @click="zukanOpen = !zukanOpen">图鉴描述 <span class="toggle-arrow" :class="{ open: zukanOpen }">▸</span></h3>
      <div v-show="zukanOpen" style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(zd, i) in pokemon.zukanDescs" :key="i" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--accent);margin-bottom:4px">{{ zd.game }}</div>
          <div style="font-size:14px;color:var(--text2);white-space:pre-line">{{ zd.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 进化链 -->
    <div class="detail-section" v-if="evoTree.length > 0">
      <h3 class="section-toggle" @click="evoOpen = !evoOpen">进化链 <span class="toggle-arrow" :class="{ open: evoOpen }">▸</span></h3>
      <div v-show="evoOpen" class="evo-chain">
        <template v-for="(node, i) in evoTree" :key="i">
          <span v-if="i > 0 && !node.isBranchStart" class="evo-arrow">→</span>
          <!-- 分支显示 -->
          <div v-if="node.branches" class="evo-branch-group">
            <div class="evo-branch-col">
              <template v-for="(b, bi) in node.branches" :key="bi">
                <div v-if="Array.isArray(b)" class="evo-branch-row">
                  <template v-for="(sub, si) in b" :key="si">
                    <span v-if="si > 0" class="evo-arrow">→</span>
                    <PokemonCard :pokemon="sub" :highlight="isCurrent(sub)" @click="goTo(sub)" />
                  </template>
                </div>
                <PokemonCard v-else :pokemon="b" :highlight="isCurrent(b)" @click="goTo(b)" />
              </template>
            </div>
          </div>
          <!-- 普通节点 -->
          <PokemonCard v-else :pokemon="node" :highlight="isCurrent(node)" @click="goTo(node)" />
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
import PokemonCard from '../components/PokemonCard.vue'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const allPokemon = ref([])
const pokemon = ref(null)
const forms = ref([])
const evoTree = ref([])
const showFemale = ref(false)
const zukanOpen = ref(true)
const abilityOpen = ref(true)
const evoOpen = ref(true)

function isCurrent(node) {
  return pokemon.value && node.dexNum === pokemon.value.dexNum && node.formNo === pokemon.value.formNo
}

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

// 根据 templatePrefab 构建进化树
function buildEvoTree(nodes, template) {
  if (!nodes || nodes.length <= 1) return nodes || []
  const t = template || ''

  // 伊布特殊：1 → 多分支
  if (t.includes('Eevee')) {
    return [nodes[0], { branches: nodes.slice(1) }]
  }
  // Type3B: A → (B | C)
  if (t.includes('3B') && nodes.length === 3) {
    return [nodes[0], { branches: [nodes[1], nodes[2]] }]
  }
  // Type4B: A → B → (C | D)
  if (t.includes('4B') && nodes.length === 4) {
    return [nodes[0], nodes[1], { branches: [nodes[2], nodes[3]] }]
  }
  // Type4C: A → (B | C | D)
  if (t.includes('4C') && nodes.length === 4) {
    return [nodes[0], { branches: [nodes[1], nodes[2], nodes[3]] }]
  }
  // Type4D: A → (B | C), C → D
  if (t.includes('4D') && nodes.length === 4) {
    return [nodes[0], { branches: [nodes[1], [nodes[2], nodes[3]]] }]
  }
  // Type5A: A → (B | D), B → C, D → E
  if (t.includes('5A') && nodes.length >= 5) {
    return [nodes[0], { branches: [[nodes[1], nodes[2]], [nodes[3], nodes[4]]] }]
  }
  // Type5B: A → (B | C | D), D → E
  if (t.includes('5B') && nodes.length >= 5) {
    return [nodes[0], { branches: [nodes[1], nodes[2], [nodes[3], nodes[4]]] }]
  }
  // 默认线性
  return nodes
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
      const resolved = p.evoChain.map(e => {
        const found = all.find(x => x.dexNum === e.dexNum && x.formNo === e.formNo)
        return found
          ? { id: found.id, dexNum: found.dexNum, formNo: found.formNo, name: found.name, form: found.form, icon: found.icon, types: found.types }
          : { id: '', dexNum: e.dexNum, formNo: e.formNo, name: `#${e.dexNum}`, form: '', icon: '', types: [] }
      })
      evoTree.value = buildEvoTree(resolved, p.evoTemplate)
    } else {
      evoTree.value = []
    }
  }
}

function switchForm(f) { router.push(`/pokemon/${f.id}`) }
function goTo(e) { if (e.id) router.push(`/pokemon/${e.id}`) }

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>
