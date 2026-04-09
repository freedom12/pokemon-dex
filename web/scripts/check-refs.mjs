import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const md = resolve(__dirname, '..', '..', 'madatsubomi', 'Master Data')

const targets = [
  'trainermemo', 'sp_ach', 'sp_achstep', 'sp_medal', 'sp_memory',
  'sp_trade', 'sp_friend', 'sp_mystery', 'sp_oak', 'sp_plan',
  'sp_country', 'sp_monbo', 'sp_contentinfo', 'sp_sealcategory',
  'sp_softwaredictionary', 'sp_playerlog', 'sp_migration', 'sp_api',
  'sp_option', 'sp_languageconfirm', 'sp_labelcolor',
  'place_name_out', 'place_name_spe'
]

const files = readdirSync(md).filter(f => f.endsWith('.json'))
const result = {}

for (const f of files) {
  const raw = readFileSync(resolve(md, f), 'utf-8')
  for (const t of targets) {
    if (raw.includes(t)) {
      if (!result[t]) result[t] = []
      result[t].push(f)
    }
  }
}

for (const [k, v] of Object.entries(result).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${k}: ${v.join(', ')}`)
}
