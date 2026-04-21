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
          <img v-if="card.image" :src="card.image + '/high.webp'" :alt="card.name" class="ptcg-detail-img" />
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
          <h2 class="ptcg-name">
            {{ card.name }}
            <span v-if="card.suffix" class="ptcg-suffix">{{ card.suffix }}</span>
            <span v-if="card.level" class="ptcg-suffix">Lv.{{ card.level }}</span>
          </h2>

          <!-- 标签区 -->
          <div class="ptcg-meta">
            <span class="ptcg-tag ptcg-cat">{{ card.category }}</span>
            <span v-if="card.stage" class="ptcg-tag">{{ card.stage }}</span>
            <span v-if="card.hp" class="ptcg-tag ptcg-hp">HP {{ card.hp }}</span>
            <EnergyIcon v-for="t in (card.types || [])" :key="t" :type="t" :size="22" />
            <span v-if="card.trainerType" class="ptcg-tag">{{ card.trainerType }}</span>
            <span v-if="card.energyType" class="ptcg-tag">{{ card.energyType }}</span>
          </div>

          <!-- 描述 / 效果 -->
          <p v-if="card.description" class="ptcg-desc"><EnergyText :text="card.description" /></p>
          <p v-if="card.effect" class="ptcg-desc"><EnergyText :text="card.effect" /></p>

          <!-- 进化信息 -->
          <div v-if="card.evolveFrom" class="ptcg-info-row">
            <span class="lbl">进化自</span> {{ card.evolveFrom }}
          </div>

          <!-- 特性 -->
          <div v-if="card.abilities?.length" class="ptcg-section">
            <h3>特性</h3>
            <div v-for="ab in card.abilities" :key="ab.name" class="ptcg-ability">
              <div class="ptcg-ability-header">
                <span class="ptcg-ability-type">{{ ab.type }}</span>
                <span class="ptcg-ability-name">{{ ab.name }}</span>
              </div>
              <div class="ptcg-ability-effect"><EnergyText :text="ab.effect" /></div>
            </div>
          </div>

          <!-- 招式 -->
          <div v-if="card.attacks?.length" class="ptcg-section">
            <h3>招式</h3>
            <div v-for="atk in card.attacks" :key="atk.name" class="ptcg-attack">
              <div class="ptcg-attack-header">
                <div style="display:flex;align-items:center;gap:6px">
                  <EnergyIcon v-for="(c, i) in (atk.cost || [])" :key="i" :type="c" :size="18" />
                  <span class="ptcg-attack-name">{{ atk.name }}</span>
                </div>
                <span v-if="atk.damage" class="ptcg-attack-dmg">{{ atk.damage }}</span>
              </div>
              <div v-if="atk.effect" class="ptcg-attack-effect"><EnergyText :text="atk.effect" /></div>
            </div>
          </div>

          <!-- 道具 -->
          <div v-if="card.item" class="ptcg-section">
            <h3>道具 — {{ card.item.name }}</h3>
            <div class="ptcg-ability-effect"><EnergyText :text="card.item.effect" /></div>
          </div>

          <!-- 战斗属性行 -->
          <div class="ptcg-battle-row">
            <div v-if="card.weaknesses?.length" class="ptcg-info-row">
              <span class="lbl">弱点</span>
              <span v-for="w in card.weaknesses" :key="w.type" class="ptcg-type-val">
                <EnergyIcon :type="w.type" :size="18" /> {{ w.value }}
              </span>
            </div>
            <div v-if="card.resistances?.length" class="ptcg-info-row">
              <span class="lbl">抵抗</span>
              <span v-for="r in card.resistances" :key="r.type" class="ptcg-type-val">
                <EnergyIcon :type="r.type" :size="18" /> {{ r.value }}
              </span>
            </div>
            <div v-if="card.retreat" class="ptcg-info-row">
              <span class="lbl">撤退</span>
              <EnergyIcon v-for="i in card.retreat" :key="i" type="Colorless" :size="18" />
            </div>
          </div>

          <!-- 合规 & 标记 -->
          <div class="ptcg-footer-grid">
            <div v-if="card.set" class="ptcg-info-row">
              <span class="lbl">卡包</span>
              <img v-if="card.set.symbol" :src="card.set.symbol + '.png'" class="ptcg-set-symbol" />
              {{ card.set.name }} · #{{ card.localId }}
            </div>
            <div v-if="card.rarity" class="ptcg-info-row">
              <span class="lbl">稀有</span> {{ card.rarity }}
            </div>
            <div v-if="card.regulationMark" class="ptcg-info-row">
              <span class="lbl">标记</span>
              <span class="ptcg-reg-mark">{{ card.regulationMark }}</span>
            </div>
            <div v-if="card.illustrator" class="ptcg-info-row">
              <span class="lbl">画师</span> {{ card.illustrator }}
            </div>
            <div v-if="card.legal" class="ptcg-info-row">
              <span class="lbl">赛制</span>
              <span class="ptcg-legal" :class="{ yes: card.legal.standard }">Standard</span>
              <span class="ptcg-legal" :class="{ yes: card.legal.expanded }">Expanded</span>
            </div>
            <div v-if="card.variants" class="ptcg-info-row">
              <span class="lbl">版本</span>
              <span v-if="card.variants.normal" class="ptcg-variant">Normal</span>
              <span v-if="card.variants.holo" class="ptcg-variant holo">Holo</span>
              <span v-if="card.variants.reverse" class="ptcg-variant reverse">Reverse</span>
              <span v-if="card.variants.firstEdition" class="ptcg-variant first">1st Ed</span>
            </div>
          </div>

          <!-- 价格 -->
          <div v-if="hasPrice" class="ptcg-section">
            <h3>市场价格</h3>
            <div class="ptcg-price-grid">
              <template v-if="card.pricing?.cardmarket">
                <div class="ptcg-price-source">Cardmarket ({{ card.pricing.cardmarket.unit }})</div>
                <div class="ptcg-price-row">
                  <div v-if="card.pricing.cardmarket.avg != null" class="ptcg-price-item">
                    <span class="ptcg-price-label">均价</span>
                    <span class="ptcg-price-val">{{ card.pricing.cardmarket.avg?.toFixed(2) }}</span>
                  </div>
                  <div v-if="card.pricing.cardmarket.low != null" class="ptcg-price-item">
                    <span class="ptcg-price-label">最低</span>
                    <span class="ptcg-price-val">{{ card.pricing.cardmarket.low?.toFixed(2) }}</span>
                  </div>
                  <div v-if="card.pricing.cardmarket.trend != null" class="ptcg-price-item">
                    <span class="ptcg-price-label">趋势</span>
                    <span class="ptcg-price-val">{{ card.pricing.cardmarket.trend?.toFixed(2) }}</span>
                  </div>
                  <div v-if="card.pricing.cardmarket['avg-holo'] != null" class="ptcg-price-item">
                    <span class="ptcg-price-label">Holo 均价</span>
                    <span class="ptcg-price-val">{{ card.pricing.cardmarket['avg-holo']?.toFixed(2) }}</span>
                  </div>
                </div>
              </template>
              <template v-if="card.pricing?.tcgplayer">
                <div class="ptcg-price-source">TCGPlayer ({{ card.pricing.tcgplayer.unit }})</div>
                <template v-for="(vdata, vkey) in tcgplayerVariants" :key="vkey">
                  <div class="ptcg-price-row">
                    <div class="ptcg-price-item" style="min-width:60px">
                      <span class="ptcg-price-label">{{ vkey }}</span>
                    </div>
                    <div v-if="vdata.lowPrice != null" class="ptcg-price-item">
                      <span class="ptcg-price-label">Low</span>
                      <span class="ptcg-price-val">{{ vdata.lowPrice?.toFixed(2) }}</span>
                    </div>
                    <div v-if="vdata.marketPrice != null" class="ptcg-price-item">
                      <span class="ptcg-price-label">Market</span>
                      <span class="ptcg-price-val">{{ vdata.marketPrice?.toFixed(2) }}</span>
                    </div>
                    <div v-if="vdata.midPrice != null" class="ptcg-price-item">
                      <span class="ptcg-price-label">Mid</span>
                      <span class="ptcg-price-val">{{ vdata.midPrice?.toFixed(2) }}</span>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
defineOptions({ name: 'PtcgCardDetail' })
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import EnergyIcon from '../components/EnergyIcon.vue'
import EnergyText from '../components/EnergyText.vue'
import PokemonIcon from '../components/PokemonIcon.vue'
import { getPokemon } from '../data'
import type { Pokemon } from '../types'
import type { CardDetail } from '../ptcg/types'

const props = defineProps<{ id: string }>()
const route = useRoute()

const loading = ref(true)
const card = ref<CardDetail | null>(null)
const allPokemon = ref<Pokemon[]>([])

const cardId = computed(() => (route.params.id as string) || props.id)
const linkedPokemon = computed(() => {
  const ids = card.value?.dexId
  if (!ids?.length || !allPokemon.value.length) return []
  return ids.map(dex => allPokemon.value.find(p => p.dexNum === dex && p.formNo === 0)).filter(Boolean) as Pokemon[]
})

const hasPrice = computed(() => {
  const p = card.value?.pricing
  return p?.cardmarket || p?.tcgplayer
})

const tcgplayerVariants = computed(() => {
  const t = card.value?.pricing?.tcgplayer
  if (!t) return {}
  const out: Record<string, { lowPrice?: number; midPrice?: number; highPrice?: number; marketPrice?: number }> = {}
  for (const k of ['normal', 'holofoil', 'reverse'] as const) {
    if (t[k]) out[k] = t[k]!
  }
  return out
})

async function loadCard() {
  loading.value = true
  card.value = null
  try {
    const [res] = await Promise.all([
      fetch(`https://api.tcgdex.net/v2/en/cards/${cardId.value}`),
      allPokemon.value.length ? Promise.resolve() : getPokemon().then(list => { allPokemon.value = list }),
    ])
    if (res.ok) card.value = await res.json()
  } finally { loading.value = false }
}

watch(cardId, loadCard)
loadCard()
</script>

<style scoped>
.ptcg-detail-page { padding: 16px 0; }
.ptcg-detail-body { display: flex; gap: 24px; }
.ptcg-detail-left { flex-shrink: 0; width: 320px; }
.ptcg-detail-img { width: 100%; border-radius: 8px; }
.ptcg-detail-right { flex: 1; min-width: 0; position: relative; }

.ptcg-dex-link {
  position: absolute; top: 0; right: 0;
  display: inline-block;
  border-radius: 8px; padding: 2px;
  transition: transform .2s;
}
.ptcg-dex-link:hover { transform: scale(1.15); }

.ptcg-name { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
.ptcg-suffix { font-size: 14px; font-weight: 400; color: var(--text2); margin-left: 6px; }

.ptcg-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; align-items: center; }
.ptcg-tag { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--bg3); color: var(--text); }
.ptcg-cat { background: var(--accent); color: #fff; }
.ptcg-hp { background: #c0392b; color: #fff; }

.ptcg-desc { font-size: 14px; color: var(--text2); margin: 6px 0 10px; line-height: 1.6; font-style: italic; }

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
.ptcg-variant { font-size: 12px; padding: 1px 8px; border-radius: 8px; background: rgba(255,255,255,.06); color: var(--text2); }
.ptcg-variant.holo { background: rgba(241,196,15,.15); color: #f1c40f; }
.ptcg-variant.reverse { background: rgba(52,152,219,.15); color: #3498db; }
.ptcg-variant.first { background: rgba(231,76,60,.15); color: #e74c3c; }

.ptcg-price-grid { font-size: 13px; }
.ptcg-price-source { font-weight: 600; color: var(--text); margin: 6px 0 4px; }
.ptcg-price-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 3px 0; }
.ptcg-price-item { display: flex; flex-direction: column; align-items: center; min-width: 56px; }
.ptcg-price-label { font-size: 11px; color: var(--text2); }
.ptcg-price-val { font-weight: 600; font-size: 14px; }

@media (max-width: 640px) {
  .ptcg-detail-body { flex-direction: column; }
  .ptcg-detail-left { width: 100%; max-width: 320px; margin: 0 auto; }
}
</style>
