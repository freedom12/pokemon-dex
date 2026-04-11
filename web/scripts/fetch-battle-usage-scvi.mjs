/**
 * 拉取 Pokemon HOME 朱紫（SV）对战使用率数据（级别对战 + 官方大赛）
 *
 * 数据源: Pokemon HOME 官方API
 * 输出: web/public/data/battle-usage/
 *   scvi/rankmatch.json        → 级别对战赛季列表元数据
 *   scvi/internet.json         → 官方大赛赛事列表元数据
 *   scvi/{cId}/pokemon.json    → 使用率排名列表 [{id, form}, ...]
 *   scvi/{cId}/pdetail.json    → 宝可梦详情（招式/道具/性格/搭档）
 *
 * 用法:
 *   node scripts/fetch-battle-usage-scvi.mjs
 *   node scripts/fetch-battle-usage-scvi.mjs --force   # 强制重新拉取已缓存条目
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = resolve(__dirname, '..', 'public', 'data', 'battle-usage')

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const FORCE = !!args.force
const GAME = 'scvi'

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

// ── 第一步：获取朱紫赛季列表 ──────────────────────────────────────────────
console.log('📋 获取朱紫级别对战赛季列表...')
const listRes = await fetchWithRetry(
  'https://api.battle.pokemon-home.com/tt/cbd/competition/rankmatch/list',
  { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: 'Sc' }) }
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

// 展平赛季映射：{ seasonNo: { cId: { ... } } } → 数组
const allSeasons = []
for (const [, entries] of Object.entries(listData.list)) {
  for (const entry of Object.values(entries)) {
    allSeasons.push({
      cId: entry.cId,
      name: entry.name,
      season: entry.season,
      rule: entry.rule,       // 0=单打 1=双打
      start: entry.start,
      end: entry.end,
      rst: entry.rst,         // 0=进行中 2=已结束
      ts1: entry.ts1,
      ts2: entry.ts2,
      cnt: entry.cnt,         // 对战总场数
      rankCnt: entry.rankCnt, // 上榜数
    })
  }
}
allSeasons.sort((a, b) => a.season - b.season || a.rule - b.rule)
console.log(`  找到 ${allSeasons.length} 个赛季条目（共 ${new Set(allSeasons.map(s => s.season)).size} 赛季）`)

// ── 第二步：获取朱紫官方大赛列表 ──────────────────────────────────────────────
console.log('\n📋 获取朱紫官方大赛列表...')
const internetRes = await fetchWithRetry(
  'https://api.battle.pokemon-home.com/tt/cbd/competition/internet/list',
  { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: 'Sc' }) }
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

// 展平：{ cId: {...} } → 数组，只保留有朱紫数据的赛事
const allInternetSeasons = []
for (const [cId, entry] of Object.entries(internetData.list)) {
  const hasSV = Array.isArray(entry.soft) && (entry.soft[39] === 'Sc' || entry.soft[40] === 'Vi')
  if (!hasSV) continue
  allInternetSeasons.push({
    cId,
    name: entry.name,
    subname: entry.subname || '',
    start: entry.start,
    end: entry.end,
    rule: entry.rule,       // 0=单打 1=双打
    cnt: entry.cnt,
    rankCnt: entry.rankCnt,
    rst: entry.rst,         // 0=进行中 2=已结束
    ts1: entry.ts1,
    ts2: entry.ts2,
    banner: entry.banner || '',
    tournament: entry.tournament ?? 0,
  })
}
// 按开始时间降序（最新在前）
allInternetSeasons.sort((a, b) => {
  const ta = new Date(b.start).getTime()
  const tb = new Date(a.start).getTime()
  return ta - tb
})
console.log(`  找到 ${allInternetSeasons.length} 个官方大赛（含朱紫数据）`)

// ── 第三步：逐条拉取数据 ────────────────────────────────────────────────
mkdirSync(OUT_ROOT, { recursive: true })

const ruleLabel = r => r === 0 ? '单打' : r === 1 ? '双打' : `规则${r}`

async function fetchCompetitionData(entries, labelFn) {
  for (const entry of entries) {
    const { cId, rst, ts2 } = entry
    const label = labelFn(entry)
    const dir = resolve(OUT_ROOT, GAME, cId)
    const pokemonFile = resolve(dir, 'pokemon.json')
    const pdetailFile = resolve(dir, 'pdetail.json')

    // 已结束条目如果不强制，跳过
    const isFinished = rst === 2
    if (isFinished && !FORCE && existsSync(pokemonFile) && existsSync(pdetailFile)) {
      console.log(`  ⏭  ${label} (${cId.substring(0,8)}) 已缓存，跳过`)
      continue
    }

    console.log(`\n🔄 ${label} cId=${cId.substring(0,8)}... rst=${rst}`)
    mkdirSync(dir, { recursive: true })

    // -- 使用率排名列表 --
    const pokemonUrl = `https://resource.pokemon-home.com/battledata/ranking/${GAME}/${cId}/${rst}/${ts2}/pokemon`
    const pRes = await fetchWithRetry(pokemonUrl, { headers: RESOURCE_HEADERS })
    if (!pRes) {
      console.log(`  ⚠️  pokemon 列表获取失败（${pokemonUrl}）`)
      continue
    }
    const pokemonList = await pRes.json()
    writeFileSync(pokemonFile, JSON.stringify(pokemonList))
    console.log(`  ✅ pokemon 列表: ${pokemonList.length} 条`)

    // -- 宝可梦详情（招式/道具/性格/搭档）--
    const pdetailMerged = {}
    let page = 1
    while (true) {
      const url = `https://resource.pokemon-home.com/battledata/ranking/${GAME}/${cId}/${rst}/${ts2}/pdetail-${page}`
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

    // 礼貌延迟，避免请求过快
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

// ── 第四步：写出元数据索引 ───────────────────────────────────────────────
const seasonsFile = resolve(OUT_ROOT, GAME, 'rankmatch.json')
writeFileSync(seasonsFile, JSON.stringify(allSeasons, null, 2))
console.log(`\n✅ 级别对战元数据已写入 ${seasonsFile}`)

const internetFile = resolve(OUT_ROOT, GAME, 'internet.json')
writeFileSync(internetFile, JSON.stringify(allInternetSeasons, null, 2))
console.log(`✅ 官方大赛元数据已写入 ${internetFile}`)
console.log('\n🎉 全部完成！')
