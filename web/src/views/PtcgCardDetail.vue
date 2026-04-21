<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="!card" class="loading" style="color:var(--accent)">卡牌未找到</div>
  <template v-else>
    <div style="padding-top:12px">
      <a style="font-size:13px;cursor:pointer" @click="$router.back()">← 返回</a>
    </div>
    <div class="ptcg-detail-page">
      <div class="ptcg-detail-body">
        <div class="ptcg-detail-left">
          <div v-if="card.images?.large" @click="showFullImage = true" style="cursor:zoom-in">
            <PtcgHoloCard :src="card.images.large" :alt="card.name" />
          </div>
        </div>
        <div class="ptcg-detail-right">
          <!-- 宝可梦图标（右上角） -->
          <router-link
            v-for="pm in linkedPokemon" :key="pm.id"
            :to="`/pokemon/${pm.id}`"
            class="ptcg-dex-link"
            :title="`No.${String(pm.dexNum).padStart(4, '0')} ${pm.name}`"
          >
            <PokemonIcon :src="pm.icon" :alt="pm.name" :size="48" />
          </router-link>

          <!-- 标题行 -->
          <h2 class="ptcg-name" @dblclick="copyCardData" title="双击复制卡牌数据">
            {{ card.name }}
          </h2>

          <!-- 标签区 -->
          <div class="ptcg-meta">
            <span class="ptcg-tag ptcg-cat">{{ card.supertype }}</span>
            <span v-for="st in (card.subtypes || [])" :key="st" class="ptcg-tag">{{ st }}</span>
            <span v-if="card.hp" class="ptcg-tag ptcg-hp">HP {{ card.hp }}</span>
            <EnergyIcon v-for="t in (card.types || [])" :key="t" :type="t" :size="22" />
          </div>

          <!-- 描述 -->
          <p v-if="card.flavorText" class="ptcg-desc"><EnergyText :text="card.flavorText" /></p>

          <!-- 规则 -->
          <div v-if="card.rules?.length" class="ptcg-rules">
            <div v-for="(rule, i) in card.rules" :key="i" class="ptcg-rule"><EnergyText :text="rule" /></div>
          </div>

          <!-- 进化信息 -->
          <div v-if="card.evolvesFrom" class="ptcg-info-row">
            <span class="lbl">进化自</span> {{ card.evolvesFrom }}
          </div>

          <!-- 特性 -->
          <div v-if="card.abilities?.length" class="ptcg-section">
            <h3>特性</h3>
            <div v-for="ab in card.abilities" :key="ab.name" class="ptcg-ability">
              <div class="ptcg-ability-header">
                <span class="ptcg-ability-type">{{ ab.type }}</span>
                <span class="ptcg-ability-name">{{ ab.name }}</span>
              </div>
              <div class="ptcg-ability-effect"><EnergyText :text="ab.text" /></div>
            </div>
          </div>

          <!-- 招式 -->
          <div v-if="card.attacks?.length" class="ptcg-section">
            <h3>招式</h3>
            <div v-for="atk in card.attacks" :key="atk.name" class="ptcg-attack">
              <div class="ptcg-attack-header">
                <div style="display:flex;align-items:center;gap:6px">
                  <EnergyIcon v-for="(c, i) in atk.cost" :key="i" :type="c" :size="18" />
                  <span class="ptcg-attack-name">{{ atk.name }}</span>
                </div>
                <span v-if="atk.damage" class="ptcg-attack-dmg">{{ atk.damage }}</span>
              </div>
              <div v-if="atk.text" class="ptcg-attack-effect"><EnergyText :text="atk.text" /></div>
            </div>
          </div>

          <!-- 战斗属性行（仅宝可梦卡） -->
          <div v-if="card.supertype === 'Pokémon'" class="ptcg-battle-row">
            <div v-if="card.weaknesses?.length" class="ptcg-info-row">
              <span class="lbl">弱点</span>
              <span v-for="w in card.weaknesses" :key="w.type" class="ptcg-type-val">
                <EnergyIcon :type="w.type" :size="18" /> {{ w.value }}
              </span>
            </div>
            <div v-else class="ptcg-info-row"><span class="lbl">弱点</span> 无</div>
            <div v-if="card.resistances?.length" class="ptcg-info-row">
              <span class="lbl">抗性</span>
              <span v-for="r in card.resistances" :key="r.type" class="ptcg-type-val">
                <EnergyIcon :type="r.type" :size="18" /> {{ r.value }}
              </span>
            </div>
            <div v-else class="ptcg-info-row"><span class="lbl">抗性</span> 无</div>
            <div v-if="card.retreatCost?.length" class="ptcg-info-row">
              <span class="lbl">撤退</span>
              <EnergyIcon v-for="(c, i) in card.retreatCost" :key="i" :type="c" :size="18" />
            </div>
            <div v-else class="ptcg-info-row"><span class="lbl">撤退</span> 无</div>
          </div>

          <!-- 底部信息 -->
          <div class="ptcg-footer-grid">
            <div v-if="card.set" class="ptcg-info-row">
              <span class="lbl">卡包</span>
              <img v-if="card.set.images?.symbol" :src="card.set.images.symbol" class="ptcg-set-symbol" />
              {{ card.set.name }} · #{{ card.number }}
            </div>
            <div v-if="card.rarity" class="ptcg-info-row">
              <span class="lbl">稀有</span> <RarityIcon :rarity="card.rarity" :size="20" />
            </div>
            <div v-if="card.regulationMark" class="ptcg-info-row">
              <span class="lbl">标记</span>
              <span class="ptcg-reg-mark">{{ card.regulationMark }}</span>
            </div>
            <div v-if="card.artist" class="ptcg-info-row">
              <span class="lbl">画师</span> {{ card.artist }}
            </div>
            <div v-if="card.legalities" class="ptcg-info-row">
              <span class="lbl">赛制</span>
              <span class="ptcg-legal" :class="{ yes: card.legalities.standard === 'Legal' }">Standard</span>
              <span class="ptcg-legal" :class="{ yes: card.legalities.expanded === 'Legal' }">Expanded</span>
              <span class="ptcg-legal" :class="{ yes: card.legalities.unlimited === 'Legal' }">Unlimited</span>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- 市场价格 -->
    <div v-if="card.tcgplayer || card.cardmarket" class="detail-section">
      <h3 class="section-toggle" @click="priceOpen = !priceOpen">
        市场价格 <span class="toggle-arrow" :class="{ open: priceOpen }">▸</span>
      </h3>
      <div v-show="priceOpen" class="ptcg-price-grid">
        <template v-if="card.tcgplayer">
          <div class="ptcg-price-source">
            <a :href="card.tcgplayer.url" target="_blank" rel="noopener">TCGPlayer (USD)</a>
          </div>
          <div v-for="(prices, variant) in card.tcgplayer.prices" :key="variant" class="ptcg-price-row">
            <div class="ptcg-price-item" style="min-width:80px">
              <span class="ptcg-price-label">{{ variant }}</span>
            </div>
            <div v-if="prices.low != null" class="ptcg-price-item">
              <span class="ptcg-price-label">Low</span>
              <span class="ptcg-price-val">${{ prices.low?.toFixed(2) }}</span>
            </div>
            <div v-if="prices.market != null" class="ptcg-price-item">
              <span class="ptcg-price-label">Market</span>
              <span class="ptcg-price-val">${{ prices.market?.toFixed(2) }}</span>
            </div>
            <div v-if="prices.mid != null" class="ptcg-price-item">
              <span class="ptcg-price-label">Mid</span>
              <span class="ptcg-price-val">${{ prices.mid?.toFixed(2) }}</span>
            </div>
            <div v-if="prices.high != null" class="ptcg-price-item">
              <span class="ptcg-price-label">High</span>
              <span class="ptcg-price-val">${{ prices.high?.toFixed(2) }}</span>
            </div>
          </div>
        </template>
        <template v-if="card.cardmarket">
          <div class="ptcg-price-source">
            <a :href="card.cardmarket.url" target="_blank" rel="noopener">Cardmarket (EUR)</a>
          </div>
          <div class="ptcg-price-row">
            <div v-if="card.cardmarket.prices.averageSellPrice" class="ptcg-price-item">
              <span class="ptcg-price-label">均价</span>
              <span class="ptcg-price-val">€{{ card.cardmarket.prices.averageSellPrice.toFixed(2) }}</span>
            </div>
            <div v-if="card.cardmarket.prices.lowPrice" class="ptcg-price-item">
              <span class="ptcg-price-label">最低</span>
              <span class="ptcg-price-val">€{{ card.cardmarket.prices.lowPrice.toFixed(2) }}</span>
            </div>
            <div v-if="card.cardmarket.prices.trendPrice" class="ptcg-price-item">
              <span class="ptcg-price-label">趋势</span>
              <span class="ptcg-price-val">€{{ card.cardmarket.prices.trendPrice.toFixed(2) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 相关卡牌 -->
    <PtcgRelatedCards v-for="dex in (card.nationalPokedexNumbers || [])" :key="dex" :dexNum="dex" />

    <!-- 全屏图片预览 -->
    <Teleport to="body">
      <div v-if="showFullImage" class="ptcg-fullimg-overlay" @click="showFullImage = false">
        <img :src="card.images.large" :alt="card.name" class="ptcg-fullimg" />
      </div>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
defineOptions({ name: 'PtcgCardDetail' })
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import EnergyIcon from '../components/EnergyIcon.vue'
import EnergyText from '../components/EnergyText.vue'
import PtcgHoloCard from '../components/PtcgHoloCard.vue'
import PtcgRelatedCards from '../components/PtcgRelatedCards.vue'
import RarityIcon from '../components/RarityIcon.vue'
import PokemonIcon from '../components/PokemonIcon.vue'
import { fetchCard, type PtcgCard } from '../ptcg/api'
import { getPokemon } from '../data'
import type { Pokemon } from '../types'

const props = defineProps<{ id: string }>()
const route = useRoute()

const loading = ref(true)
const card = ref<PtcgCard | null>(null)
const allPokemon = ref<Pokemon[]>([])
const showFullImage = ref(false)
const priceOpen = ref(true)

watch(showFullImage, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
const cardId = computed(() => (route.params.id as string) || props.id)

const linkedPokemon = computed(() => {
  const ids = card.value?.nationalPokedexNumbers
  if (!ids?.length || !allPokemon.value.length) return []
  return ids.map(dex => allPokemon.value.find(p => p.dexNum === dex && p.formNo === 0)).filter(Boolean) as Pokemon[]
})

function copyCardData() {
  if (!card.value) return
  const text = JSON.stringify(card.value, null, 2)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

async function loadCard() {
  loading.value = true
  card.value = null
  showFullImage.value = false
  try {
    const [data] = await Promise.all([
      fetchCard(cardId.value),
      allPokemon.value.length ? Promise.resolve() : getPokemon().then(list => { allPokemon.value = list }),
    ])
    card.value = data
  } finally { loading.value = false }
}

watch(cardId, loadCard)
loadCard()
</script>

<style scoped>
.ptcg-detail-page { padding: 16px 0; }
.ptcg-detail-body { display: flex; gap: 24px; }
.ptcg-detail-left { flex-shrink: 0; width: 320px; }
.ptcg-detail-right { flex: 1; min-width: 0; position: relative; }

.ptcg-dex-link {
  position: absolute; top: 0; right: 0;
  display: inline-block; border-radius: 8px; padding: 2px;
  transition: transform .2s;
}
.ptcg-dex-link:hover { transform: scale(1.15); }

.ptcg-name { font-size: 24px; font-weight: 700; margin-bottom: 2px; cursor: default; }
.ptcg-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; align-items: center; }
.ptcg-tag { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--bg3); color: var(--text); }
.ptcg-cat { background: var(--accent); color: #fff; }
.ptcg-hp { background: #c0392b; color: #fff; }

.ptcg-desc { font-size: 14px; color: var(--text2); margin: 6px 0 10px; line-height: 1.6; font-style: italic; }
.ptcg-rules { margin: 6px 0 10px; }
.ptcg-rule { font-size: 13px; color: var(--text2); line-height: 1.5; padding: 2px 0; }

.ptcg-info-row { font-size: 14px; padding: 3px 0; display: flex; gap: 8px; align-items: center; }
.lbl { color: var(--text2); min-width: 40px; flex-shrink: 0; }
.ptcg-type-val { display: inline-flex; align-items: center; gap: 2px; }

.ptcg-section { margin: 10px 0; }
.ptcg-section h3 { font-size: 15px; color: var(--accent); margin-bottom: 6px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }

.ptcg-ability { padding: 6px 0; }
.ptcg-ability-header { display: flex; align-items: center; gap: 8px; }
.ptcg-ability-type { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 4px; background: #8e44ad; color: #fff; }
.ptcg-ability-name { font-weight: 600; font-size: 14px; }
.ptcg-ability-effect { font-size: 13px; color: var(--text2); margin-top: 3px; line-height: 1.5; }

.ptcg-attack { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.ptcg-attack:last-child { border-bottom: none; }
.ptcg-attack-header { display: flex; justify-content: space-between; align-items: center; }
.ptcg-attack-name { font-weight: 600; font-size: 14px; }
.ptcg-attack-dmg { font-weight: 700; font-size: 16px; color: var(--accent); }
.ptcg-attack-effect { font-size: 13px; color: var(--text2); margin-top: 2px; }

.ptcg-battle-row { display: flex; flex-wrap: wrap; gap: 16px; padding: 8px 0; margin: 4px 0; border-top: 1px solid var(--border); }

.ptcg-footer-grid { padding: 8px 0; margin-top: 4px; border-top: 1px solid var(--border); }
.ptcg-set-symbol { height: 18px; width: 18px; object-fit: contain; }
.ptcg-reg-mark { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--bg3); font-weight: 700; font-size: 13px; }
.ptcg-legal { font-size: 12px; padding: 1px 8px; border-radius: 8px; background: rgba(255,255,255,.06); color: var(--text2); }
.ptcg-legal.yes { background: rgba(46,204,113,.15); color: #2ecc71; }

.ptcg-price-grid { font-size: 13px; }
.ptcg-price-source { font-weight: 600; color: var(--text); margin: 6px 0 4px; }
.ptcg-price-source a { color: var(--accent); text-decoration: none; }
.ptcg-price-source a:hover { text-decoration: underline; }
.ptcg-price-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 3px 0; }
.ptcg-price-item { display: flex; flex-direction: column; align-items: center; min-width: 56px; }
.ptcg-price-label { font-size: 11px; color: var(--text2); }
.ptcg-price-val { font-weight: 600; font-size: 14px; }

@media (max-width: 640px) {
  .ptcg-detail-body { flex-direction: column; }
  .ptcg-detail-left { width: 100%; max-width: 320px; margin: 0 auto; }
}

.ptcg-fullimg-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,.85);
  display: flex; align-items: center; justify-content: center;
  cursor: zoom-out; padding: 24px;
}
.ptcg-fullimg {
  max-width: 100%; max-height: 100%;
  object-fit: contain; border-radius: 12px;
}
</style>
