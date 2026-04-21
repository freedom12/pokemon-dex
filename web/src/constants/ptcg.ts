/**
 * 特殊系列 Set 分组配置
 * 不在此列表中的 set 归入其原始 series（作为主系列显示）
 */
export const SPECIAL_SET_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'POP', ids: ['pop1', 'pop2', 'pop3', 'pop4', 'pop5', 'pop6', 'pop7', 'pop8', 'pop9'] },
  { label: "McDonald's Collection", ids: ['mcd11', 'mcd12', 'mcd14', 'mcd15', 'mcd16', 'mcd17', 'mcd18', 'mcd19', 'mcd21', 'mcd22'] },
  { label: 'Other', ids: ['np', 'si1', 'base6', 'bp', 'ru1', 'fut20'] },
]

/** 所有特殊 set ID 的集合（用于快速判断） */
export const SPECIAL_SET_IDS = new Set(SPECIAL_SET_GROUPS.flatMap(g => g.ids))

/** 主系列内的附属 set 匹配规则 */
export const MAIN_SERIES_SUB_PATTERNS = [
  { key: 'promo', match: /Promo/i },
  { key: 'trainer', match: /Trainer Kit/i },
  { key: 'energy', match: /Energies/i },
]
