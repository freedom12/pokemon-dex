/**
 * PokemonTCG.io API service with caching
 * Docs: https://docs.pokemontcg.io
 */

const BASE = 'https://api.pokemontcg.io/v2'
const cache = new Map<string, unknown>()

async function cachedFetch<T>(url: string): Promise<T | null> {
  if (cache.has(url)) return cache.get(url) as T
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  const data = json.data ?? null
  if (data) cache.set(url, data)
  return data
}

// ─── Sets ────────────────────────────────────────────────────────────────────

export interface PtcgSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: { symbol: string; logo: string }
  legalities?: Record<string, string>
}

let setsCache: PtcgSet[] | null = null

export async function fetchAllSets(): Promise<PtcgSet[]> {
  if (setsCache) return setsCache
  const all: PtcgSet[] = []
  let page = 1
  const pageSize = 250
  while (true) {
    const res = await fetch(`${BASE}/sets?orderBy=releaseDate&pageSize=${pageSize}&page=${page}`)
    if (!res.ok) break
    const json = await res.json()
    const data: PtcgSet[] = json.data ?? []
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  setsCache = all
  return all
}

export async function fetchSet(id: string): Promise<PtcgSet | null> {
  return cachedFetch<PtcgSet>(`${BASE}/sets/${id}`)
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export interface PtcgCardBrief {
  id: string
  name: string
  number: string
  images: { small: string; large: string }
}

export interface PtcgCard {
  id: string
  name: string
  supertype: string
  subtypes?: string[]
  hp?: string
  types?: string[]
  evolvesFrom?: string
  rules?: string[]
  attacks?: { name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }[]
  abilities?: { name: string; text: string; type: string }[]
  weaknesses?: { type: string; value: string }[]
  resistances?: { type: string; value: string }[]
  retreatCost?: string[]
  convertedRetreatCost?: number
  number: string
  artist?: string
  rarity?: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  regulationMark?: string
  legalities?: Record<string, string>
  images: { small: string; large: string }
  set: PtcgSet
  tcgplayer?: {
    url: string
    updatedAt: string
    prices: Record<string, { low?: number; mid?: number; high?: number; market?: number; directLow?: number | null }>
  }
  cardmarket?: {
    url: string
    updatedAt: string
    prices: Record<string, number>
  }
}

export async function fetchCard(id: string): Promise<PtcgCard | null> {
  return cachedFetch<PtcgCard>(`${BASE}/cards/${id}`)
}

export async function fetchCardsBySet(setId: string): Promise<PtcgCardBrief[]> {
  const key = `set-cards:${setId}`
  if (cache.has(key)) return cache.get(key) as PtcgCardBrief[]
  const res = await fetch(`${BASE}/cards?q=set.id:${setId}&pageSize=250&select=id,name,number,images`)
  if (!res.ok) return []
  const json = await res.json()
  const data: PtcgCardBrief[] = json.data ?? []
  const sorted = data.sort((a, b) => {
    const na = parseInt(a.number) || 0
    const nb = parseInt(b.number) || 0
    return na !== nb ? na - nb : a.number.localeCompare(b.number)
  })
  cache.set(key, sorted)
  return sorted
}

export async function fetchCardsByPokedex(dexNum: number): Promise<PtcgCardBrief[]> {
  const key = `dex-cards:${dexNum}`
  if (cache.has(key)) return cache.get(key) as PtcgCardBrief[]
  const res = await fetch(`${BASE}/cards?q=nationalPokedexNumbers:${dexNum}&orderBy=set.releaseDate&select=id,name,number,images`)
  if (!res.ok) return []
  const json = await res.json()
  const data = json.data ?? []
  cache.set(key, data)
  return data
}
