<template>
  <div v-if="error" class="loading" style="color:var(--accent)">{{ error }}</div>
  <div v-else-if="!pokemon" class="loading">加载中...</div>
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
            <PokemonIcon :src="displayIcon" :fallback-src="pokemon.icon" :alt="pokemon.name" />
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
            <div style="margin-top:8px;display:flex;gap:4px">
              <span v-for="t in pokemon.types" :key="t.id">
                <TypeIcon :tid="t.id" :alt="t.name" />
              </span>
            </div>
          </div>
          <PokemonIcon :src="displayIcon" :fallback-src="pokemon.icon" :alt="pokemon.name" :size="100" />
        </div>

        <!-- 基本信息 -->
        <div class="detail-info-block">
          <div class="info-row"><span class="info-label">分类</span><span>{{ pokemon.category || '—' }}</span></div>
          <div class="info-row"><span class="info-label">身高</span><span>{{ pokemon.height || '—' }}</span></div>
          <div class="info-row"><span class="info-label">体重</span><span>{{ pokemon.weight || '—' }}</span></div>
          <div class="info-row"><span class="info-label">颜色</span><span>{{ pokemon.color || '—' }}</span></div>
        </div>

        <!-- 游戏可用性 -->
        <div v-if="gameGroups.length" class="detail-info-block">
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
            <template v-for="gg in gameGroups" :key="gg.id">
              <GameIcon
                v-for="sid in gg.softwareIds" :key="sid"
                :sid="sid" :size="32"
                :style="appearSet.has(gg.id) ? {} : { filter: 'grayscale(1) opacity(0.35)' }"
                :title="getSoftwareName(sid)"
              />
            </template>
          </div>
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
        <div v-for="(ab, i) in pokemon.abilities" :key="i" class="ability-row" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px"><a :href="`https://wiki.52poke.com/wiki/${ab.name}`" target="_blank" rel="noopener" class="wiki-link">{{ ab.name }}</a></div>
            <div v-if="ab.desc" style="font-size:13px;color:var(--text2);margin-top:4px">{{ ab.desc }}</div>
          </div>
          <button class="ability-lookup-btn" title="查看拥有此特性的宝可梦" @click="lookupAbility(ab)">🔍</button>
        </div>
      </div>
    </div>

    <PokemonLookup :visible="abilityLookupVisible" :title="abilityLookupTitle" :pokemon="abilityLookupResults" @close="closeAbilityLookup" />

    <!-- 图鉴描述 -->
    <div class="detail-section" v-if="pokemon.zukanDescs && pokemon.zukanDescs.length">
      <h3 class="section-toggle" @click="zukanOpen = !zukanOpen">图鉴描述 <span class="toggle-arrow" :class="{ open: zukanOpen }">▸</span></h3>
      <div v-show="zukanOpen" style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(zd, i) in pokemon.zukanDescs" :key="i" style="padding:10px 14px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-size:12px;color:var(--accent);margin-bottom:4px;display:flex;align-items:center;gap:4px">
            <GameIcon v-for="sid in zd.sids" :key="sid" :sid="sid" :size="18" />
            <span>{{ zd.game }}</span>
          </div>
          <div style="font-size:14px;color:var(--text2);white-space:pre-line">{{ zd.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 进化链 -->
    <div class="detail-section" v-if="evoTree.length > 0">
      <h3 class="section-toggle" @click="evoOpen = !evoOpen">进化链 <span class="toggle-arrow" :class="{ open: evoOpen }">▸</span></h3>
      <div v-show="evoOpen" class="evo-chain">
        <template v-for="(node, i) in evoTree" :key="i">
          <span v-if="i > 0 && !isEvoBranch(node)" class="evo-arrow">→</span>
          <!-- 分支显示 -->
          <div v-if="isEvoBranch(node)" class="evo-branch-group">
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
          <PokemonCard v-else :pokemon="(node as EvoNode)" :highlight="isCurrent(node as EvoNode)" @click="goTo(node as EvoNode)" />
        </template>
      </div>
    </div>

    <!-- 可学习招式 -->
    <LearnsetPanel :learnset="learnsetData ?? undefined" :movesMap="movesMap" :allLearnsets="allLearnsets" :allPokemon="allPokemon" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPokemon, getGameGroups, getSoftwares, getMoves, getLearnsets, getPokemonDescs, getAbilities, ZUKAN_IMG_BASE, type GameGroup, type Pokemon, type MoveEntry } from '../data'
import type { DetailedPokemon, ZukanDesc, PokemonStats } from '../types'
import type { Learnsets, VgData } from '../composables/usePokemonLookup'
import PokemonIcon from '../components/PokemonIcon.vue'
import PokemonCard from '../components/PokemonCard.vue'
import GameIcon from '../components/GameIcon.vue'
import TypeIcon from '../components/TypeIcon.vue'
import LearnsetPanel from '../components/LearnsetPanel.vue'
import PokemonLookup from '../components/PokemonLookup.vue'
import { buildEvoTree } from '../utils/evo'
import { usePokemonLookup } from '../composables/usePokemonLookup'
import type { EvoNode, EvoBranchNode, EvoTreeItem } from '../utils/evo'

defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const allPokemon = ref<Pokemon[]>([])
const pokemon = ref<DetailedPokemon | null>(null)
const forms = ref<Pokemon[]>([])
const evoTree = ref<ReturnType<typeof buildEvoTree>>([])
const gameGroups = ref<GameGroup[]>([])
const softwareMap = ref<Record<string, string>>({})
const showFemale = ref(false)
const zukanOpen = ref(true)
const abilityOpen = ref(true)
const evoOpen = ref(true)
const learnsetData = ref<Record<string, VgData> | null>(null)
const movesMap = ref<Record<string, MoveEntry>>({})
const allLearnsets = ref<Learnsets>({})
const error = ref('')

const {
  lookupVisible: abilityLookupVisible,
  lookupTitle: abilityLookupTitle,
  lookupResults: abilityLookupResults,
  lookupByAbility,
  closeLookup: closeAbilityLookup,
} = usePokemonLookup()

function isEvoBranch(node: EvoTreeItem): node is EvoBranchNode {
  return 'branches' in node
}

const appearSet = computed(() => new Set(pokemon.value?.appearGames || []))
function getSoftwareName(sid: string) { return softwareMap.value[sid] || sid }

function isCurrent(node: EvoNode): boolean {
  return !!pokemon.value && node.dexNum === pokemon.value.dexNum && node.formNo === pokemon.value.formNo
}

const displayIcon = computed(() => {
  if (!pokemon.value) return ''
  if (showFemale.value && pokemon.value.iconFemale) return pokemon.value.iconFemale
  return pokemon.value.icon
})

const displayImage = computed(() => {
  if (!pokemon.value) return ''
  if (showFemale.value && pokemon.value.imageFemale) return pokemon.value.imageFemale
  return pokemon.value.image || ''
})

const statList: { key: keyof PokemonStats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: '攻击' },
  { key: 'def', label: '防御' },
  { key: 'spatk', label: '特攻' },
  { key: 'spdef', label: '特防' },
  { key: 'agi', label: '速度' },
]

function statColor(val: number) {
  if (val < 50) return '#f87171'
  if (val < 80) return '#fb923c'
  if (val < 100) return '#facc15'
  if (val < 130) return '#4ade80'
  return '#22d3ee'
}

async function loadData() {
  try {
    error.value = ''
    const [all, gg, sw, allMoves, learnsets, descsMap, abList] = await Promise.all([getPokemon(), getGameGroups(), getSoftwares(), getMoves(), getLearnsets().catch(() => ({} as Learnsets)), getPokemonDescs(), getAbilities()])
  allPokemon.value = all
  gameGroups.value = gg
  const swMap: Record<string, string> = {}
  for (const s of sw) swMap[s.id] = s.name
  softwareMap.value = swMap

  // 构建特性名 → 描述映射
  const abilityDescMap: Record<string, string> = {}
  for (const a of abList) abilityDescMap[a.name] = a.desc ?? ''

  // 构建 moveId(数字) → move 对象映射
  const mMap: Record<string, MoveEntry> = {}
  for (const m of allMoves) {
    const num = parseInt(m.id.replace(/\D/g, ''), 10)
    mMap[num] = m
  }
  movesMap.value = mMap

  const base = all.find(x => x.id === route.params.id)
  if (base) {
    // 合并详情扩展数据（图鉴描述、大图、特性描述）
    const ext = (descsMap[base.id] || {}) as Record<string, unknown>
    const ga = ((descsMap as Record<string, unknown>)._g || []) as Array<string[]>
    pokemon.value = {
      ...base,
      image: ext.i ? ZUKAN_IMG_BASE + ext.i + '.png' : '',
      imageFemale: ext.if ? ZUKAN_IMG_BASE + ext.if + '.png' : '',
      zukanDescs: (ext.z as Array<[number, string]> || []).map((zd): ZukanDesc => {
        const sids: string[] = ga[zd[0]] || []
        return {
          game: sids.map(sid => softwareMap.value[sid]).filter(Boolean).join(' / '),
          sids,
          desc: zd[1],
        }
      }),
      abilities: base.abilities.map(name => ({ name, desc: abilityDescMap[name] || '' })),
    } as unknown as DetailedPokemon
  } else {
    pokemon.value = null
  }
  const p = pokemon.value
  showFemale.value = false

  // 加载当前宝可梦的可学习招式
  if (p && learnsets) {
    const speciesData = learnsets[p.dexNum]
    if (speciesData) {
      // 超级进化 / 超极巨化 没有独立技能表，使用基础形态的数据
      if (p.isMega || p.isDMax) {
        learnsetData.value = speciesData['0'] || null
      } else {
        learnsetData.value = speciesData[p.formNo] || speciesData['0'] || null
      }
    } else {
      learnsetData.value = null
    }
    allLearnsets.value = learnsets
  } else {
    learnsetData.value = null
    allLearnsets.value = {}
  }

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
  } catch {
    error.value = '数据加载失败，请刷新重试'
    pokemon.value = null
  }
}

function lookupAbility(ab: { name: string }) {
  lookupByAbility(ab.name, allPokemon.value)
}

function switchForm(f: Pokemon) { router.push(`/pokemon/${f.id}`) }
function goTo(e: EvoNode) { if (e.id) router.push(`/pokemon/${e.id}`) }

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>

<style scoped>
.ability-lookup-btn {
  opacity: 0; background: none; border: none;
  cursor: pointer; font-size: 14px; padding: 2px 6px;
  border-radius: 4px; transition: opacity 0.15s;
  flex-shrink: 0;
}
.ability-row:hover .ability-lookup-btn { opacity: 1; }
.ability-lookup-btn:hover { background: var(--border); }
</style>
