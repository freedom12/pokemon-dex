import { ref, watch } from 'vue'

// ─── 类型定义（统一维护于 ./types.ts） ─────────────────────────────────────
export type {
  PokemonType, PokemonStats, EvoEntry, Pokemon,
  TypeEntry, MoveEntry, NatureEntry, AbilityEntry,
  SoftwareEntry, GameGroup, DexListEntry, PokemonDescMap,
  BattleUsagePokemonItem, ItemEntry, LangEntry, BattleSeason,
} from './types'
import type {
  Pokemon, SoftwareEntry, GameGroup, DexListEntry,
  TypeEntry, MoveEntry, NatureEntry, AbilityEntry,
  ItemEntry, LangEntry, BattleSeason,
  PokemonDescMap, BattleUsagePokemonItem, BattleDetailData,
} from './types'
import type { Learnsets } from './composables/usePokemonLookup'

// ─── 缓存 ───────────────────────────────────────────────────────────────────

const cache: Record<string, unknown> = {}
export const currentLang = ref(localStorage.getItem('lang') ?? 'sch')

watch(currentLang, (v) => { localStorage.setItem('lang', v) })

async function load<T = unknown>(name: string, lang: string): Promise<T> {
  const key = `${lang}/${name}`
  if (cache[key]) return cache[key] as T
  const res = await fetch(`${import.meta.env.BASE_URL}data/${lang}/${name}.json`)
  if (!res.ok) throw new Error(`Failed to load ${key}: ${res.status}`)
  const data = await res.json() as T
  cache[key] = data
  return data
}

async function loadGlobal<T = unknown>(name: string): Promise<T> {
  if (cache[name]) return cache[name] as T
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`)
  const data = await res.json() as T
  cache[name] = data
  return data
}

export const getLangs = (): Promise<LangEntry[]> => loadGlobal('langs')
export const getRibbons = async (lang?: string) => {
  const language = lang ?? currentLang.value
  const key = `${language}/ribbons`
  if (cache[key]) return cache[key]
  const names = await load<{ id: string; name: string; desc: string }[]>('ribbons', language)
  const configs = await loadGlobal<{ id: string; order: number; image: string; hasAlt: boolean }[]>('ribbons')
  const configMap = Object.fromEntries(configs.map((c) => [c.id, c]))
  const data = names.map((n) => ({ ...configMap[n.id], ...n }))
  cache[key] = data
  return data
}

const ICON_BASE = import.meta.env.VITE_ICON_BASE ?? 'https://resource.pokemon-home.com/battledata/img/pokei128/'
export const ZUKAN_IMG_BASE = import.meta.env.VITE_ZUKAN_IMG_BASE ?? 'https://zukan.pokemon.co.jp/zukan-api/up/images/index/'

export const getPokemon = async (lang?: string): Promise<Pokemon[]> => {
  const language = lang ?? currentLang.value
  const key = `${language}/pokemon`
  if (cache[key]) return cache[key] as Pokemon[]
  const localData = await load<
    Array<{ id?: string; name?: string; form?: string; cat?: string; ht?: string; wt?: string }>
  >(`pokemon`, language)
  const rootData = await loadGlobal<
    Array<{
      id: string
      n: number
      fn: number
      fg: number
      icon?: string
      icf?: string
      types?: string[]
      ab?: string[]
      kt?: string
      colId?: string
      st?: number[]
      evo?: [number, number][]
      evot?: string
      mg?: number
      dm?: number
      ns?: number
      ag?: string[]
      i?: string
      if?: string
    }>
  >('pokemon')
  const typeMap = Object.fromEntries((await getTypes(language)).map((t) => [t.id, t]))
  const abilityMap = Object.fromEntries((await getAbilities(language)).map((a) => [a.id, a.name]))
  const colorEntries = await getColors(language)
  const colorHexMap = Object.fromEntries(colorEntries.map((c) => [c.id, c.color]))
  const colorNameMap = Object.fromEntries(colorEntries.map((c) => [c.id, c.name]))
  const rootMap = Object.fromEntries(rootData.map((r) => [r.id, r]))
  const data: Pokemon[] = localData.flatMap((local) => {
    const rootEntry = rootMap[local.id!]
    if (!rootEntry) return []
    return [{
      id: rootEntry.id,
      dexNum: rootEntry.n,
      formNo: rootEntry.fn,
      formGender: rootEntry.fg,
      icon: rootEntry.icon ? ICON_BASE + rootEntry.icon : '',
      iconFemale: rootEntry.icf ? ICON_BASE + rootEntry.icf : '',
      name: local.name ?? '',
      form: local.form ?? '',
      types: (rootEntry.types ?? []).map((tid) => ({
        id: tid,
        name: typeMap[tid]?.name || tid,
        color: typeMap[tid]?.color || '',
      })),
      category: local.cat ?? '',
      height: local.ht ?? '',
      weight: local.wt ?? '',
      color: colorNameMap[rootEntry.colId ?? ''] ?? '',
      colorHex: colorHexMap[rootEntry.colId ?? ''] ?? '',
      shapeId: rootEntry.kt ?? '',
      abilities: (rootEntry.ab ?? []).map((aid) => abilityMap[aid] || aid),
      stats: rootEntry.st
        ? {
            hp: rootEntry.st[0],
            atk: rootEntry.st[1],
            def: rootEntry.st[2],
            spatk: rootEntry.st[3],
            spdef: rootEntry.st[4],
            agi: rootEntry.st[5],
            total: rootEntry.st.reduce((a, b) => a + b, 0),
          }
        : null,
      evoChain: (rootEntry.evo ?? []).map((e) => ({ dexNum: e[0], formNo: e[1] })),
      evoTemplate: rootEntry.evot ?? '',
      isMega: !!rootEntry.mg,
      isDMax: !!rootEntry.dm,
      isInNumberSort: !!rootEntry.ns,
      appearGames: rootEntry.ag ?? [],
      image: rootEntry.i ? ZUKAN_IMG_BASE + rootEntry.i + '.png' : '',
      imageFemale: rootEntry.if ? ZUKAN_IMG_BASE + rootEntry.if + '.png' : '',
    }]
  })
  cache[key] = data
  return data
}
export const getPokemonDescs = (lang?: string): Promise<PokemonDescMap> => load('pokemon-descs', lang ?? currentLang.value)
export const getTypes = async (lang?: string): Promise<TypeEntry[]> => {
  const names = await load<{ id: string; name: string }[]>(
    'types', lang ?? currentLang.value,
  )
  const configs = await loadGlobal<
    Array<Omit<TypeEntry, 'name'> & { id: string }>
  >('types')
  const configMap: Record<string, Omit<TypeEntry, 'name'>> = {}
  for (const c of configs) configMap[c.id] = c
  return names.map((n) => ({
    ...(configMap[n.id] || { id: n.id, color: '', image: '', sort: 0, weakTo: [], resistTo: [], immuneTo: [] }),
    name: n.name,
  }))
}
export const getMoves = async (lang?: string): Promise<MoveEntry[]> => {
  const language = lang ?? currentLang.value
  const names = await load<
    Array<{ id: string; name: string; desc: string; category: string }>
  >('moves', language)
  const configs = await loadGlobal<
    Array<{ id: string; type: string; categoryId: string }>
  >('moves')
  const types = await getTypes(language)
  const typeNameMap = Object.fromEntries(types.map((t) => [t.id, t.name]))
  const typeColorMap = Object.fromEntries(types.map((t) => [t.id, t.color]))
  const configMap: Record<string, { id: string; type: string; categoryId: string }> = {}
  for (const c of configs) configMap[c.id] = c
  return names.map((m) => ({
    ...configMap[m.id],
    ...m,
    typeName: typeNameMap[configMap[m.id]?.type] || '',
    typeColor: typeColorMap[configMap[m.id]?.type] || '',
  }))
}
export const getNatures = async (lang?: string): Promise<NatureEntry[]> => {
  const language = lang ?? currentLang.value
  const key = `${language}/natures`
  if (cache[key]) return cache[key] as NatureEntry[]
  const names = await load<{ id: string; name: string; desc: string }[]>('natures', language)
  const configs = await loadGlobal<{ id: string; plus: string; minus: string }[]>('natures')
  const statNames = await load<{ id: string; name: string }[]>('stats', language)
  const statMap = Object.fromEntries(statNames.map((s) => [s.id, s.name]))
  const configMap = Object.fromEntries(configs.map((c) => [c.id, c]))
  const data: NatureEntry[] = names.map((n) => {
    const cfg = configMap[n.id]
    return {
      ...n,
      plus: cfg ? statMap[cfg.plus] || '' : '',
      minus: cfg ? statMap[cfg.minus] || '' : '',
      plusId: cfg?.plus || '',
      minusId: cfg?.minus || '',
    }
  })
  cache[key] = data
  return data
}
export const getBalls = (lang?: string) => load('balls', lang ?? currentLang.value)
export const getRegions = async (lang?: string) => {
  const language = lang ?? currentLang.value
  const key = `${language}/regions`
  if (cache[key]) return cache[key]
  const names = await load<{ id: string; name: string }[]>('regions', language)
  const configs = await loadGlobal<{ id: string; no: number }[]>('regions')
  const configMap = Object.fromEntries(configs.map((c) => [c.id, c]))
  const data = names.map((n) => ({ ...configMap[n.id], ...n }))
  cache[key] = data
  return data
}
export const getSoftwares = async (lang?: string): Promise<SoftwareEntry[]> => {
  const language = lang ?? currentLang.value
  const key = `${language}/softwares`
  if (cache[key]) return cache[key] as SoftwareEntry[]
  const names = await load<{ id: string; name: string }[]>('softwares', language)
  const configs = await loadGlobal<{ id: string; romId: number; gen: number; regionId: string }[]>('softwares')
  const regions = await getRegions(language) as { id: string; name: string }[]
  const regionMap = Object.fromEntries(regions.map((r) => [r.id, r.name]))
  const configMap = Object.fromEntries(configs.map((c) => [c.id, c]))
  const data: SoftwareEntry[] = names.map((n) => {
    const cfg = configMap[n.id]
    return {
      ...cfg,
      ...n,
      region: cfg?.regionId ? regionMap[cfg.regionId] || '' : '',
    }
  })
  cache[key] = data
  return data
}
export const getAbilities = (lang?: string): Promise<AbilityEntry[]> => load('abilities', lang ?? currentLang.value)
export const getItems = (lang?: string): Promise<ItemEntry[]> => load('items', lang ?? currentLang.value)
export const getColors = async (lang?: string): Promise<{ id: string; color: string; name: string }[]> => {
  const language = lang ?? currentLang.value
  const key = `${language}/colors`
  if (cache[key]) return cache[key] as { id: string; color: string; name: string }[]
  const configs = await loadGlobal<{ id: string; color: string }[]>('colors')
  const names = await load<{ id: string; name: string }[]>('colors', language)
  const nameMap = Object.fromEntries(names.map((n) => [n.id, n.name]))
  const data = configs.map((c) => ({ ...c, name: nameMap[c.id] || '' }))
  cache[key] = data
  return data
}
export const getDexList = async (lang?: string): Promise<DexListEntry[]> => {
  const language = lang ?? currentLang.value
  const names = await load<{ id: string; name: string }[]>('dexList', language)
  const configs = await loadGlobal<Array<Omit<DexListEntry, 'name'>>>("dexList")
  const configMap: Record<string, Omit<DexListEntry, 'name'>> = {}
  for (const c of configs) configMap[c.id] = c
  return names.map((d) => ({ ...configMap[d.id], ...d }))
}
export const getStats = (lang?: string): Promise<{ id: string; name: string }[]> => load('stats', lang ?? currentLang.value)
export const getGameGroups = (): Promise<GameGroup[]> => loadGlobal('gameGroups')
export const getLearnsets = (): Promise<Learnsets> => loadGlobal<Learnsets>('learnsets')

// ── 对战使用率数据 ──
export const getBattleSeasons = (game = 'scvi'): Promise<BattleSeason[]> => loadGlobal(`battle-usage/${game}/rankmatch`)
export const getBattleTournaments = (game = 'scvi'): Promise<BattleSeason[]> => loadGlobal(`battle-usage/${game}/internet`)
export const getBattleUsagePokemon = (game: string, cId: string): Promise<BattleUsagePokemonItem[]> => loadGlobal(`battle-usage/${game}/${cId}/pokemon`)
export const getBattleUsagePDetail = (game: string, cId: string): Promise<BattleDetailData> => loadGlobal<BattleDetailData>(`battle-usage/${game}/${cId}/pdetail`)
