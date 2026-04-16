/**
 * 从 PokeAPI 获取宝可梦可学习招式数据（含不同形态 + 按版本分组）
 *
 * 输出: web/public/data/learnsets.json
 * 格式: { "<dexNum>": { "<formIndex>": { "<versionGroup>": { ... } } } }
 *
 * 用法: pnpm tsx scripts/fetch-learnsets.ts
 *       pnpm tsx scripts/fetch-learnsets.ts --from=500
 */
import { resolve } from 'path'
import { fetchWithRetry, parseArgs, writeJson, readJson, getDirname } from './lib/utils'

const __dirname = getDirname(import.meta.url)
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', 'learnsets.json')

const args = parseArgs()
const FROM = parseInt(args.from as string) || 1
const MAX_DEX = 1025
const CONCURRENCY = 5

// 只保留这些版本组
const KEEP_VGS = new Set([
  'red-blue', 'yellow',
  'gold-silver', 'crystal',
  'ruby-sapphire', 'emerald', 'firered-leafgreen',
  'diamond-pearl', 'platinum', 'heartgold-soulsilver',
  'black-white', 'black-2-white-2',
  'x-y', 'omega-ruby-alpha-sapphire',
  'sun-moon', 'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee',
  'sword-shield',
  'brilliant-diamond-shining-pearl',
  'legends-arceus',
  'scarlet-violet',
  'legends-za',
])

type LevelUpEntry = { move: number; level: number }
type LearnsetBucket = {
  'level-up'?: LevelUpEntry[]
  machine?: number[]
  egg?: number[]
  tutor?: number[]
}
type VersionGroupLearnset = Record<string, LearnsetBucket>
type FormLearnset = Record<string, VersionGroupLearnset>
type LearnsetData = Record<string, FormLearnset>

const result: LearnsetData = readJson<LearnsetData>(OUT_FILE) ?? {}

function extractLearnset(data: any): VersionGroupLearnset {
  const byVg: Record<string, Required<LearnsetBucket>> = {}

  for (const entry of data.moves) {
    const moveId = entry.move.url.match(/\/(\d+)\/$/)?.[1]
    if (!moveId) continue
    const mid = parseInt(moveId, 10)

    for (const vg of entry.version_group_details) {
      const vgName: string = vg.version_group.name
      if (!KEEP_VGS.has(vgName)) continue

      if (!byVg[vgName]) byVg[vgName] = { 'level-up': [], machine: [], egg: [], tutor: [] }
      const bucket = byVg[vgName]
      const method: string = vg.move_learn_method.name

      if (method === 'level-up') {
        if (!bucket['level-up'].find(e => e.move === mid)) {
          bucket['level-up'].push({ move: mid, level: vg.level_learned_at })
        }
      } else if (method === 'machine') {
        if (!bucket.machine.includes(mid)) bucket.machine.push(mid)
      } else if (method === 'egg') {
        if (!bucket.egg.includes(mid)) bucket.egg.push(mid)
      } else if (method === 'tutor') {
        if (!bucket.tutor.includes(mid)) bucket.tutor.push(mid)
      }
    }
  }

  // 排序 level-up，清理空数组/空版本组
  for (const vg of Object.values(byVg)) {
    vg['level-up'].sort((a, b) => a.level - b.level || a.move - b.move)
    for (const key of Object.keys(vg) as (keyof LearnsetBucket)[]) {
      if (vg[key]!.length === 0) delete (vg as any)[key]
    }
  }
  for (const k of Object.keys(byVg)) {
    if (Object.keys(byVg[k]).length === 0) delete byVg[k]
  }
  return byVg
}

function isAlreadyFetched(dexNum: number): boolean {
  const existing = result[dexNum]
  if (!existing || typeof existing !== 'object') return false
  const firstForm = Object.values(existing)[0]
  if (!firstForm) return false
  const firstVal = Object.values(firstForm)[0]
  if (!firstVal || typeof firstVal !== 'object' || Array.isArray(firstVal)) return false
  return Object.keys(firstVal).some(k => KEEP_VGS.has(k))
}

async function fetchSpecies(dexNum: number) {
  if (isAlreadyFetched(dexNum)) return

  try {
    const species = await fetchWithRetry<any>(
      `https://pokeapi.co/api/v2/pokemon-species/${dexNum}`,
    )
    if (!species) return

    const entry: Record<number, VersionGroupLearnset> = {}
    for (let i = 0; i < species.varieties.length; i++) {
      const v = species.varieties[i]
      const pokemonId = v.pokemon.url.match(/\/(\d+)\/$/)?.[1]
      if (!pokemonId) continue
      try {
        const data = await fetchWithRetry<any>(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
        )
        if (data) {
          const ls = extractLearnset(data)
          if (Object.keys(ls).length > 0) entry[i] = ls
        }
      } catch (e: any) {
        console.error(`  ✗ ${v.pokemon.name}: ${e.message}`)
      }
    }

    if (Object.keys(entry).length > 0) {
      // 优化：如果所有形态完全一样，只保留 form 0
      const base = JSON.stringify(entry[0])
      const allSame = Object.keys(entry).every(k => JSON.stringify(entry[+k]) === base)
      result[dexNum] = allSame ? { '0': entry[0] } : (entry as any)
    }
  } catch (e: any) {
    console.error(`  ✗ species ${dexNum}: ${e.message}`)
  }
}

console.log(`Fetching learnsets by version group (${FROM}~${MAX_DEX}, concurrency=${CONCURRENCY})...`)
const startTime = Date.now()

for (let i = FROM; i <= MAX_DEX; i += CONCURRENCY) {
  const batch = Array.from(
    { length: Math.min(CONCURRENCY, MAX_DEX - i + 1) },
    (_, j) => i + j,
  )
  await Promise.all(batch.map(fetchSpecies))

  const current = Math.min(i + CONCURRENCY - 1, MAX_DEX)
  const pct = Math.round((current / MAX_DEX) * 100)
  process.stdout.write(`\r  ${pct}% (${current}/${MAX_DEX})`)

  if (i % 50 < CONCURRENCY) {
    writeJson(OUT_FILE, result)
  }
}

writeJson(OUT_FILE, result)
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
console.log(`\n✅ Done! ${Object.keys(result).length} species saved (${elapsed}s)`)
