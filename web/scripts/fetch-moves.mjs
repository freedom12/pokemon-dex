/**
 * 从 PokeAPI 获取招式详细数据（威力、命中、PP 等）
 *
 * 输出: web/public/data/moves.json（合并到现有全局 moves.json）
 * 新增字段: power, accuracy, pp, priority, effectChance, target
 *
 * 用法: node scripts/fetch-moves.mjs
 *       node scripts/fetch-moves.mjs --from=500
 *       node scripts/fetch-moves.mjs --force   # 强制重新拉取
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', 'moves.json')

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FROM = parseInt(args.from) || 1
const FORCE = !!args.force
const CONCURRENCY = 5
const RETRY = 3

// 读取现有 moves.json
let existing = []
if (existsSync(OUT_FILE)) {
  try { existing = JSON.parse(readFileSync(OUT_FILE, 'utf-8')) } catch { existing = [] }
}
const existingMap = Object.fromEntries(existing.map(m => [m.id, m]))

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

// 从 WZ0001 格式提取数字 ID
function wzToNum(id) {
  return parseInt(id.replace(/\D/g, ''), 10)
}

// 数字 ID 转 WZ 格式
function numToWz(n) {
  return `WZ${String(n).padStart(4, '0')}`
}

// 获取需要拉取的招式 ID 列表
const maxMoveId = existing.length > 0
  ? Math.max(...existing.map(m => wzToNum(m.id)))
  : 919 // PokeAPI 当前最大招式 ID 约 919

const toFetch = []
for (let i = FROM; i <= maxMoveId; i++) {
  const wz = numToWz(i)
  const cur = existingMap[wz]
  // 跳过已有详细数据的（除非 --force）
  if (!FORCE && cur && cur.power !== undefined) continue
  toFetch.push(i)
}

console.log(`📋 需要拉取 ${toFetch.length} 个招式 (ID ${FROM}~${maxMoveId})`)
if (toFetch.length === 0) {
  console.log('✅ 所有招式数据已是最新')
  process.exit(0)
}

// 并发拉取
let done = 0
async function fetchMove(moveId) {
  const data = await fetchWithRetry(`https://pokeapi.co/api/v2/move/${moveId}`)
  if (!data) return null

  done++
  if (done % 50 === 0 || done === toFetch.length) {
    console.log(`  ${done}/${toFetch.length}`)
  }

  return {
    pokeApiId: moveId,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    priority: data.priority ?? 0,
    effectChance: data.effect_chance,
    target: data.target?.name || '',
  }
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
    // 避免请求过快
    if (i + concurrency < ids.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }
  return results
}

const results = await runBatch(toFetch, CONCURRENCY)

// 合并到现有数据
const pokeApiMap = {}
for (const r of results) {
  if (!r) continue
  pokeApiMap[r.pokeApiId] = r
}

const merged = existing.map(m => {
  const num = wzToNum(m.id)
  const api = pokeApiMap[num]
  if (!api) return m
  return {
    ...m,
    power: api.power,
    accuracy: api.accuracy,
    pp: api.pp,
    priority: api.priority,
    effectChance: api.effectChance,
    target: api.target,
  }
})

writeFileSync(OUT_FILE, JSON.stringify(merged))
console.log(`✅ 已写入 ${OUT_FILE}`)
console.log(`   共 ${merged.length} 个招式，其中 ${results.filter(Boolean).length} 个已更新 PokeAPI 数据`)
