<template>
  <div class="detail-section" v-if="hasAnyMoves">
    <h3 class="section-toggle" @click="open = !open">
      可学习招式 <span class="toggle-arrow" :class="{ open }">▸</span>
    </h3>
    <div v-show="open">
      <!-- 分类标签 + 搜索 -->
      <div class="filter-bar" style="margin-bottom:12px;justify-content:space-between">
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button v-for="tab in tabs" :key="tab.key" class="filter-btn"
            :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
            {{ tab.label }} ({{ tab.count }})
          </button>
        </div>
        <input class="search-bar" v-model="search" placeholder="搜索招式名称..."
          style="max-width:240px" />
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filteredMoves" :key="m.id">
              <td v-if="activeTab === 'level-up'" style="font-size:13px;color:var(--text2);text-align:center">
                {{ m.level === 0 ? '—' : m.level }}
              </td>
              <td style="font-weight:600;white-space:nowrap">
                <a :href="`https://wiki.52poke.com/wiki/${m.name}`" target="_blank" rel="noopener" class="wiki-link">{{ m.name }}</a>
              </td>
              <td>
                <span class="type-badge" :style="{ background: m.typeColor }">{{ m.typeName }}</span>
              </td>
              <td>{{ m.category }}</td>
              <td style="font-size:13px;color:var(--text2);max-width:400px">{{ m.desc }}</td>
            </tr>
            <tr v-if="filteredMoves.length === 0">
              <td :colspan="activeTab === 'level-up' ? 5 : 4" style="text-align:center;color:var(--text2);padding:20px">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  learnset: { type: Object, default: null },
  movesMap: { type: Object, default: () => ({}) },
})

const open = ref(true)
const activeTab = ref('level-up')
const search = ref('')

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

const hasAnyMoves = computed(() => tabs.value.length > 0)

// 确保 activeTab 始终有效
watch(tabs, (newTabs) => {
  if (newTabs.length > 0 && !newTabs.find(t => t.key === activeTab.value)) {
    activeTab.value = newTabs[0].key
  }
})

function getMoveList(tabKey) {
  if (!props.learnset) return []
  const data = props.learnset[tabKey]
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
</script>
