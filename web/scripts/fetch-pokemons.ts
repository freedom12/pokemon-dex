/**
 * 从 PokeAPI 拉取完整的原始宝可梦数据（species + 各形态 pokemon）
 *
 * 输出: web/scripts/cache/_pokeapi_pokemons.json
 * 格式: { [dexNum]: { species: {...}, varieties: [ { pokemon: {...} }, ... ] } }
 * 存储 PokeAPI 返回的完整原始 JSON，不做任何字段筛选或转换。
 * 数据的映射和转换统一在 build-data.ts 中完成。
 *
 * 用法: pnpm tsx scripts/fetch-pokemons.ts
 *       pnpm tsx scripts/fetch-pokemons.ts --from=500
 *       pnpm tsx scripts/fetch-pokemons.ts --max=1025
 */
import { resolve } from 'path'
import { existsSync } from 'fs'
import { fetchWithRetry, parseArgs, writeJson, readJson, getDirname, sleep } from './lib/utils'

const __dirname = getDirname(import.meta.url)
const OUT_FILE = resolve(__dirname, 'cache', '_pokeapi_pokemons.json')

const args = parseArgs()
const FROM = parseInt(args.from as string) || 1
const MAX = parseInt(args.max as string) || 1025
const CONCURRENCY = 3

// 加载已有缓存（支持增量拉取）
const result: Record<string, any> = existsSync(OUT_FILE)
  ? (readJson<Record<string, any>>(OUT_FILE) ?? {})
  : {}

let done = 0
let fetched = 0
let skipped = 0
let failed = 0
const total = MAX - FROM + 1
const startedAt = Date.now()
const elapsed = () => ((Date.now() - startedAt) / 1000).toFixed(1)

function logProgress(dexNum: number, note = '') {
  if (done % 10 !== 0 && done !== total) return
  const pct = Math.round((done / total) * 100)
  console.log(
    `  ${done}/${total} (${pct}%) - #${dexNum}${note ? ` ${note}` : ''} - ${elapsed()}s`,
  )
}

async function fetchSpecies(dexNum: number) {
  // 跳过已缓存的
  if (result[dexNum]?.species && result[dexNum]?.varieties?.length > 0) {
    skipped++
    done++
    logProgress(dexNum, '(缓存)')
    return
  }

  try {
    const species = await fetchWithRetry<any>(
      `https://pokeapi.co/api/v2/pokemon-species/${dexNum}`,
    )
    if (!species) {
      failed++
      done++
      logProgress(dexNum, '(未找到)')
      return
    }

    const varieties: any[] = []
    for (const v of species.varieties) {
      const pokemonId = v.pokemon.url.match(/\/(\d+)\/$/)?.[1]
      if (!pokemonId) continue
      try {
        const pokemon = await fetchWithRetry<any>(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
        )
        if (pokemon) {
          varieties.push(pokemon)
        }
      } catch (e: any) {
        console.warn(`  ⚠️ ${v.pokemon.name}: ${e.message}`)
      }
    }

    result[dexNum] = { species, varieties }
    fetched++
  } catch (e: any) {
    failed++
    console.warn(`  ⚠️ species ${dexNum}: ${e.message}`)
  }

  done++
  logProgress(dexNum)
}

console.log(
  `📋 拉取 PokeAPI 宝可梦 species ${FROM}~${MAX}，共 ${total} 个（并发 ${CONCURRENCY}）`,
)
console.log(`   输出: ${OUT_FILE}`)

for (let i = FROM; i <= MAX; i += CONCURRENCY) {
  const batch = Array.from(
    { length: Math.min(CONCURRENCY, MAX - i + 1) },
    (_, j) => i + j,
  )
  await Promise.all(batch.map(fetchSpecies))

  // 每 50 个保存一次（防止中断丢失）
  if (done % 50 < CONCURRENCY) {
    writeJson(OUT_FILE, result)
    console.log(`  💾 已保存进度：${Object.keys(result).length} 个 species`)
  }

  if (i + CONCURRENCY <= MAX) await sleep(200)
}

writeJson(OUT_FILE, result)
console.log(`\n✅ 已写入 ${OUT_FILE}`)
console.log(
  `   共 ${Object.keys(result).length} 个 species；新拉取 ${fetched}，跳过缓存 ${skipped}，失败 ${failed}，耗时 ${elapsed()}s`,
)
