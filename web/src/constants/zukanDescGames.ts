/**
 * 图鉴描述的游戏软件 ID 索引（语言无关，硬编码于前端代码）
 *
 * `data/<lang>/pokemon-descs/<id>.json` 中 `z` 条目的第一个元素是
 * 指向本数组的索引号。数组顺序由 scripts/build-data.ts 生成时的
 * 首次遇到顺序决定，生成时会自动与本常量校验，不一致会告警。
 */
export const ZUKAN_DESC_GAMES: string[][] = [
  ['SF024'],             // Pokémon X
  ['SF025'],             // Pokémon Y
  ['SF026'],             // Pokémon Alpha Sapphire
  ['SF027'],             // Pokémon Omega Ruby
  ['SF042', 'SF043'],    // Pokémon Let's Go 皮卡丘 / 伊布
  ['SF044'],             // Pokémon Sword
  ['SF045'],             // Pokémon Shield
  ['SF048'],             // Pokémon Brilliant Diamond
  ['SF049'],             // Pokémon Shining Pearl
  ['SF050'],             // Pokémon Scarlet
  ['SF051'],             // Pokémon Violet
  ['SF052'],             // Pokémon Legends Z-A
  ['SF030'],             // Pokémon Sun
  ['SF031'],             // Pokémon Moon
  ['SF032'],             // Pokémon Ultra Sun
  ['SF033'],             // Pokémon Ultra Moon
  ['SF047'],             // Pokémon Legends: Arceus
]
