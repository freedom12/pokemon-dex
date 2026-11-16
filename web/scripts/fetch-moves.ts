/**
 * 从 PokeAPI 拉取完整的原始招式数据
 *
 * 输出: web/scripts/cache/_pokeapi_moves.json
 * 存储 PokeAPI 返回的完整原始 JSON，不做任何字段筛选或转换。
 * 数据的映射和转换统一在 build-data.ts 中完成。
 *
 * 用法: pnpm tsx scripts/fetch-moves.ts
 *       pnpm tsx scripts/fetch-moves.ts --from=500
 *       pnpm tsx scripts/fetch-moves.ts --max=920
 */
import { resolve } from 'path'
import { fetchWithRetry, parseArgs, runBatch, writeJson, getDirname } from './lib/utils'

const __dirname = getDirname(import.meta.url)
const OUT_FILE = resolve(__dirname, 'cache', '_pokeapi_moves.json')

const args = parseArgs()
const FROM = parseInt(args.from as string) || 1
const MAX = parseInt(args.max as string) || 1000
const CONCURRENCY = 5

const ids = Array.from({ length: MAX - FROM + 1 }, (_, i) => FROM + i)
const startedAt = Date.now()
const elapsed = () => ((Date.now() - startedAt) / 1000).toFixed(1)
console.log(
  `📋 拉取 PokeAPI 招式 ID ${FROM}~${MAX}，共 ${ids.length} 个（并发 ${CONCURRENCY}）`,
)
console.log(`   输出: ${OUT_FILE}`)

let done = 0
let notFound = 0
let failed = 0
async function fetchMove(moveId: number) {
  return fetchWithRetry(`https://pokeapi.co/api/v2/move/${moveId}`)
}

const results = (
  await runBatch(ids, CONCURRENCY, id =>
    fetchMove(id)
      .then(data => {
        if (!data) notFound++
        return data
      })
      .catch(e => {
        failed++
        console.warn(`⚠️ 招式 ${id} 拉取失败: ${(e as Error).message}`)
        return null
      })
      .finally(() => {
        done++
        if (done % 50 === 0 || done === ids.length) {
          const pct = ((done / ids.length) * 100).toFixed(1)
          console.log(`  ${done}/${ids.length} (${pct}%) - ${elapsed()}s`)
        }
      }),
  )
).filter(Boolean)

writeJson(OUT_FILE, results)
console.log(`✅ 已写入 ${OUT_FILE}`)
console.log(
  `   成功 ${results.length} 个，未找到 ${notFound} 个，失败 ${failed} 个，耗时 ${elapsed()}s`,
)
