/**
 * 从 PokeAPI 拉取完整的原始招式数据
 *
 * 输出: web/public/data/_pokeapi_moves.json
 * 存储 PokeAPI 返回的完整原始 JSON，不做任何字段筛选或转换。
 * 数据的映射和转换统一在 build-data.mjs 中完成。
 *
 * 用法: node scripts/fetch-moves.mjs
 *       node scripts/fetch-moves.mjs --from=500
 *       node scripts/fetch-moves.mjs --max=920
 */
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', '_pokeapi_moves.json')

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FROM = parseInt(args.from) || 1
const MAX = parseInt(args.max) || 1000
const CONCURRENCY = 5
const RETRY = 3

async function fetchWithRetry(url, retries = RETRY) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

const toFetch = []
for (let i = FROM; i <= MAX; i++) toFetch.push(i)

console.log(`📋 拉取 PokeAPI 招式 ID ${FROM}~${MAX}，共 ${toFetch.length} 个`)

let done = 0
async function fetchMove(moveId) {
  const data = await fetchWithRetry(`https://pokeapi.co/api/v2/move/${moveId}`)
  done++
  if (done % 50 === 0 || done === toFetch.length) {
    console.log(`  ${done}/${toFetch.length}`)
  }
  return data // 原样返回，不做任何转换
}

async function runBatch(ids, concurrency) {
  const results = []
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(id => fetchMove(id).catch(e => {
      console.warn(`⚠️ 招式 ${id} 拉取失败: ${e.message}`)
      return null
    })))
    results.push(...batchResults)
    if (i + concurrency < ids.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }
  return results
}

const results = (await runBatch(toFetch, CONCURRENCY)).filter(Boolean)

writeFileSync(OUT_FILE, JSON.stringify(results))
console.log(`✅ 已写入 ${OUT_FILE}`)
console.log(`   共 ${results.length} 个招式的完整 PokeAPI 原始数据`)
