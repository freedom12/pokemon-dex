/** PTCG 系列分组配置 */
export const SERIE_GROUPS: { key: string; label: string; ids: string[] }[] = [
  {
    key: 'main',
    label: '主系列',
    ids: ['base', 'gym', 'neo', 'lc', 'ecard', 'ex', 'dp', 'pl', 'hgss', 'col', 'bw', 'xy', 'sm', 'swsh', 'sv', 'me'],
  },
  {
    key: 'special',
    label: '特别系列',
    ids: ['misc', 'pop', 'tk', 'mc', 'tcgp'],
  },
]

/** PTCG 套组（Set）分组配置 */
export const SET_GROUPS: { key: string; ids: string[]; hidden?: boolean }[] = [
  {
    key: 'promo',
    ids: ['basep', 'dpp', 'hgssp', 'bwp', 'xyp', 'smp', 'swshp', 'svp', 'mep'],
  },
  {
    key: 'special',
    ids: ['si1', 'bog', 'ex5.5', 'exu', 'ru1', 'xya', 'sma', 'fut2020', 'sve', 'mfb', 'mee'],
  },
  {
    key: 'hidden',
    ids: ['wp', 'sp', 'rc'],
    hidden: true,
  },
]
