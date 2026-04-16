/**
 * 从 PokeAPI 拉取完整的原始道具数据
 *
 * 输出: web/public/data/_pokeapi_items.json
 * 存储 PokeAPI 返回的完整原始 JSON，不做任何字段筛选或转换。
 * 数据的映射和转换统一在 build-data.ts 中完成。
 *
 * 用法: pnpm tsx scripts/fetch-items.ts
 *       pnpm tsx scripts/fetch-items.ts --from=500
 *       pnpm tsx scripts/fetch-items.ts --max=2200
 */
import { resolve } from 'path'
import { fetchWithRetry, parseArgs, runBatch, writeJson, getDirname } from './lib/utils'

const __dirname = getDirname(import.meta.url)
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', '_pokeapi_items.json')

const args = parseArgs()
const FROM = parseInt(args.from as string) || 1
const MAX = parseInt(args.max as string) || 3000
const CONCURRENCY = 5

const ids = Array.from({ length: MAX - FROM + 1 }, (_, i) => FROM + i)
console.log(`📋 拉取 PokeAPI 道具 ID ${FROM}~${MAX}，共 ${ids.length} 个`)

let done = 0
async function fetchItem(itemId: number) {
  const data = await fetchWithRetry(`https://pokeapi.co/api/v2/item/${itemId}`)
  done++
  if (done % 50 === 0 || done === ids.length) {
    console.log(`  ${done}/${ids.length}`)
  }
  return data
}

const results = (
  await runBatch(ids, CONCURRENCY, id =>
    fetchItem(id).catch(e => {
      console.warn(`⚠️ 道具 ${id} 拉取失败: ${(e as Error).message}`)
      return null
    }),
  )
).filter(Boolean)

writeJson(OUT_FILE, results)
console.log(`✅ 已写入 ${OUT_FILE}`)
console.log(`   共 ${results.length} 个道具的完整 PokeAPI 原始数据`)
