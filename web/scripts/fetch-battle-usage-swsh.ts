/**
 * 拉取 Pokemon HOME 剑盾（SwSh）对战使用率数据
 *
 * 用法: pnpm tsx scripts/fetch-battle-usage-swsh.ts
 *       pnpm tsx scripts/fetch-battle-usage-swsh.ts --force
 */
import { resolve } from 'path'
import { getDirname } from './lib/utils'
import { runBattleUsageFetch, type SeasonEntry, type GameConfig } from './lib/battle-usage'

const __dirname = getDirname(import.meta.url)
const OUT_ROOT = resolve(__dirname, '..', 'public', 'data', 'battle-usage')

const config: GameConfig = {
  game: 'swsh',
  apiPrefix: '/cbd',
  soft: 'Sw',
  resourceHasGamePrefix: false,

  extractRankSeasons(listData): SeasonEntry[] {
    const all: SeasonEntry[] = []
    for (const entries of Object.values(listData.list) as any[]) {
      for (const [numericKey, entry] of Object.entries(entries) as [string, any][]) {
        all.push({
          cId: numericKey,
          reg: entry.reg || '',
          name: entry.name,
          season: entry.season,
          rule: entry.rule,
          start: entry.start,
          end: entry.end,
          rst: entry.rst,
          ts1: entry.ts1,
          ts2: entry.ts2,
          cnt: entry.cnt,
        })
      }
    }
    return all.sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || a.rule - b.rule)
  },

  extractInternetSeasons(internetData): SeasonEntry[] {
    const all: SeasonEntry[] = []
    const inner = internetData.list?.list ?? internetData.list
    if (!inner || typeof inner !== 'object') return all
    for (const [numericKey, entry] of Object.entries(inner) as [string, any][]) {
      if (!entry?.name) continue
      all.push({
        cId: numericKey,
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
    return all.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  },
}

await runBattleUsageFetch(config, OUT_ROOT)
