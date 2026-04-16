/**
 * Pokemon HOME 对战使用率数据拉取 — 公共逻辑
 *
 * 朱紫 (scvi) 和剑盾 (swsh) 共用此模块，仅在 API 路径和少量字段上有差异。
 */
import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { fetchRawWithRetry, fetchWithRetry, writeJson, sleep, parseArgs } from './utils'

// ── 类型 ──

export interface SeasonEntry {
  cId: string
  name: string
  season?: number
  reg?: string
  subname?: string
  rule: number
  start: string
  end: string
  rst: number
  ts1: number
  ts2: number
  cnt?: number
  rankCnt?: number
  banner?: string
  tournament?: number
}

export interface GameConfig {
  /** 游戏标识: 'scvi' | 'swsh' */
  game: string
  /** 列表 API 前缀: '/tt/cbd' (scvi) 或 '/cbd' (swsh) */
  apiPrefix: string
  /** 列表请求 soft 参数: 'Sc' | 'Sw' */
  soft: string
  /** 资源 URL 是否包含游戏名前缀 */
  resourceHasGamePrefix: boolean
  /** 判断官方大赛条目是否属于本游戏 */
  filterInternet?: (entry: any) => boolean
  /** 从列表 API 响应中提取级别对战条目 */
  extractRankSeasons: (listData: any) => SeasonEntry[]
  /** 从列表 API 响应中提取官方大赛条目 */
  extractInternetSeasons: (listData: any) => SeasonEntry[]
}

// ── 公共 Headers ──

const RESOURCE_HEADERS: Record<string, string> = {
  accept: '*/*',
  'user-agent':
    'PokeDex Ch/2.8.4 (com.Rox.PokeDexCh; build:1; iOS 26.4.0) Alamofire/5.4.3',
  'accept-language': 'zh-Hans-CN;q=1.0, zh-Hant-CN;q=0.9',
}

const API_HEADERS: Record<string, string> = {
  'content-type': 'application/json',
  accept: 'application/json, text/javascript, */*; q=0.01',
  langcode: '9',
  authorization: 'Bearer',
  countrycode: '302',
  origin: 'https://resource.pokemon-home.com',
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  referer: 'https://resource.pokemon-home.com/',
  'accept-language': 'zh-CN,zh-Hans;q=0.9',
}

const API_BASE = 'https://api.battle.pokemon-home.com'
const RESOURCE_BASE = 'https://resource.pokemon-home.com/battledata/ranking'

// ── 核心拉取逻辑 ──

const ruleLabel = (r: number) => (r === 0 ? '单打' : r === 1 ? '双打' : `规则${r}`)

async function fetchCompetitionData(
  entries: SeasonEntry[],
  outRoot: string,
  game: string,
  resourceHasGamePrefix: boolean,
  force: boolean,
  labelFn: (e: SeasonEntry) => string,
) {
  for (const entry of entries) {
    const { cId, rst, ts2 } = entry
    const label = labelFn(entry)
    const dir = resolve(outRoot, game, cId)
    const pokemonFile = resolve(dir, 'pokemon.json')
    const pdetailFile = resolve(dir, 'pdetail.json')

    if (rst === 2 && !force && existsSync(pokemonFile) && existsSync(pdetailFile)) {
      console.log(`  ⏭  ${label} (${cId.substring(0, 8)}) 已缓存，跳过`)
      continue
    }

    console.log(`\n🔄 ${label} cId=${cId.substring(0, 8)}... rst=${rst}`)
    mkdirSync(dir, { recursive: true })

    // 使用率排名列表
    const prefix = resourceHasGamePrefix ? `${game}/${cId}` : cId
    const pokemonUrl = `${RESOURCE_BASE}/${prefix}/${rst}/${ts2}/pokemon`
    const pokemonList = await fetchWithRetry<any[]>(pokemonUrl, { headers: RESOURCE_HEADERS })
    if (!pokemonList) {
      console.log(`  ⚠️  pokemon 列表获取失败（${pokemonUrl}）`)
      continue
    }
    writeJson(pokemonFile, pokemonList)
    console.log(`  ✅ pokemon 列表: ${pokemonList.length} 条`)

    // 宝可梦详情（分页合并）
    const pdetailMerged: Record<string, Record<string, unknown>> = {}
    let page = 1
    while (true) {
      const url = `${RESOURCE_BASE}/${prefix}/${rst}/${ts2}/pdetail-${page}`
      const raw = await fetchRawWithRetry(url, { headers: RESOURCE_HEADERS })
      if (!raw) break
      const pageData = (await raw.json()) as Record<string, Record<string, unknown>>
      const count = Object.keys(pageData).length
      for (const [pid, forms] of Object.entries(pageData)) {
        if (!pdetailMerged[pid]) pdetailMerged[pid] = {}
        Object.assign(pdetailMerged[pid], forms)
      }
      console.log(`  📄 pdetail-${page}: ${count} 个宝可梦`)
      page++
    }
    writeJson(pdetailFile, pdetailMerged)
    console.log(`  ✅ pdetail 合并完成: ${Object.keys(pdetailMerged).length} 个宝可梦`)

    await sleep(300)
  }
}

// ── 主入口 ──

export async function runBattleUsageFetch(config: GameConfig, outRoot: string) {
  const args = parseArgs()
  const force = !!args.force

  // 1. 级别对战赛季列表
  console.log(`📋 获取${config.game}级别对战赛季列表...`)
  const listData = await fetchWithRetry<any>(
    `${API_BASE}${config.apiPrefix}/competition/rankmatch/list`,
    { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: config.soft }) },
  )
  if (!listData || listData.code !== 200) {
    console.error('❌ 无法获取赛季列表', listData)
    process.exit(1)
  }
  const allSeasons = config.extractRankSeasons(listData)
  console.log(
    `  找到 ${allSeasons.length} 个赛季条目（共 ${new Set(allSeasons.map(s => s.season)).size} 赛季）`,
  )

  // 2. 官方大赛列表
  console.log(`\n📋 获取${config.game}官方大赛列表...`)
  const internetData = await fetchWithRetry<any>(
    `${API_BASE}${config.apiPrefix}/competition/internet/list`,
    { method: 'POST', headers: API_HEADERS, body: JSON.stringify({ soft: config.soft }) },
  )
  if (!internetData || internetData.code !== 200) {
    console.error('❌ 官方大赛 API 返回错误', internetData)
    process.exit(1)
  }
  const allInternetSeasons = config.extractInternetSeasons(internetData)
  console.log(`  找到 ${allInternetSeasons.length} 个官方大赛`)

  // 3. 拉取数据
  mkdirSync(outRoot, { recursive: true })

  console.log('\n═══ 级别对战数据 ═══')
  await fetchCompetitionData(
    allSeasons,
    outRoot,
    config.game,
    config.resourceHasGamePrefix,
    force,
    s => `S${s.season} ${ruleLabel(s.rule)} [${s.name}]`,
  )

  console.log('\n═══ 官方大赛数据 ═══')
  await fetchCompetitionData(
    allInternetSeasons,
    outRoot,
    config.game,
    config.resourceHasGamePrefix,
    force,
    s => `${s.name}${s.subname ? ' ' + s.subname : ''} ${ruleLabel(s.rule)}`,
  )

  // 4. 写出元数据索引
  const seasonsFile = resolve(outRoot, config.game, 'rankmatch.json')
  writeJson(seasonsFile, allSeasons, true)
  console.log(`\n✅ 级别对战元数据已写入 ${seasonsFile}`)

  const internetFile = resolve(outRoot, config.game, 'internet.json')
  writeJson(internetFile, allInternetSeasons, true)
  console.log(`✅ 官方大赛元数据已写入 ${internetFile}`)
  console.log('\n🎉 全部完成！')
}
