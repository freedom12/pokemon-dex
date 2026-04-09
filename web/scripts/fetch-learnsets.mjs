/**
 * 从 PokeAPI 获取宝可梦可学习招式数据
 *
 * 输出: web/public/data/learnsets.json
 * 格式: { "1": { "level-up": [{ "move": 33, "level": 1 }, ...], "machine": [10, ...], "egg": [...], "tutor": [...] }, ... }
 *
 * 用法: node scripts/fetch-learnsets.mjs
 *       node scripts/fetch-learnsets.mjs --from=500   (从第500号开始，用于断点续传)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', 'learnsets.json')

// 解析命令行参数
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FROM = parseInt(args.from) || 1
const MAX_DEX = 1025
const CONCURRENCY = 10
const RETRY = 3

// 加载已有数据（支持断点续传）
let result = {}
if (existsSync(OUT_FILE)) {
  try { result = JSON.parse(readFileSync(OUT_FILE, 'utf-8')) } catch { result = {} }
}

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

function extractLearnset(data) {
  const learnset = { 'level-up': [], machine: [], egg: [], tutor: [] }
  for (const entry of data.moves) {
    const moveId = entry.move.url.match(/\/(\d+)\/$/)?.[1]
    if (!moveId) continue
    const mid = parseInt(moveId, 10)
    for (const vg of entry.version_group_details) {
      const method = vg.move_learn_method.name
      if (method === 'level-up') {
        // 只取最新世代的升级招式（scarlet-violet 或最后一个）
        if (vg.version_group.name === 'scarlet-violet' || vg.version_group.name === 'legends-z-a') {
          learnset['level-up'].push({ move: mid, level: vg.level_learned_at })
        }
      } else if (method === 'machine') {
        if (!learnset.machine.includes(mid)) learnset.machine.push(mid)
      } else if (method === 'egg') {
        if (!learnset.egg.includes(mid)) learnset.egg.push(mid)
      } else if (method === 'tutor') {
        if (!learnset.tutor.includes(mid)) learnset.tutor.push(mid)
      }
    }
  }
  // 如果没有 scarlet-violet 的升级招式，取最新世代的
  if (learnset['level-up'].length === 0) {
    for (const entry of data.moves) {
      const moveId = entry.move.url.match(/\/(\d+)\/$/)?.[1]
      if (!moveId) continue
      const mid = parseInt(moveId, 10)
      const vgs = entry.version_group_details.filter(v => v.move_learn_method.name === 'level-up')
      if (vgs.length > 0) {
        const last = vgs[vgs.length - 1]
        const existing = learnset['level-up'].find(l => l.move === mid)
        if (!existing) {
          learnset['level-up'].push({ move: mid, level: last.level_learned_at })
        }
      }
    }
  }
  learnset['level-up'].sort((a, b) => a.level - b.level || a.move - b.move)
  return learnset
}

// 批量并发获取
async function fetchBatch(ids) {
  return Promise.all(ids.map(async (id) => {
    if (result[id]) return // 已有数据，跳过
    try {
      const data = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (data) {
        result[id] = extractLearnset(data)
      }
    } catch (e) {
      console.error(`  ✗ #${id}: ${e.message}`)
    }
  }))
}

console.log(`Fetching learnsets from PokeAPI (${FROM}~${MAX_DEX}, concurrency=${CONCURRENCY})...`)
const startTime = Date.now()

for (let i = FROM; i <= MAX_DEX; i += CONCURRENCY) {
  const batch = []
  for (let j = i; j < Math.min(i + CONCURRENCY, MAX_DEX + 1); j++) batch.push(j)
  await fetchBatch(batch)
  const pct = Math.round((Math.min(i + CONCURRENCY - 1, MAX_DEX) / MAX_DEX) * 100)
  process.stdout.write(`\r  ${pct}% (${Math.min(i + CONCURRENCY - 1, MAX_DEX)}/${MAX_DEX})`)
  // 每100个保存一次（断点续传）
  if (i % 100 < CONCURRENCY) {
    writeFileSync(OUT_FILE, JSON.stringify(result))
  }
}

writeFileSync(OUT_FILE, JSON.stringify(result))
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
console.log(`\n✅ Done! ${Object.keys(result).length} learnsets saved (${elapsed}s)`)
