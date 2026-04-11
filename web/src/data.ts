import { ref, watch } from 'vue'

// ─── 类型定义 ───────────────────────────────────────────────────────────────

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
  abilities: string[]
  stats: PokemonStats | null
  evoChain: EvoEntry[]
  evoTemplate: string
  isMega: boolean
  isDMax: boolean
  isInNumberSort: boolean
  appearGames: string[]
}

export interface TypeEntry {
  id: string
  name: string
  color: string
}

export interface MoveEntry {
  id: string
  name: string
  type: string
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

// ─── 缓存 ───────────────────────────────────────────────────────────────────

const cache: Record<string, unknown> = {}
export const currentLang = ref(localStorage.getItem('lang') ?? 'sch')

watch(currentLang, (v) => { localStorage.setItem('lang', v) })

async function load<T = unknown>(name: string, lang: string): Promise<T> {
  const key = `${lang}/${name}`
  if (cache[key]) return cache[key] as T
  const res = await fetch(`${import.meta.env.BASE_URL}data/${lang}/${name}.json`)
  const data = await res.json() as T
  cache[key] = data
  return data
}

async function loadGlobal<T = unknown>(name: string): Promise<T> {
  if (cache[name]) return cache[name] as T
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  const data = await res.json() as T
  cache[name] = data
  return data
}

export const getLangs = (): Promise<LangEntry[]> => loadGlobal('langs')
export const getRibbons = (lang?: string) => load('ribbons', lang ?? currentLang.value)

const ICON_BASE = 'https://resource.pokemon-home.com/battledata/img/pokei128/'
export const ZUKAN_IMG_BASE = 'https://zukan.pokemon.co.jp/zukan-api/up/images/index/'

type RawPokemon = {
  id: string; n: number; fn: number; fg: number
  icon?: string; icf?: string; name: string; form?: string
  types?: [string, string, string][]
  cat?: string; ht?: string; wt?: string; col?: string; ab?: string[]
  st?: number[]; evo?: [number, number][]; evot?: string
  mg?: unknown; dm?: unknown; ns?: unknown; ag?: string[]
}

async function loadPokemon(lang: string): Promise<Pokemon[]> {
  const key = `${lang}/pokemon`
  if (cache[key]) return cache[key] as Pokemon[]
  const res = await fetch(`${import.meta.env.BASE_URL}data/${lang}/pokemon.json`)
  const raw = await res.json() as RawPokemon[]
  const data: Pokemon[] = raw.map(p => ({
    id: p.id,
    dexNum: p.n,
    formNo: p.fn,
    formGender: p.fg,
    icon: p.icon ? ICON_BASE + p.icon : '',
    iconFemale: p.icf ? ICON_BASE + p.icf : '',
    name: p.name,
    form: p.form ?? '',
    types: (p.types ?? []).map(t => ({ id: t[0], name: t[1], color: t[2] })),
    category: p.cat ?? '',
    height: p.ht ?? '',
    weight: p.wt ?? '',
    color: p.col ?? '',
    abilities: p.ab ?? [],
    stats: p.st
      ? { hp: p.st[0], atk: p.st[1], def: p.st[2], spatk: p.st[3], spdef: p.st[4], agi: p.st[5], total: p.st.reduce((a, b) => a + b, 0) }
      : null,
    evoChain: (p.evo ?? []).map(e => ({ dexNum: e[0], formNo: e[1] })),
    evoTemplate: p.evot ?? '',
    isMega: !!p.mg,
    isDMax: !!p.dm,
    isInNumberSort: !!p.ns,
    appearGames: p.ag ?? [],
  }))
  cache[key] = data
  return data
}

export const getPokemon = (lang?: string): Promise<Pokemon[]> => loadPokemon(lang ?? currentLang.value)
export const getPokemonDescs = (lang?: string): Promise<PokemonDescMap> => load('pokemon-descs', lang ?? currentLang.value)
export const getTypes = (lang?: string): Promise<TypeEntry[]> => load('types', lang ?? currentLang.value)
export const getMoves = (lang?: string): Promise<MoveEntry[]> => load('moves', lang ?? currentLang.value)
export const getNatures = (lang?: string): Promise<NatureEntry[]> => load('natures', lang ?? currentLang.value)
export const getBalls = (lang?: string) => load('balls', lang ?? currentLang.value)
export const getRegions = (lang?: string) => load('regions', lang ?? currentLang.value)
export const getPlans = (lang?: string) => load('plans', lang ?? currentLang.value)
export const getSoftwares = (lang?: string): Promise<SoftwareEntry[]> => load('softwares', lang ?? currentLang.value)
export const getAbilities = (lang?: string): Promise<AbilityEntry[]> => load('abilities', lang ?? currentLang.value)
export const getItems = (lang?: string): Promise<ItemEntry[]> => load('items', lang ?? currentLang.value)
export const getDexList = (lang?: string): Promise<DexListEntry[]> => load('dexList', lang ?? currentLang.value)
export const getGameGroups = (): Promise<GameGroup[]> => loadGlobal('gameGroups')
export const getLearnsets = () => loadGlobal<Record<string, Record<string, unknown>>>('learnsets')

// ── 对战使用率数据 ──
export const getBattleSeasons = (game = 'scvi'): Promise<BattleSeason[]> => loadGlobal(`battle-usage/${game}/rankmatch`)
export const getBattleTournaments = (game = 'scvi'): Promise<BattleSeason[]> => loadGlobal(`battle-usage/${game}/internet`)
export const getBattleUsagePokemon = (game: string, cId: string): Promise<BattleUsagePokemonItem[]> => loadGlobal(`battle-usage/${game}/${cId}/pokemon`)
export const getBattleUsagePDetail = (game: string, cId: string) => loadGlobal(`battle-usage/${game}/${cId}/pdetail`)
