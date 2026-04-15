// ─── 共享类型定义 ──────────────────────────────────────────────────────────────

export interface PokemonType {
  id: string
  name: string
  color: string
}

export interface PokemonStats {
  hp: number
  atk: number
  def: number
  spatk: number
  spdef: number
  agi: number
  total: number
}

export interface EvoEntry {
  dexNum: number
  formNo: number
}

export interface Pokemon {
  id: string
  dexNum: number
  formNo: number
  formGender: number
  icon: string
  iconFemale: string
  name: string
  form: string
  types: PokemonType[]
  category: string
  height: string
  weight: string
  color: string
  colorHex: string
  shapeId: string
  abilities: string[]
  stats: PokemonStats | null
  evoChain: EvoEntry[]
  evoTemplate: string
  isMega: boolean
  isDMax: boolean
  isInNumberSort: boolean
  appearGames: string[]
  image: string
  imageFemale: string
}

export interface ZukanDesc {
  game: string
  sids: string[]
  desc: string
}

export interface AbilityWithDesc {
  name: string
  desc: string
}

export type DetailedPokemon = Omit<Pokemon, 'abilities'> & {
  abilities: AbilityWithDesc[]
  zukanDescs: ZukanDesc[]
}

export interface TypeEntry {
  id: string
  name: string
  color: string
  weakTo: string[]
  resistTo: string[]
  immuneTo: string[]
}

export interface MoveEntry {
  id: string
  name: string
  type: string
  typeName?: string
  categoryId?: string
  category?: string
  desc?: string
  [key: string]: unknown
}

export interface NatureEntry {
  id: string
  name: string
  plus: string
  minus: string
  plusId: string
  minusId: string
  desc?: string
}

export interface AbilityEntry {
  id: string
  name: string
  desc?: string
}

export interface SoftwareEntry {
  id: string
  name: string
  [key: string]: unknown
}

export interface GameGroup {
  id: string
  name: string
  softwareIds: string[]
  [key: string]: unknown
}

export interface DexListEntry {
  id: string
  name: string
  softwareIds: string[]
  pokemonIds: string[]
}

export interface PokemonDescMap {
  [key: string]: Record<string, unknown>
}

export interface BattleUsagePokemonItem {
  id: number
  form: number
  [key: string]: unknown
}

export interface ItemEntry {
  id: string
  name: string
  [key: string]: unknown
}

export interface LangEntry {
  id: string
  name: string
}

export interface BattleSeason {
  season: number
  rule: number
  cId: string
  name: string
  subname?: string
  start?: string
  end?: string
  cnt?: number | string
}

// ─── 对战使用率详情类型 ─────────────────────────────────────────────────────

export interface BattleStatItem {
  id: number | string
  val: number
}

export interface BattleFormData {
  temoti?: {
    waza?: BattleStatItem[]
    motimono?: BattleStatItem[]
    tokusei?: BattleStatItem[]
    seikaku?: BattleStatItem[]
    terastal?: BattleStatItem[]
    pokemon?: BattleUsagePokemonItem[]
  } | null
  win?: {
    pokemon?: BattleUsagePokemonItem[]
    waza?: BattleStatItem[]
  } | null
  lose?: {
    pokemon?: BattleUsagePokemonItem[]
    waza?: BattleStatItem[]
  } | null
}

export type BattleDetailData = Record<string, Record<string, BattleFormData>>
