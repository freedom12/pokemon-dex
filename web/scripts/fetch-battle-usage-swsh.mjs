/**
 * 拉取 Pokemon HOME 剑盾（SwSh）对战使用率数据（级别对战 + 官方大赛）
 *
 * 与朱紫的主要差异：
 *   - 列表接口: /cbd/... (无 /tt/ 前缀)
 *   - 标识符: 列表 map 的数字 key（而非 UUID cId）
 *   - 资源URL: ranking/{numericKey}/{rst}/{ts2}/pokemon（无游戏名前缀）
 *   - 级别对战 entry 无 cId 字段，有 reg 字段
 *
 * 数据源: Pokemon HOME 官方API
 * 输出: web/public/data/battle-usage/
 *   swsh/rankmatch.json        → 级别对战赛季列表元数据
 *   swsh/internet.json         → 官方大赛赛事列表元数据
 *   swsh/{id}/pokemon.json     → 使用率排名列表
 *   swsh/{id}/pdetail.json     → 宝可梦详情（招式/道具/性格/搭档）
 *
 * 用法:
 *   node scripts/fetch-battle-usage-swsh.mjs
 *   node scripts/fetch-battle-usage-swsh.mjs --force   # 强制重新拉取已缓存条目
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = resolve(__dirname, '..', 'public', 'data', 'battle-usage')
const GAME = 'swsh'

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FORCE = !!args.force

const RESOURCE_HEADERS = {
  'accept': '*/*',
  'user-agent': 'PokeDex Ch/2.8.4 (com.Rox.PokeDexCh; build:1; iOS 26.4.0) Alamofire/5.4.3',
  'accept-language': 'zh-Hans-CN;q=1.0, zh-Hant-CN;q=0.9',
}

const API_HEADERS = {
  'content-type': 'application/json',
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'langcode': '9',
  'authorization': 'Bearer',
  'countrycode': '302',
  'origin': 'https://resource.pokemon-home.com',
  'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  'referer': 'https://resource.pokemon-home.com/',
  'accept-language': 'zh-CN,zh-Hans;q=0.9',
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 403 || res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return res
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

const ruleLabel = r => r === 0 ? '单打' : r === 1 ? '双打' : `规则${r}`

// ── 第一步：获取剑盾级别对战赛季列表 ──────────────────────────────────────
console.log('📋 获取剑盾级别对战赛季列表...')
const listRes = await fetchWithRetry(
  'https://api.battle.pokemon-home.com/cbd/competition/rankmatch/list',
  { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: 'Sw' }) }
)
if (!listRes) {
  console.error('❌ 无法获取赛季列表')
  process.exit(1)
}
const listData = await listRes.json()
if (listData.code !== 200) {
  console.error('❌ API 返回错误:', listData)
  process.exit(1)
}

// 展平赛季映射：{ seasonNo: { numericKey: entry } } → 数组
// numericKey（如 10011）即为资源URL中使用的 ID
const allSeasons = []
for (const [, entries] of Object.entries(listData.list)) {
  for (const [numericKey, entry] of Object.entries(entries)) {
    allSeasons.push({
      cId: numericKey,           // 统一用 cId 字段存储，兼容 UI
      reg: entry.reg || '',
      name: entry.name,
      season: entry.season,
      rule: entry.rule,          // 0=单打 1=双打
      start: entry.start,
      end: entry.end,
      rst: entry.rst,            // 0=进行中 2=已结束
      ts1: entry.ts1,
      ts2: entry.ts2,
      cnt: entry.cnt,
    })
  }
}
allSeasons.sort((a, b) => a.season - b.season || a.rule - b.rule)
console.log(`  找到 ${allSeasons.length} 个赛季条目（共 ${new Set(allSeasons.map(s => s.season)).size} 赛季）`)

// ── 第二步：获取剑盾官方大赛列表 ──────────────────────────────────────────
console.log('\n📋 获取剑盾官方大赛列表...')
const internetRes = await fetchWithRetry(
  'https://api.battle.pokemon-home.com/cbd/competition/internet/list',
  { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: 'Sw' }) }
)
if (!internetRes) {
  console.error('❌ 无法获取官方大赛列表')
  process.exit(1)
}
const internetData = await internetRes.json()
if (internetData.code !== 200) {
  console.error('❌ 官方大赛 API 返回错误:', internetData)
  process.exit(1)
}

// 展平：{ numericKey: entry } → 数组
const allInternetSeasons = []
if (internetData.list && typeof internetData.list === 'object') {
  for (const [numericKey, entry] of Object.entries(internetData.list)) {
    allInternetSeasons.push({
      cId: numericKey,           // 统一用 cId 字段存储
      name: entry.name,
      subname: entry.subname || '',
      start: entry.start,
      end: entry.end,
      rule: entry.rule,
      cnt: entry.cnt,
      rst: entry.rst,
      ts1: entry.ts1,
      ts2: entry.ts2,
      banner: entry.banner || '',
    })
  }
}
// 按开始时间降序（最新在前）
allInternetSeasons.sort((a, b) => new Date(b.start) - new Date(a.start))
console.log(`  找到 ${allInternetSeasons.length} 个官方大赛`)

// ── 第三步：逐条拉取使用率数据 ─────────────────────────────────────────────
mkdirSync(resolve(OUT_ROOT, GAME), { recursive: true })

async function fetchCompetitionData(entries, labelFn) {
  for (const entry of entries) {
    const { cId, rst, ts2 } = entry
    const label = labelFn(entry)
    const dir = resolve(OUT_ROOT, GAME, cId)
    const pokemonFile = resolve(dir, 'pokemon.json')
    const pdetailFile = resolve(dir, 'pdetail.json')

    const isFinished = rst === 2
    if (isFinished && !FORCE && existsSync(pokemonFile) && existsSync(pdetailFile)) {
      console.log(`  ⏭  ${label} (${cId}) 已缓存，跳过`)
      continue
    }

    console.log(`\n🔄 ${label} id=${cId} rst=${rst}`)
    mkdirSync(dir, { recursive: true })

    // 资源URL：无游戏名前缀，直接用数字 id
    const pokemonUrl = `https://resource.pokemon-home.com/battledata/ranking/${cId}/${rst}/${ts2}/pokemon`
    const pRes = await fetchWithRetry(pokemonUrl, { headers: RESOURCE_HEADERS })
    if (!pRes) {
      console.log(`  ⚠️  pokemon 列表获取失败（${pokemonUrl}）`)
      continue
    }
    const pokemonList = await pRes.json()
    writeFileSync(pokemonFile, JSON.stringify(pokemonList))
    console.log(`  ✅ pokemon 列表: ${pokemonList.length} 条`)

    // 宝可梦详情（分页合并）
    const pdetailMerged = {}
    let page = 1
    while (true) {
      const url = `https://resource.pokemon-home.com/battledata/ranking/${cId}/${rst}/${ts2}/pdetail-${page}`
      const r = await fetchWithRetry(url, { headers: RESOURCE_HEADERS })
      if (!r) break
      const pageData = await r.json()
      const count = Object.keys(pageData).length
      for (const [pid, forms] of Object.entries(pageData)) {
        if (!pdetailMerged[pid]) pdetailMerged[pid] = {}
        Object.assign(pdetailMerged[pid], forms)
      }
      console.log(`  📄 pdetail-${page}: ${count} 个宝可梦`)
      page++
    }
    writeFileSync(pdetailFile, JSON.stringify(pdetailMerged))
    console.log(`  ✅ pdetail 合并完成: ${Object.keys(pdetailMerged).length} 个宝可梦`)

    await new Promise(r => setTimeout(r, 300))
  }
}

console.log('\n═══ 级别对战数据 ═══')
await fetchCompetitionData(
  allSeasons,
  s => `S${s.season} ${ruleLabel(s.rule)} [${s.name}]`
)

console.log('\n═══ 官方大赛数据 ═══')
await fetchCompetitionData(
  allInternetSeasons,
  s => `${s.name}${s.subname ? ' ' + s.subname : ''} ${ruleLabel(s.rule)}`
)

// ── 第四步：写出元数据索引 ────────────────────────────────────────────────
const seasonsFile = resolve(OUT_ROOT, GAME, 'rankmatch.json')
writeFileSync(seasonsFile, JSON.stringify(allSeasons, null, 2))
console.log(`\n✅ 级别对战元数据已写入 ${seasonsFile}`)

const internetFile = resolve(OUT_ROOT, GAME, 'internet.json')
writeFileSync(internetFile, JSON.stringify(allInternetSeasons, null, 2))
console.log(`✅ 官方大赛元数据已写入 ${internetFile}`)
console.log('\n🎉 全部完成！')
