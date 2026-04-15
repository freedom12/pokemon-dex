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
            <IconSelect :modelValue="activeVg" :options="vgOptions" hidePlaceholder
              @update:modelValue="v => activeVg = v" style="min-width:160px">
              <template #icon="{ option }">
                <span v-if="(option.icons as string[])?.length" style="display:inline-flex;gap:2px;align-items:center">
                  <GameIcon v-for="sid in (option.icons as string[])" :key="sid" :sid="sid" :size="20" />
                </span>
              </template>
            </IconSelect>
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
              <th style="width:60px;text-align:center">威力</th>
              <th style="width:60px;text-align:center">命中</th>
              <th style="width:50px;text-align:center">PP</th>
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
              <td style="text-align:center;font-size:13px">{{ m.power ?? '—' }}</td>
              <td style="text-align:center;font-size:13px">{{ m.accuracy != null ? m.accuracy + '%' : '—' }}</td>
              <td style="text-align:center;font-size:13px">{{ m.pp ?? '—' }}</td>
              <td style="font-size:13px;color:var(--text2);max-width:400px">{{ m.desc }}</td>
              <td>
                <button class="lookup-btn" title="查看可学习此招式的宝可梦" @click="lookupMove(m)">🔍</button>
              </td>
            </tr>
            <tr v-if="filteredMoves.length === 0">
              <td :colspan="activeTab === 'level-up' ? 9 : 8" style="text-align:center;color:var(--text2);padding:20px">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PokemonLookup :visible="lookupVisible" :title="lookupTitle" :pokemon="lookupResults" @close="closeLookup" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import PokemonLookup from './PokemonLookup.vue'
import MoveCategoryIcon from './MoveCategoryIcon.vue'
import TypeIcon from './TypeIcon.vue'
import IconSelect from './IconSelect.vue'
import GameIcon from './GameIcon.vue'
import type { Pokemon, MoveEntry } from '../types'
import { usePokemonLookup } from '../composables/usePokemonLookup'
import type { Learnsets, VgData } from '../composables/usePokemonLookup'
import { VG_LABELS, VG_ORDER, VG_ICONS } from '../constants/learnset'

const props = defineProps({
  learnset: { type: Object as PropType<Record<string, VgData> | null>, default: null },
  movesMap: { type: Object as PropType<Record<string, MoveEntry>>, default: () => ({}) },
  allLearnsets: { type: Object as PropType<Learnsets>, default: () => ({}) },
  allPokemon: { type: Array as PropType<Pokemon[]>, default: () => [] },
})

const open = ref(true)
const activeVg = ref('')
const activeTab = ref('level-up')
const search = ref('')

const { lookupVisible, lookupTitle, lookupResults, lookupByMove, closeLookup } = usePokemonLookup()

function vgLabel(vg: string): string { return VG_LABELS[vg] || vg }

// 当前形态可用的版本组列表
const availableVgs = computed(() => {
  if (!props.learnset) return [] as string[]
  return VG_ORDER.filter(vg => props.learnset?.[vg])
})

// IconSelect 选项
const vgOptions = computed(() =>
  availableVgs.value.map(vg => ({
    value: vg,
    label: vgLabel(vg),
    icons: VG_ICONS[vg] || [],
  }))
)

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

function getMoveList(tabKey: string): Array<MoveEntry & { level?: number }> {
  if (!currentVgData.value) return []
  const data = (currentVgData.value as Record<string, unknown>)[tabKey]
  if (!data) return []
  if (tabKey === 'level-up') {
    return (data as Array<{ move: number; level: number }>).map((entry) => {
      const m = props.movesMap[entry.move]
      if (!m) return null
      return { ...m, level: entry.level }
    }).filter(Boolean) as Array<MoveEntry & { level: number }>
  }
  return (data as number[]).map((mid: number) => props.movesMap[mid]).filter(Boolean)
}

const filteredMoves = computed(() => {
  let list = getMoveList(activeTab.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((m: MoveEntry) => m.name.toLowerCase().includes(q))
  }
  return list
})

function lookupMove(move: MoveEntry) {
  lookupByMove(
    parseInt(move.id.replace(/\D/g, ''), 10),
    move.name,
    props.allLearnsets,
    props.allPokemon,
  )
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
