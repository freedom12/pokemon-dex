/**
 * 从 PokeAPI 获取宝可梦可学习招式数据（含不同形态 + 按版本分组）
 *
 * 输出: web/public/data/learnsets.json
 * 格式: {
 *   "<dexNum>": {
 *     "<formIndex>": {
 *       "<versionGroup>": {
 *         "level-up": [{ "move": 33, "level": 1 }, ...],
 *         "machine": [10, ...],
 *         "egg": [100, ...],
 *         "tutor": [200, ...]
 *       }, ...
 *     }, ...
 *   }, ...
 * }
 *
 * 用法: node scripts/fetch-learnsets.mjs
 *       node scripts/fetch-learnsets.mjs --from=500
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '..', 'public', 'data', 'learnsets.json')

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FROM = parseInt(args.from) || 1
const MAX_DEX = 1025
const CONCURRENCY = 5
const RETRY = 3

// 只保留这些版本组（覆盖主流世代，去掉日版/旁支）
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
  'the-isle-of-armor', 'the-crown-tundra',
  'brilliant-diamond-shining-pearl',
  'legends-arceus',
  'scarlet-violet',
  'the-teal-mask', 'the-indigo-disk',
  'legends-za',
  'mega-dimension',
])

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
  // 按版本组分组
  const byVg = {}
  for (const entry of data.moves) {
    const moveId = entry.move.url.match(/\/(\d+)\/$/)?.[1]
    if (!moveId) continue
    const mid = parseInt(moveId, 10)
    for (const vg of entry.version_group_details) {
      const vgName = vg.version_group.name
      if (!KEEP_VGS.has(vgName)) continue
      if (!byVg[vgName]) byVg[vgName] = { 'level-up': [], machine: [], egg: [], tutor: [] }
      const bucket = byVg[vgName]
      const method = vg.move_learn_method.name
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
  // 排序 level-up，清理空数组
  for (const vg of Object.values(byVg)) {
    vg['level-up'].sort((a, b) => a.level - b.level || a.move - b.move)
    for (const key of Object.keys(vg)) {
      if (vg[key].length === 0) delete vg[key]
    }
  }
  // 清理空版本组
  for (const k of Object.keys(byVg)) {
    if (Object.keys(byVg[k]).length === 0) delete byVg[k]
  }
  return byVg
}

async function fetchSpecies(dexNum) {
  if (result[dexNum] && typeof result[dexNum] === 'object') {
    // 检查是否已经是新格式（三层嵌套）
    const firstForm = Object.values(result[dexNum])[0]
    if (firstForm) {
      const firstVal = Object.values(firstForm)[0]
      // 新格式: firstVal 是一个含 level-up/machine 等 key 的对象，且 key 是版本组名
      if (firstVal && typeof firstVal === 'object' && !Array.isArray(firstVal) && !firstVal.move) {
        const keys = Object.keys(firstVal)
        if (keys.some(k => KEEP_VGS.has(k) || k === 'level-up' || k === 'machine')) {
          // 如果 key 是版本组名，说明已经是新格式
          if (keys.some(k => KEEP_VGS.has(k))) return
        }
      }
    }
  }

  try {
    const species = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${dexNum}`)
    if (!species) return

    const entry = {}
    for (let i = 0; i < species.varieties.length; i++) {
      const v = species.varieties[i]
      const pokemonId = v.pokemon.url.match(/\/(\d+)\/$/)?.[1]
      if (!pokemonId) continue
      try {
        const data = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        if (data) {
          const ls = extractLearnset(data)
          if (Object.keys(ls).length > 0) {
            entry[i] = ls
          }
        }
      } catch (e) {
        console.error(`  ✗ ${v.pokemon.name}: ${e.message}`)
      }
    }

    if (Object.keys(entry).length > 0) {
      // 优化：如果所有形态完全一样，只保留 form 0
      const base = JSON.stringify(entry[0])
      const allSame = Object.keys(entry).every(k => JSON.stringify(entry[k]) === base)
      if (allSame) {
        result[dexNum] = { '0': entry[0] }
      } else {
        result[dexNum] = entry
      }
    }
  } catch (e) {
    console.error(`  ✗ species ${dexNum}: ${e.message}`)
  }
}

console.log(`Fetching learnsets by version group (${FROM}~${MAX_DEX}, concurrency=${CONCURRENCY})...`)
const startTime = Date.now()

for (let i = FROM; i <= MAX_DEX; i += CONCURRENCY) {
  const batch = []
  for (let j = i; j < Math.min(i + CONCURRENCY, MAX_DEX + 1); j++) batch.push(j)
  await Promise.all(batch.map(fetchSpecies))
  const pct = Math.round((Math.min(i + CONCURRENCY - 1, MAX_DEX) / MAX_DEX) * 100)
  process.stdout.write(`\r  ${pct}% (${Math.min(i + CONCURRENCY - 1, MAX_DEX)}/${MAX_DEX})`)
  if (i % 50 < CONCURRENCY) {
    writeFileSync(OUT_FILE, JSON.stringify(result))
  }
}

writeFileSync(OUT_FILE, JSON.stringify(result))
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
console.log(`\n✅ Done! ${Object.keys(result).length} species saved (${elapsed}s)`)
