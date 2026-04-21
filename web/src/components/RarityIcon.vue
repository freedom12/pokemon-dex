<template>
  <span class="rarity" :title="rarity">
    <span class="rarity-symbols">{{ symbols }}</span>
    <span class="rarity-label">{{ rarity }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 稀有度 → 符号映射
 * ● = Common, ◆ = Uncommon, ★ = Rare, ☆ = Holo/Special
 */
const RARITY_SYMBOLS: Record<string, string> = {
  'Common':                '●',
  'Uncommon':              '◆',
  'Rare':                  '★',
  'Rare Holo':             '★',
  'Rare Holo V':           '★V',
  'Rare Holo VMAX':        '★VMAX',
  'Rare Holo VSTAR':       '★VSTAR',
  'Rare Holo GX':          '★GX',
  'Rare Holo EX':          '★EX',
  'Rare Holo LV.X':        '★LV.X',
  'Rare PRIME':            '★P',
  'Rare BREAK':            '★B',
  'Rare ACE':              '★A',
  'Rare Prism Star':       '★◇',
  'Rare Rainbow':          '★★',
  'Rare Secret':           '★★',
  'Rare Shining':          '✦',
  'Rare Shiny':            '✦',
  'Rare Shiny GX':         '✦GX',
  'Rare Ultra':            '★★',
  'Ultra Rare':            '★★',
  'Secret Rare':           '★★★',
  'Hyper Rare':            '★★★',
  'Amazing Rare':          '✧',
  'LEGEND':                '★L',
  'Promo':                 '☆',
  'Classic Collection':    '☆C',
  'Illustration Rare':     '☆',
  'Special Illustration Rare': '☆☆',
  'Double Rare':           '★★',
  'ACE SPEC Rare':         '★A',
  'Shiny Rare':            '✦',
  'Shiny Ultra Rare':      '✦✦',
  'Radiant Rare':          '✧',
  // TCG Pocket
  'One Diamond':           '◇',
  'Two Diamond':           '◇◇',
  'Three Diamond':         '◇◇◇',
  'Four Diamond':          '◇◇◇◇',
  'One Star':              '☆',
  'Two Star':              '☆☆',
  'Three Star':            '☆☆☆',
  'One Shiny':             '✦',
  'Two Shiny':             '✦✦',
  'Crown':                 '♛',
}

const props = defineProps<{ rarity: string; size?: number }>()

const symbols = computed(() => RARITY_SYMBOLS[props.rarity] ?? '★')
</script>

<style scoped>
.rarity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.rarity-symbols {
  font-size: 14px;
  letter-spacing: 1px;
}
.rarity-label {
  font-size: 13px;
  color: var(--text2);
}
</style>
