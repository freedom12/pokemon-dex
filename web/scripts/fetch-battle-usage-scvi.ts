/**
 * 拉取 Pokemon HOME 朱紫（SV）对战使用率数据
 *
 * 用法: pnpm tsx scripts/fetch-battle-usage-scvi.ts
 *       pnpm tsx scripts/fetch-battle-usage-scvi.ts --force
 */
import { resolve } from 'path'
import { getDirname } from './lib/utils'
import { runBattleUsageFetch, type SeasonEntry, type GameConfig } from './lib/battle-usage'

const __dirname = getDirname(import.meta.url)
const OUT_ROOT = resolve(__dirname, '..', 'public', 'data', 'battle-usage')

const config: GameConfig = {
  game: 'scvi',
  apiPrefix: '/tt/cbd',
  soft: 'Sc',
  resourceHasGamePrefix: true,

  extractRankSeasons(listData): SeasonEntry[] {
    const all: SeasonEntry[] = []
    for (const entries of Object.values(listData.list) as any[]) {
      for (const entry of Object.values(entries) as any[]) {
        all.push({
          cId: entry.cId,
          name: entry.name,
          season: entry.season,
          rule: entry.rule,
          start: entry.start,
          end: entry.end,
          rst: entry.rst,
          ts1: entry.ts1,
          ts2: entry.ts2,
          cnt: entry.cnt,
          rankCnt: entry.rankCnt,
        })
      }
    }
    return all.sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || a.rule - b.rule)
  },

  extractInternetSeasons(internetData): SeasonEntry[] {
    const all: SeasonEntry[] = []
    for (const [cId, entry] of Object.entries(internetData.list) as [string, any][]) {
      const hasSV =
        Array.isArray(entry.soft) && (entry.soft[39] === 'Sc' || entry.soft[40] === 'Vi')
      if (!hasSV) continue
      all.push({
        cId,
        name: entry.name,
        subname: entry.subname || '',
        start: entry.start,
        end: entry.end,
        rule: entry.rule,
        cnt: entry.cnt,
        rankCnt: entry.rankCnt,
        rst: entry.rst,
        ts1: entry.ts1,
        ts2: entry.ts2,
        banner: entry.banner || '',
        tournament: entry.tournament ?? 0,
      })
    }
    return all.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  },
}

await runBattleUsageFetch(config, OUT_ROOT)
