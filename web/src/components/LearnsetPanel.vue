<template>
  <div class="detail-section" v-if="hasAnyMoves">
    <h3 class="section-toggle" @click="open = !open">
      可学习招式 <span class="toggle-arrow" :class="{ open }">▸</span>
    </h3>
    <div v-show="open">
      <!-- 版本选择 + 学习方式 + 搜索 -->
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        <div class="filter-bar" style="margin:0;justify-content:space-between">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <select class="type-select" v-model="activeVg" style="font-size:13px">
              <option v-for="vg in availableVgs" :key="vg" :value="vg">{{ vgLabel(vg) }}</option>
            </select>
            <button v-for="tab in tabs" :key="tab.key" class="filter-btn"
              :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
              {{ tab.label }} ({{ tab.count }})
            </button>
          </div>
          <input class="search-bar" v-model="search" placeholder="搜索招式名称..."
            style="max-width:240px" />
        </div>
      </div>

      <!-- 招式表格 -->
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="activeTab === 'level-up'" style="width:50px;white-space:nowrap">等级</th>
              <th>招式名称</th>
              <th>属性</th>
              <th>分类</th>
              <th>描述</th>
              <th style="width:36px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filteredMoves" :key="m.id" class="move-row">
              <td v-if="activeTab === 'level-up'" style="font-size:13px;color:var(--text2);text-align:center">
                {{ m.level === 0 ? '—' : m.level }}
              </td>
              <td style="font-weight:600;white-space:nowrap">
                <a :href="`https://wiki.52poke.com/wiki/${m.name}`" target="_blank" rel="noopener" class="wiki-link">{{ m.name }}</a>
              </td>
              <td>
                <TypeIcon :tid="m.type" :alt="m.typeName" />
              </td>
              <td><MoveCategoryIcon :cid="m.categoryId" :alt="m.category" :size="32" /></td>
              <td style="font-size:13px;color:var(--text2);max-width:400px">{{ m.desc }}</td>
              <td>
                <button class="lookup-btn" title="查看可学习此招式的宝可梦" @click="lookupMove(m)">🔍</button>
              </td>
            </tr>
            <tr v-if="filteredMoves.length === 0">
              <td :colspan="activeTab === 'level-up' ? 6 : 5" style="text-align:center;color:var(--text2);padding:20px">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PokemonLookup :visible="lookupVisible" :title="lookupTitle" :pokemon="lookupResults" @close="lookupVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import PokemonLookup from './PokemonLookup.vue'
import MoveCategoryIcon from './MoveCategoryIcon.vue'
import TypeIcon from './TypeIcon.vue'
import type { Pokemon } from '../data'

const VG_LABELS = {
  'mega-dimension': '超级次元',
  'legends-za': '传说 Z-A',
  'the-indigo-disk': '零之秘宝 蓝之圆盘',
  'the-teal-mask': '零之秘宝 碧之假面',
  'scarlet-violet': '朱/紫',
  'legends-arceus': '传说 阿尔宙斯',
  'brilliant-diamond-shining-pearl': '晶灿钻石/明亮珍珠',
  'the-crown-tundra': '冠之雪原',
  'the-isle-of-armor': '铠之孤岛',
  'sword-shield': '剑/盾',
  'lets-go-pikachu-lets-go-eevee': "Let's Go 皮卡丘/伊布",
  'ultra-sun-ultra-moon': '究极之日/究极之月',
  'sun-moon': '太阳/月亮',
  'omega-ruby-alpha-sapphire': '终极红宝石/始源蓝宝石',
  'x-y': 'X/Y',
  'black-2-white-2': '黑2/白2',
  'black-white': '黑/白',
  'heartgold-soulsilver': '心金/魂银',
  'platinum': '白金',
  'diamond-pearl': '钻石/珍珠',
  'firered-leafgreen': '火红/叶绿',
  'emerald': '绿宝石',
  'ruby-sapphire': '红宝石/蓝宝石',
  'crystal': '水晶',
  'gold-silver': '金/银',
  'yellow': '黄',
  'red-blue': '红/蓝',
}

// 版本组排序（新 → 旧）
const VG_ORDER = Object.keys(VG_LABELS)

const props = defineProps({
  learnset: { type: Object, default: null }, // { vgName: { "level-up": [...], ... }, ... }
  movesMap: { type: Object, default: () => ({}) },
  allLearnsets: { type: Object, default: () => ({}) },
  allPokemon: { type: Array as PropType<Pokemon[]>, default: () => [] },
})

const open = ref(true)
const activeVg = ref('')
const activeTab = ref('level-up')
const search = ref('')
const lookupVisible = ref(false)
const lookupTitle = ref('')
const lookupResults = ref([])

function vgLabel(vg) { return VG_LABELS[vg] || vg }

// 当前形态可用的版本组列表
const availableVgs = computed(() => {
  if (!props.learnset) return []
  return VG_ORDER.filter(vg => props.learnset[vg])
})

// learnset 变化时重置版本选择
watch(() => props.learnset, () => {
  const vgs = availableVgs.value
  if (vgs.length > 0 && !vgs.includes(activeVg.value)) {
    activeVg.value = vgs[0]
  }
}, { immediate: true })

// 当前版本组的数据
const currentVgData = computed(() => {
  if (!props.learnset || !activeVg.value) return null
  return props.learnset[activeVg.value] || null
})

const tabDefs = [
  { key: 'level-up', label: '升级' },
  { key: 'machine', label: '招式学习器' },
  { key: 'egg', label: '遗传' },
  { key: 'tutor', label: '教授' },
]

const tabs = computed(() =>
  tabDefs
    .map(td => ({ ...td, count: getMoveList(td.key).length }))
    .filter(td => td.count > 0)
)

const hasAnyMoves = computed(() => availableVgs.value.length > 0)

watch(tabs, (newTabs) => {
  if (newTabs.length > 0 && !newTabs.find(t => t.key === activeTab.value)) {
    activeTab.value = newTabs[0].key
  }
})

function getMoveList(tabKey) {
  if (!currentVgData.value) return []
  const data = currentVgData.value[tabKey]
  if (!data) return []
  if (tabKey === 'level-up') {
    return data.map(entry => {
      const m = props.movesMap[entry.move]
      if (!m) return null
      return { ...m, level: entry.level }
    }).filter(Boolean)
  }
  return data.map(mid => props.movesMap[mid]).filter(Boolean)
}

const filteredMoves = computed(() => {
  let list = getMoveList(activeTab.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(q))
  }
  return list
})

function lookupMove(move) {
  const moveNum = parseInt(move.id.replace(/\D/g, ''), 10)
  const seen = new Set()
  const results = []
  for (const [dexNum, speciesData] of Object.entries(props.allLearnsets)) {
    let found = false
    for (const formData of Object.values(speciesData)) {
      // formData 是 { vgName: { ... }, ... }
      for (const vgData of Object.values(formData)) {
        const allMoveIds = [
          ...(vgData['level-up'] || []).map(e => e.move),
          ...(vgData.machine || []),
          ...(vgData.egg || []),
          ...(vgData.tutor || []),
        ]
        if (allMoveIds.includes(moveNum)) { found = true; break }
      }
      if (found) break
    }
    if (found) {
      const num = parseInt(dexNum, 10)
      if (!seen.has(num)) {
        const p = props.allPokemon.find(pk => pk.dexNum === num && pk.formNo === 0)
        if (p) { seen.add(num); results.push(p) }
      }
    }
  }
  results.sort((a, b) => a.dexNum - b.dexNum)
  lookupTitle.value = `可学习「${move.name}」的宝可梦 (${results.length})`
  lookupResults.value = results
  lookupVisible.value = true
}
</script>

<style scoped>
.lookup-btn {
  opacity: 0; background: none; border: none;
  cursor: pointer; font-size: 14px; padding: 2px 6px;
  border-radius: 4px; transition: opacity 0.15s;
}
.move-row:hover .lookup-btn { opacity: 1; }
.lookup-btn:hover { background: var(--bg2); }
</style>
