/** 版本组 ID → 中文显示名称 */
export const VG_LABELS: Record<string, string> = {
  'legends-za': '传说 Z-A',
  'scarlet-violet': '朱/紫',
  'legends-arceus': '传说 阿尔宙斯',
  'brilliant-diamond-shining-pearl': '晶灿钻石/明亮珍珠',
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

/** 版本组排序（新 → 旧） */
export const VG_ORDER = Object.keys(VG_LABELS)

/** 版本组 ID → 游戏图标 Software ID 列表 */
export const VG_ICONS: Record<string, string[]> = {
  'legends-za': ['SF052'],
  'scarlet-violet': ['SF050', 'SF051'],
  'legends-arceus': ['SF047'],
  'brilliant-diamond-shining-pearl': ['SF048', 'SF049'],
  'sword-shield': ['SF044', 'SF045'],
  'lets-go-pikachu-lets-go-eevee': ['SF042', 'SF043'],
  'ultra-sun-ultra-moon': ['SF032', 'SF033'],
  'sun-moon': ['SF030', 'SF031'],
  'omega-ruby-alpha-sapphire': ['SF027', 'SF026'],
  'x-y': ['SF024', 'SF025'],
  'black-2-white-2': ['SF022', 'SF023'],
  'black-white': ['SF020', 'SF021'],
  'heartgold-soulsilver': ['SF007', 'SF008'],
  platinum: ['SF012'],
  'diamond-pearl': ['SF010', 'SF011'],
  'firered-leafgreen': ['SF004', 'SF005'],
  emerald: ['SF003'],
  'ruby-sapphire': ['SF001', 'SF002'],
  crystal: ['SF041'],
  'gold-silver': ['SF039', 'SF040'],
  yellow: ['SF038'],
  'red-blue': ['SF035', 'SF036'],
}
