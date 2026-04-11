<template>
  <div v-if="!loaded" class="loading">加载中...</div>
  <template v-else>
    <div class="page-header">
      <div>
        <div class="page-title">对战使用率</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <!-- 游戏切换 -->
        <div class="rule-toggle">
          <button :class="['rule-btn', currentGame === 'scvi' && 'active']" @click="switchGame('scvi')">朱/紫</button>
          <button :class="['rule-btn', currentGame === 'swsh' && 'active']" @click="switchGame('swsh')">剑/盾</button>
        </div>

        <!-- 模式切换 -->
        <div class="rule-toggle">
          <button :class="['rule-btn', mode === 'ranked' && 'active']" @click="switchMode('ranked')">级别对战</button>
          <button :class="['rule-btn', mode === 'internet' && 'active']" @click="switchMode('internet')">官方大赛</button>
        </div>

        <!-- 级别对战：赛季选择 -->
        <template v-if="mode === 'ranked'">
          <select class="type-select" v-model="selectedSeasonNo" @change="onSeasonChange">
            <option v-for="s in seasonOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <div class="rule-toggle">
            <button :class="['rule-btn', selectedRule === 0 && 'active']" @click="selectRule(0)" :disabled="!hasRule(0)">单打</button>
            <button :class="['rule-btn', selectedRule === 1 && 'active']" @click="selectRule(1)" :disabled="!hasRule(1)">双打</button>
          </div>
        </template>

        <!-- 官方大赛：赛事选择 -->
        <template v-else>
          <select class="type-select internet-select" v-model="selectedInternetCId" @change="loadSeasonData">
            <option v-for="t in internetSeasons" :key="t.cId" :value="t.cId">
              {{ t.name }}{{ t.subname ? ' · ' + t.subname : '' }}
            </option>
          </select>
        </template>
      </div>
    </div>

    <!-- 当前赛事信息 -->
    <div v-if="currentSeason" class="season-info">
      <span class="season-badge" :class="mode === 'internet' && 'tournament-badge'">
        {{ mode === 'ranked' ? 'S' + currentSeason.season : '大赛' }}
      </span>
      <span class="season-name">{{ currentSeason.name }}<span v-if="currentSeason.subname" style="color:var(--text2);font-weight:400"> · {{ currentSeason.subname }}</span></span>
      <span class="season-meta">{{ currentSeason.start?.slice(0, 10) }} – {{ currentSeason.end?.slice(0, 10) }}</span>
      <span class="season-cnt" v-if="currentSeason.cnt">对战总场次: <b>{{ Number(currentSeason.cnt).toLocaleString() }}</b></span>
      <span class="rule-tag">{{ currentSeason.rule === 0 ? '单打' : '双打' }}</span>
    </div>

    <!-- 数据加载中 -->
    <div v-if="dataLoading" class="loading">加载赛季数据中...</div>
    <template v-else-if="pokemonList.length">
      <div class="usage-layout">
        <!-- 左：排名列表 -->
        <div class="usage-list-col">
          <table class="data-table usage-table">
            <thead>
              <tr>
                <th style="width:44px;white-space:nowrap">名次</th>
                <th>宝可梦</th>
                <th style="width:52px">属性</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in pokemonList"
                :key="`${item.id}-${item.form}`"
                :class="['usage-row', selectedPokemon?.id === item.id && selectedPokemon?.form === item.form && 'selected']"
                @click="selectPokemon(item)"
              >
                <td class="rank-cell">
                  <span :class="['rank-badge', idx < 3 && `rank-top${idx+1}`]">{{ idx + 1 }}</span>
                </td>
                <td class="pokemon-cell">
                  <PokemonIcon class="poke-icon" :src="getPokemonIcon(item)" :alt="getPokemonName(item)" :size="40" />
                  <span class="poke-dex">#{{ PAD4(item.id) }}</span>
                  <span class="poke-name">{{ getPokemonName(item) }}</span>
                  <span v-if="getPokemonFormName(item)" class="form-label">{{ getPokemonFormName(item) }}</span>
                </td>
                <td class="type-cell">
                  <span class="type-cell-inner">
                    <TypeIcon v-for="t in getTypeNames(item)" :key="t.id" :tid="t.id" :size="18" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 右：宝可梦详情 -->
        <div class="usage-detail-col" v-if="selectedPokemon">
          <div class="detail-card">
            <div class="detail-header">
              <PokemonIcon class="detail-icon" :src="getPokemonIcon(selectedPokemon)" :alt="getPokemonName(selectedPokemon)" :size="72" />
              <div>
                <div class="detail-name"><span class="detail-dex">#{{ PAD4(selectedPokemon.id) }}</span> {{ getPokemonName(selectedPokemon) }}<span v-if="getPokemonFormName(selectedPokemon)" class="form-label" style="margin-left:6px">{{ getPokemonFormName(selectedPokemon) }}</span></div>
                <div class="detail-rank">第 {{ pokemonList.findIndex(p => p.id === selectedPokemon.id && p.form === selectedPokemon.form) + 1 }} 名</div>
                <div v-if="getTypeNames(selectedPokemon).length" class="detail-types">
                  <TypeIcon v-for="t in getTypeNames(selectedPokemon)" :key="t.id" :tid="t.id" :alt="t.name" :size="24" />
                </div>
              </div>
            </div>

            <div v-if="!detailData" class="loading" style="padding:16px">加载详情中...</div>
            <template v-else-if="temotiData">
              <!-- 招式 -->
              <div class="stat-section" v-if="temotiData.waza?.length">
                <div class="stat-section-title">招式</div>
                <div v-for="w in temotiData.waza.slice(0, 10)" :key="w.id" class="stat-row-bar">
                  <span class="stat-item-name">{{ getMoveName(w.id) }}</span>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar-fill" :style="{width: w.val + '%'}"></div>
                  </div>
                  <span class="stat-pct">{{ w.val }}%</span>
                </div>
              </div>

              <!-- 道具 -->
              <div class="stat-section" v-if="temotiData.motimono?.length">
                <div class="stat-section-title">道具</div>
                <div v-for="m in temotiData.motimono.slice(0, 10)" :key="m.id" class="stat-row-bar">
                  <span class="stat-item-name">{{ getItemName(m.id) }}</span>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar-fill item-bar" :style="{width: m.val + '%'}"></div>
                  </div>
                  <span class="stat-pct">{{ m.val }}%</span>
                </div>
              </div>

              <!-- 特性 -->
              <div class="stat-section" v-if="temotiData.tokusei?.length">
                <div class="stat-section-title">特性</div>
                <div v-for="t in temotiData.tokusei.slice(0, 5)" :key="t.id" class="stat-row-bar">
                  <span class="stat-item-name">{{ getAbilityName(t.id) }}</span>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar-fill ability-bar" :style="{width: t.val + '%'}"></div>
                  </div>
                  <span class="stat-pct">{{ t.val }}%</span>
                </div>
              </div>

              <!-- 性格 -->
              <div class="stat-section" v-if="temotiData.seikaku?.length">
                <div class="stat-section-title">性格</div>
                <div v-for="s in temotiData.seikaku.slice(0, 5)" :key="s.id" class="stat-row-bar">
                  <span class="stat-item-name">{{ getNatureName(s.id) }}</span>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar-fill nature-bar" :style="{width: s.val + '%'}"></div>
                  </div>
                  <span class="stat-pct">{{ s.val }}%</span>
                </div>
              </div>

              <!-- 太晶属性 -->
              <div class="stat-section" v-if="temotiData.terastal?.length">
                <div class="stat-section-title">太晶属性</div>
                <div v-for="t in temotiData.terastal.slice(0, 10)" :key="t.id" class="stat-row-bar">
                  <span class="stat-item-name">
                    <TypeIcon :tid="'TY' + PAD4(t.id)" :alt="getTypeName(t.id)" :size="24" />
                  </span>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar-fill tera-bar" :style="{width: t.val + '%'}"></div>
                  </div>
                  <span class="stat-pct">{{ t.val }}%</span>
                </div>
              </div>

              <!-- 常见搭档 -->
              <div class="stat-section" v-if="temotiData.pokemon?.length">
                <div class="stat-section-title">常见搭档</div>
                <div v-for="p in temotiData.pokemon.slice(0, 10)" :key="`${p.id}-${p.form}`" class="teammate-row" @click="selectPokemon(p)">
                  <PokemonIcon class="poke-icon-sm" :src="getPokemonIcon(p)" :size="28" />
                  <span class="stat-item-name">{{ getPokemonName(p) }}<span v-if="getPokemonFormName(p)" class="form-label">{{ getPokemonFormName(p) }}</span></span>
                </div>
              </div>
              <!-- 击倒对手 -->
              <template v-if="winData">
                <div class="stat-section-group-title">🗡️ 击倒对手时</div>
                <div class="stat-section" v-if="winData.pokemon?.length">
                  <div class="stat-section-title">打倒的宝可梦 TOP10</div>
                  <div v-for="p in winData.pokemon.slice(0, 10)" :key="`w-${p.id}-${p.form}`" class="teammate-row" @click="selectPokemon(p)">
                    <PokemonIcon class="poke-icon-sm" :src="getPokemonIcon(p)" :size="28" />
                    <span class="stat-item-name">{{ getPokemonName(p) }}<span v-if="getPokemonFormName(p)" class="form-label">{{ getPokemonFormName(p) }}</span></span>
                  </div>
                </div>
                <div class="stat-section" v-if="winData.waza?.length">
                  <div class="stat-section-title">击倒时所用招式 TOP10</div>
                  <div v-for="w in winData.waza.slice(0, 10)" :key="w.id" class="stat-row-bar">
                    <span class="stat-item-name">{{ getMoveName(w.id) }}</span>
                    <div class="stat-bar-wrap">
                      <div class="stat-bar-fill win-bar" :style="{width: w.val + '%'}"></div>
                    </div>
                    <span class="stat-pct">{{ w.val }}%</span>
                  </div>
                </div>
              </template>

              <!-- 被对手击倒 -->
              <template v-if="loseData">
                <div class="stat-section-group-title">🛡️ 被对手击倒时</div>
                <div class="stat-section" v-if="loseData.pokemon?.length">
                  <div class="stat-section-title">打倒自己的宝可梦 TOP10</div>
                  <div v-for="p in loseData.pokemon.slice(0, 10)" :key="`l-${p.id}-${p.form}`" class="teammate-row" @click="selectPokemon(p)">
                    <PokemonIcon class="poke-icon-sm" :src="getPokemonIcon(p)" :size="28" />
                    <span class="stat-item-name">{{ getPokemonName(p) }}<span v-if="getPokemonFormName(p)" class="form-label">{{ getPokemonFormName(p) }}</span></span>
                  </div>
                </div>
                <div class="stat-section" v-if="loseData.waza?.length">
                  <div class="stat-section-title">对手击倒自己时所用招式 TOP10</div>
                  <div v-for="w in loseData.waza.slice(0, 10)" :key="w.id" class="stat-row-bar">
                    <span class="stat-item-name">{{ getMoveName(w.id) }}</span>
                    <div class="stat-bar-wrap">
                      <div class="stat-bar-fill lose-bar" :style="{width: w.val + '%'}"></div>
                    </div>
                    <span class="stat-pct">{{ w.val }}%</span>
                  </div>
                </div>
              </template>            </template>
            <div v-else class="loading" style="padding:16px;color:var(--text2)">该宝可梦暂无详细数据</div>
          </div>
        </div>
        <div class="usage-detail-col" v-else>
          <div class="detail-placeholder">← 点击左侧宝可梦查看详细使用率</div>
        </div>
      </div>
    </template>
    <div v-else class="loading" style="margin-top:32px;color:var(--text2)">暂无该赛季数据</div>
  </template>
</template>

<script setup>
defineOptions({ name: 'BattleUsageScvi' })
import { ref, computed, onMounted, watch } from 'vue'
import PokemonIcon from '../components/PokemonIcon.vue'
import TypeIcon from '../components/TypeIcon.vue'
import {
  getPokemon, getTypes, getMoves, getNatures, getAbilities, getItems,
  getBattleSeasons, getBattleTournaments, getBattleUsagePokemon, getBattleUsagePDetail
} from '../data.js'

const PAD4 = (n) => String(n).padStart(4, '0')

const loaded = ref(false)
const dataLoading = ref(false)

// ─── 主数据 ────────────────────────────────────────────────
const allPokemon = ref([])
const pokemonByDexForm = ref(new Map())
const allMoves = ref({})
const allNatures = ref({})
const allAbilities = ref({})
const allItems = ref({})
const typeMap = ref({})

// ─── 游戏 ─────────────────────────────────────────────────
const currentGame = ref('scvi') // 'scvi' | 'swsh'

// ─── 模式 ─────────────────────────────────────────────────
const mode = ref('ranked') // 'ranked' | 'internet'

// ─── 级别对战赛季 ──────────────────────────────────────────
const rankedSeasons = ref([])
const selectedSeasonNo = ref(null)
const selectedRule = ref(0)

// ─── 官方大赛 ──────────────────────────────────────────────
const internetSeasons = ref([])
const selectedInternetCId = ref(null)

// ─── 使用率数据 ────────────────────────────────────────────
const pokemonList = ref([])
const detailData = ref(null)

// ─── 选中宝可梦 ────────────────────────────────────────────
const selectedPokemon = ref(null)

// ─── 初始化 ───────────────────────────────────────────────
onMounted(async () => {
  const [pList, types, moves, natures, abilities, items, seasonList, internetList] = await Promise.all([
    getPokemon(),
    getTypes(),
    getMoves(),
    getNatures(),
    getAbilities(),
    getItems(),
    getBattleSeasons(currentGame.value).catch(() => []),
    getBattleTournaments(currentGame.value).catch(() => []),
  ])

  allPokemon.value = pList

  // 跳过 Gmax/Mega 形态：它们在 SV 中不存在，且部分与本体共用 fn=0 会污染查找
  const dexFormMap = new Map()
  for (const p of pList) {
    if (p.isDMax || p.isMega) continue
    dexFormMap.set(`${p.dexNum}_${p.formNo}`, p)
  }
  pokemonByDexForm.value = dexFormMap

  const movesMap = {}
  for (const m of moves) movesMap[m.id] = m.name
  allMoves.value = movesMap

  const naturesMap = {}
  for (const n of natures) naturesMap[n.id] = n.name
  allNatures.value = naturesMap

  const abilitiesMap = {}
  for (const a of abilities) abilitiesMap[a.id] = a.name
  allAbilities.value = abilitiesMap

  const itemsMap = {}
  for (const i of items) itemsMap[i.id] = i.name
  allItems.value = itemsMap

  const typeM = {}
  for (const t of types) typeM[t.id] = { name: t.name, color: t.color }
  typeMap.value = typeM

  rankedSeasons.value = seasonList
  internetSeasons.value = internetList

  // 默认选最新赛季
  if (seasonList.length > 0) {
    const maxSeason = Math.max(...seasonList.map(s => s.season))
    selectedSeasonNo.value = maxSeason
    const available = getAvailableRules(maxSeason)
    selectedRule.value = available.includes(0) ? 0 : available[0]
  }

  // 默认选第一个官方大赛
  if (internetList.length > 0) {
    selectedInternetCId.value = internetList[0].cId
  }

  await loadSeasonData()
  loaded.value = true
})

// ─── 游戏切换 ─────────────────────────────────────────────
async function switchGame(game) {
  if (currentGame.value === game) return
  currentGame.value = game
  selectedPokemon.value = null
  pokemonList.value = []
  detailData.value = null
  const [seasonList, internetList] = await Promise.all([
    getBattleSeasons(game).catch(() => []),
    getBattleTournaments(game).catch(() => []),
  ])
  rankedSeasons.value = seasonList
  internetSeasons.value = internetList
  // 默认选最新赛季
  if (seasonList.length > 0) {
    const maxSeason = Math.max(...seasonList.map(s => s.season))
    selectedSeasonNo.value = maxSeason
    const available = getAvailableRules(maxSeason)
    selectedRule.value = available.includes(0) ? 0 : available[0]
  }
  if (internetList.length > 0) {
    selectedInternetCId.value = internetList[0].cId
  }
  if (mode.value === 'internet' && internetList.length === 0) {
    mode.value = 'ranked'
  }
  await loadSeasonData()
}

// ─── 模式切换 ─────────────────────────────────────────────
async function switchMode(newMode) {
  if (mode.value === newMode) return
  mode.value = newMode
  await loadSeasonData()
}

// ─── 赛季选项 ─────────────────────────────────────────────
const seasonOptions = computed(() => {
  const nums = [...new Set(rankedSeasons.value.map(s => s.season))].sort((a, b) => b - a)
  return nums.map(n => ({ value: n, label: `S${n} 赛季` }))
})

function getAvailableRules(seasonNo) {
  return rankedSeasons.value.filter(s => s.season === seasonNo).map(s => s.rule)
}

function hasRule(rule) {
  return getAvailableRules(selectedSeasonNo.value).includes(rule)
}

// ─── 当前赛事 ─────────────────────────────────────────────
const currentSeason = computed(() => {
  if (mode.value === 'ranked') {
    return rankedSeasons.value.find(s => s.season === selectedSeasonNo.value && s.rule === selectedRule.value)
  } else {
    return internetSeasons.value.find(s => s.cId === selectedInternetCId.value)
  }
})

// ─── 加载数据 ─────────────────────────────────────────────
async function loadSeasonData() {
  const s = currentSeason.value
  if (!s) {
    pokemonList.value = []
    detailData.value = null
    selectedPokemon.value = null
    return
  }

  dataLoading.value = true
  selectedPokemon.value = null
  detailData.value = null

  try {
    const [pList, pdetail] = await Promise.all([
      getBattleUsagePokemon(currentGame.value, s.cId),
      getBattleUsagePDetail(currentGame.value, s.cId),
    ])
    pokemonList.value = pList || []
    detailData.value = pdetail || null
  } catch (e) {
    pokemonList.value = []
    detailData.value = null
  } finally {
    dataLoading.value = false
  }
}

function onSeasonChange() {
  const rules = getAvailableRules(selectedSeasonNo.value)
  if (!rules.includes(selectedRule.value)) selectedRule.value = rules[0] ?? 0
  loadSeasonData()
}

function selectRule(rule) {
  if (!hasRule(rule)) return
  selectedRule.value = rule
  loadSeasonData()
}

// ─── 选中宝可梦 ───────────────────────────────────────────
function selectPokemon(item) {
  selectedPokemon.value = item
}

// ─── 详情数据 ─────────────────────────────────────────────
function getFormEntry() {
  if (!selectedPokemon.value || !detailData.value) return null
  const { id, form } = selectedPokemon.value
  const pokEntry = detailData.value[String(id)]
  if (!pokEntry) return null
  return pokEntry[String(form)] || null
}

const temotiData = computed(() => getFormEntry()?.temoti || null)
const winData = computed(() => getFormEntry()?.win || null)
const loseData = computed(() => getFormEntry()?.lose || null)

// ─── 宝可梦查找 ────────────────────────────────────────────
function findPokemon(id, form) {
  return pokemonByDexForm.value.get(`${id}_${form}`)
    || pokemonByDexForm.value.get(`${id}_0`)
    || allPokemon.value.find(p => p.dexNum === id)
}

function getPokemonIcon(item) { return findPokemon(item.id, item.form)?.icon || '' }
function getPokemonName(item) { return findPokemon(item.id, item.form)?.name || `#${item.id}` }
function getPokemonFormName(item) { return findPokemon(item.id, item.form)?.form || '' }
function getTypeNames(item) { return findPokemon(item.id, item.form)?.types || [] }

// ─── ID 转名称 ────────────────────────────────────────────
function getMoveName(id) { return allMoves.value[`WZ${PAD4(id)}`] || `招式#${id}` }
function getItemName(id) { return allItems.value[parseInt(id)] || `道具#${id}` }
function getAbilityName(id) { return allAbilities.value[`TK${PAD4(id)}`] || `特性#${id}` }
function getNatureName(id) { return allNatures.value[`PE${PAD4(id)}`] || `性格#${id}` }
function getTypeName(id) { return typeMap.value[`TY${PAD4(id)}`]?.name || `属性#${id}` }
function getTypeColor(id) { return typeMap.value[`TY${PAD4(id)}`]?.color || '#888' }
</script>

<style scoped>
/* ── 赛季信息条 ── */
.season-info {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 14px; margin-bottom: 16px;
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); font-size: 14px; flex-wrap: wrap;
}
.season-badge {
  background: var(--accent); color: #fff;
  padding: 2px 10px; border-radius: 12px;
  font-weight: 700; font-size: 13px;
}
.tournament-badge { background: #7b5ea7; }
.season-name { font-weight: 600; }
.season-meta, .season-cnt { color: var(--text2); font-size: 13px; }
.rule-tag {
  background: var(--bg3); color: var(--text2);
  padding: 1px 10px; border-radius: 12px; font-size: 12px;
}

/* ── 规则切换 ── */
.rule-toggle { display: flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.rule-btn {
  padding: 5px 14px; background: transparent; border: none;
  color: var(--text2); font-size: 14px; cursor: pointer; transition: all .2s;
}
.rule-btn.active { background: var(--bg3); color: #fff; }
.rule-btn:disabled { opacity: .4; cursor: not-allowed; }
.internet-select { max-width: 320px; }

/* ── 布局 ── */
.usage-layout {
  display: grid;
  grid-template-columns: minmax(260px, 380px) 1fr;
  gap: 16px; align-items: start;
}
@media (max-width: 760px) {
  .usage-layout { grid-template-columns: 1fr; }
}

/* ── 排名列表 ── */
.usage-list-col { overflow-x: auto; }
.usage-table { font-size: 13px; }
.rank-cell { text-align: center; }
.rank-badge {
  display: inline-block; min-width: 22px;
  text-align: center; font-weight: 600; font-size: 13px;
  color: var(--text2);
}
.rank-badge.rank-top1 { color: #FFD700; }
.rank-badge.rank-top2 { color: #C0C0C0; }
.rank-badge.rank-top3 { color: #CD7F32; }
.pokemon-cell { display: flex; align-items: center; gap: 6px; }
.poke-icon { width: 40px; height: 40px; image-rendering: pixelated; flex-shrink: 0; }
.poke-icon-sm { width: 28px; height: 28px; image-rendering: pixelated; flex-shrink: 0; }
.poke-dex { font-size: 11px; color: var(--text2); flex-shrink: 0; min-width: 34px; }
.poke-name { font-weight: 600; }
.type-cell { white-space: nowrap; vertical-align: middle; }
.type-cell-inner { display: inline-flex; gap: 4px; align-items: center; }
.usage-row { cursor: pointer; }
.usage-row.selected td { background: rgba(233,69,96,.12); }
.usage-row:hover td { background: rgba(233,69,96,.06); }

/* ── 详情面板 ── */
.detail-placeholder {
  height: 200px; display: flex; align-items: center; justify-content: center;
  color: var(--text2); font-size: 15px;
  background: var(--card); border: 1px dashed var(--border);
  border-radius: var(--radius);
}
.detail-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px;
  position: sticky; top: 60px;
}
.detail-header {
  display: flex; gap: 12px; align-items: center; margin-bottom: 14px;
  padding-bottom: 12px; border-bottom: 1px solid var(--border);
}
.detail-icon { width: 72px; height: 72px; image-rendering: pixelated; flex-shrink: 0; }
.detail-name { font-size: 20px; font-weight: 700; }
.detail-dex { font-size: 13px; font-weight: 400; color: var(--text2); margin-right: 4px; }
.detail-rank { font-size: 13px; color: var(--text2); margin: 2px 0; }
.detail-types { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }

/* ── 统计栏 ── */
.stat-section { margin: 14px 0; }
.stat-section-title {
  font-size: 13px; font-weight: 600; color: var(--accent);
  border-bottom: 1px solid var(--border); padding-bottom: 4px; margin-bottom: 8px;
}
.stat-row-bar {
  display: flex; align-items: center; gap: 8px;
  margin: 5px 0; font-size: 13px;
}
.stat-item-name { min-width: 100px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.stat-bar-wrap { flex: 1; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; }
.stat-bar-fill { height: 100%; border-radius: 4px; background: var(--accent); transition: width .4s ease; }
.stat-bar-fill.item-bar { background: #4caf88; }
.stat-bar-fill.ability-bar { background: #5b8dd9; }
.stat-bar-fill.nature-bar { background: #b06fd8; }
.stat-bar-fill.tera-bar { background: #e0a030; }
.stat-bar-fill.win-bar { background: #4cba6a; }
.stat-bar-fill.lose-bar { background: #e05050; }
.stat-pct { min-width: 46px; text-align: right; font-size: 12px; color: var(--text2); flex-shrink: 0; }

/* ── 搭档 ── */
.teammate-row {
  display: flex; align-items: center; gap: 8px;
  padding: 3px 0; font-size: 13px;
  cursor: pointer; border-radius: 5px; transition: background .15s;
}
.teammate-row:hover { background: rgba(255,255,255,.05); }
.stat-section-group-title {
  font-size: 13px; font-weight: 700; margin: 16px 0 4px;
  padding: 4px 8px; border-radius: 5px;
  background: rgba(255,255,255,.06); color: var(--text1);
}
</style>
