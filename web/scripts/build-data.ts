/**
 * 数据预处理脚本 - 多语言版
 * 为每种语言生成一套聚合 JSON
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { fetchWithRetry, writeJson, readJson, getDirname } from './lib/utils'

const __dirname = getDirname(import.meta.url)
const ROOT = resolve(__dirname, '..', '..')

// ── 获取宝可梦图鉴 API 图片数据 ──
async function fetchZukanImages() {
  const CACHE = resolve(__dirname, '..', 'public', 'data', '_zukan_cache.json')
  if (existsSync(CACHE)) {
    console.log('Using cached zukan API data')
    return readJson<any[]>(CACHE)!
  }
  console.log('Fetching zukan API...')
  const data = await fetchWithRetry<any>(
    'https://zukan.pokemon.co.jp/zukan-api/api/search/?limit=2000&page=1',
  )
  writeJson(CACHE, data!.results)
  console.log(`Fetched ${data!.results.length} zukan entries`)
  return data!.results as any[]
}

const zukanList = await fetchZukanImages()


const specialZukanKeyMap: Record<string, string> = {
  DI0201000: '', DI0201001: '', DI0201002: '', DI0201003: '', DI0201004: '',
  DI0201005: '201_0', DI0201006: '', DI0201007: '', DI0201008: '', DI0201009: '',
  DI0201010: '', DI0201011: '', DI0201012: '', DI0201013: '', DI0201014: '',
  DI0201015: '', DI0201016: '', DI0201017: '', DI0201018: '', DI0201019: '',
  DI0201020: '', DI0201021: '', DI0201022: '', DI0201023: '', DI0201024: '',
  DI0201025: '', DI0201026: '', DI0201027: '',
  DI0658001: '658_0', DI0658002: '', DI0658003: '658_1',
  DI0666000: '', DI0666001: '', DI0666002: '', DI0666003: '', DI0666004: '',
  DI0666005: '', DI0666006: '666_0', DI0666007: '', DI0666008: '', DI0666009: '',
  DI0666010: '', DI0666011: '', DI0666012: '', DI0666013: '', DI0666014: '',
  DI0666015: '', DI0666016: '', DI0666017: '', DI0666018: '', DI0666019: '',
  DI0670001: '', DI0670002: '', DI0670003: '', DI0670004: '',
  DI0670005: '670_1', DI0670006: '670_2',
  DI0678002: '678_2', DI0678003: '678_2',
  DI0718004: '718_2', DI0718005: '718_3',
  DI0774007: '774_1',
  DI0801001: '', DI0801002: '801_1', DI0801003: '',
  DI0849001G: '849_3',
  DI0869000: '869_0',
  DI0869000k1: '', DI0869000k2: '', DI0869000k3: '', DI0869000k4: '',
  DI0869000k5: '', DI0869000k6: '',
  DI0869001: '', DI0869001k1: '', DI0869001k2: '', DI0869001k3: '',
  DI0869001k4: '', DI0869001k5: '', DI0869001k6: '',
  DI0869002: '', DI0869002k1: '', DI0869002k2: '', DI0869002k3: '',
  DI0869002k4: '', DI0869002k5: '', DI0869002k6: '',
  DI0869003: '', DI0869003k1: '', DI0869003k2: '', DI0869003k3: '',
  DI0869003k4: '', DI0869003k5: '', DI0869003k6: '',
  DI0869004: '', DI0869004k1: '', DI0869004k2: '', DI0869004k3: '',
  DI0869004k4: '', DI0869004k5: '', DI0869004k6: '',
  DI0869005: '', DI0869005k1: '', DI0869005k2: '', DI0869005k3: '',
  DI0869005k4: '', DI0869005k5: '', DI0869005k6: '',
  DI0869006: '', DI0869006k1: '', DI0869006k2: '', DI0869006k3: '',
  DI0869006k4: '', DI0869006k5: '', DI0869006k6: '',
  DI0869007: '', DI0869007k1: '', DI0869007k2: '', DI0869007k3: '',
  DI0869007k4: '', DI0869007k5: '', DI0869007k6: '',
  DI0869000G: '869_1',
  DI0892000G: '892_2', DI0892001G: '892_3',
}

// 构建匹配映射: key → image_m
const zukanImageMap: Record<string, string> = {}
const zukanOrgImageMap: Record<string, string> = {}
const specialGenderForms = new Set([521, 592, 593, 668])

for (const z of zukanList) {
  const no = parseInt(z.no, 10)
  zukanOrgImageMap[`${no}_${z.sub}`] = z.image_m
  if (z.kyodai_flg === 1) {
    zukanImageMap[`${no}_0_0_1`] = z.image_m
  } else if (z.sub === 0) {
    zukanImageMap[`${no}_0_0_0`] = z.image_m
  } else if (!specialGenderForms.has(no)) {
    zukanImageMap[`${no}_${z.sub}_0_0`] = z.image_m
  } else {
    if (z.sub === 1) {
      zukanImageMap[`${no}_0_1_0`] = z.image_m
    } else {
      zukanImageMap[`${no}_${z.sub - 1}_0_0`] = z.image_m
    }
  }
}

const MD = resolve(ROOT, 'madatsubomi', 'Master Data')
const TEXT_ROOT = resolve(ROOT, 'megaturtle-text')
const OUT = resolve(__dirname, '..', 'public', 'data')

const loadJson = (name: string) => JSON.parse(readFileSync(resolve(MD, name), 'utf-8'))

// 语言配置: [id, 显示名, 文件夹名, 文件后缀]
const LANGS: [string, string, string, string][] = [
  ['sch', '简体中文', 'Chinese (Simplified)', 'sch'],
  ['tch', '繁體中文', 'Chinese (Traditional)', 'tch'],
  ['usa', 'English', 'English', 'usa'],
  ['jpn', '日本語(かな)', 'Japanese (Kana)', 'jpn'],
  ['jpn_kanji', '日本語(漢字)', 'Japanese (Kanji)', 'jpn_kanji'],
  ['kor', '한국어', 'Korean', 'kor'],
  ['fra', 'Français', 'French', 'fra'],
  ['deu', 'Deutsch', 'German', 'deu'],
  ['ita', 'Italiano', 'Italian', 'ita'],
  ['esp', 'Español', 'Spanish (Spain)', 'esp'],
  ['las', 'Español (LA)', 'Spanish (Latin America)', 'las'],
]


// ── 解析文本文件 ──
function parseTexts(folder: string, suffix: string): Record<string, string> {
  const filePath = resolve(TEXT_ROOT, folder, `msbt_${suffix}.txt`)
  if (!existsSync(filePath)) return {}
  const raw = readFileSync(filePath, 'utf-8')
  const map: Record<string, string> = {}
  let currentFile = ''
  const suffixPattern = new RegExp(
    `_${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.msbt`,
  )
  for (const line of raw.split(/\r?\n/)) {
    const fileMatch = line.match(/^Text File : (.+)$/)
    if (fileMatch) {
      currentFile = fileMatch[1].replace(suffixPattern, '')
      continue
    }
    if (line.startsWith('~') || !line.trim()) continue
    const idx = line.indexOf('\t')
    if (idx === -1) continue
    map[`${currentFile}:${line.substring(0, idx)}`] = line.substring(idx + 1)
  }
  return map
}

function makeTranslator(texts: Record<string, string>) {
  const byKey: Record<string, string> = {}
  for (const [fullKey, val] of Object.entries(texts)) {
    const ci = fullKey.indexOf(':')
    if (ci !== -1) {
      const bare = fullKey.substring(ci + 1)
      if (!byKey[bare]) byKey[bare] = val
    }
  }
  return (msKey: string) => {
    if (!msKey) return ''
    return texts[msKey] || byKey[msKey] || ''
  }
}

// ── 加载不依赖语言的原始数据 ──
const pokemonTypesRaw = loadJson('pokemonType.json')
const tokuseiRaw = loadJson('tokusei.json')
const temperRaw = loadJson('temper.json')
const abilityRaw = loadJson('ability.json')
const ballsRaw = loadJson('monsterBall.json')
const regionsRaw = loadJson('region.json')
const personalRaw = loadJson('personalGlobal.json')
const evoRaw = loadJson('evolutionPattern.json')
const dictMgmtRaw = loadJson('dictionaryManagement.json')
const softAppearRaw = loadJson('softwareAppear.json')
const ribbonRaw = loadJson('ribbon.json')
const wazaRaw = loadJson('waza.json')
const wazaCatRaw = loadJson('wazaCategory.json')
const dictRaw = loadJson('dictionary.json')
const nameRaw = loadJson('pokemonName.json')
const formRaw = loadJson('pokemonForm.json')
const pokemonImageRaw = loadJson('pokemonImage.json')

// 构建图片 ID → icon URL 映射
const IMG_BASE = 'https://resource.pokemon-home.com/battledata/img/pokei128/'
const ZUKAN_IMG_PREFIX = 'https://zukan.pokemon.co.jp/zukan-api/up/images/index/'
const imageMap: Record<string, string> = {}
const imageFemaleMap: Record<string, string> = {}
for (const pi of pokemonImageRaw) {
  if (pi.dicListImage) {
    const icon = pi.dicListImage.replace(/^cap/, 'icon').replace(/_128(_\d+)?$/, '')
    imageMap[pi.id] = `${IMG_BASE}${icon}.png`
  }
  if (pi.dicListImageFemale) {
    const icon = pi.dicListImageFemale.replace(/^cap/, 'icon').replace(/_128(_\d+)?$/, '')
    imageFemaleMap[pi.id] = `${IMG_BASE}${icon}.png`
  }
}

const catRaw = loadJson('category.json')
const heightRaw = loadJson('height.json')
const weightRaw = loadJson('weight.json')
const colorRaw = loadJson('color.json')
const softRaw = loadJson('software.json')

const personalMap: Record<string, any> = {}
for (const p of personalRaw) personalMap[p.id] = p
const evoMap: Record<string, any> = {}
for (const e of evoRaw) evoMap[e.id] = e

// 预计算形态变换白名单
const formChangeAllowedIds = new Set<string>()
const formChangeRestrictedDexNums = new Set<number>()
for (const d of dictRaw) {
  if (d.mdFormChangeDics?.length > 0) {
    formChangeRestrictedDexNums.add(d.dictionaryId)
    for (const id of d.mdFormChangeDics) formChangeAllowedIds.add(id)
  }
}

const typeConfig = pokemonTypesRaw.map((ty: any) => ({
  id: ty.id,
  color: ty.color,
  image: ty.image,
  sort: ty.sort,
  weakTo: ty.mdTypes2_0 || [],
  resistTo: ty.mdTypes0_5 || [],
  immuneTo: ty.mdTypes0_0 || [],
}))


// 读取 PokeAPI 原始数据并建立映射
const POKEAPI_TYPE_MAP: Record<string, string> = {
  normal: 'TY0000', fighting: 'TY0001', flying: 'TY0002',
  poison: 'TY0003', ground: 'TY0004', rock: 'TY0005',
  bug: 'TY0006', ghost: 'TY0007', steel: 'TY0008',
  fire: 'TY0009', water: 'TY0010', grass: 'TY0011',
  electric: 'TY0012', psychic: 'TY0013', ice: 'TY0014',
  dragon: 'TY0015', dark: 'TY0016', fairy: 'TY0017',
}
const POKEAPI_CATEGORY_MAP: Record<string, string> = {
  physical: 'WC0001', special: 'WC0002', status: 'WC0003',
}
function numToWz(n: number) {
  return `WZ${String(n).padStart(4, '0')}`
}

const pokeApiMovesPath = resolve(OUT, '_pokeapi_moves.json')
const pokeApiMovesMap: Record<string, any> = {}
if (existsSync(pokeApiMovesPath)) {
  try {
    const rawArr = JSON.parse(readFileSync(pokeApiMovesPath, 'utf-8'))
    for (const raw of rawArr) {
      const wzId = numToWz(raw.id)
      pokeApiMovesMap[wzId] = {
        id: wzId,
        pokeApiId: raw.id,
        type: POKEAPI_TYPE_MAP[raw.type?.name] || '',
        categoryId: POKEAPI_CATEGORY_MAP[raw.damage_class?.name] || '',
        power: raw.power,
        accuracy: raw.accuracy,
        pp: raw.pp,
        priority: raw.priority ?? 0,
        effectChance: raw.effect_chance,
        target: raw.target?.name || '',
      }
    }
  } catch { /* ignore */ }
}

// 读取 PokeAPI 道具原始数据并建立映射
const POKEAPI_LANG_MAP: Record<string, string> = {
  'zh-hans': 'sch', 'zh-hant': 'tch', en: 'usa',
  'ja-hrkt': 'jpn', ja: 'jpn_kanji', ko: 'kor',
  fr: 'fra', de: 'deu', it: 'ita', es: 'esp',
}
const pokeApiItemsPath = resolve(OUT, '_pokeapi_items.json')
// itemDescMap: { [langId]: { [normalizedName]: desc } }  — 按名称匹配而非 ID
const pokeApiItemDescMap: Record<string, Record<string, string>> = {}
if (existsSync(pokeApiItemsPath)) {
  try {
    const rawArr = JSON.parse(readFileSync(pokeApiItemsPath, 'utf-8'))
    for (const raw of rawArr) {
      if (!raw?.names || !raw.flavor_text_entries) continue
      // 按语言取最新版本的 flavor_text（数组最后一个同语言条目即为最新）
      const descByLang: Record<string, string> = {}
      for (const fte of raw.flavor_text_entries) {
        const langName = fte.language?.name
        if (langName) descByLang[langName] = fte.text?.replace(/\n/g, '') ?? ''
      }
      // 按语言取道具名称
      const nameByLang: Record<string, string> = {}
      for (const n of raw.names) {
        const langName = n.language?.name
        if (langName && n.name) nameByLang[langName] = n.name
      }
      // 用名称作为 key 建立映射
      for (const [apiLang, projLang] of Object.entries(POKEAPI_LANG_MAP)) {
        const name = nameByLang[apiLang]
        const desc = descByLang[apiLang]
        if (name && desc) {
          if (!pokeApiItemDescMap[projLang]) pokeApiItemDescMap[projLang] = {}
          pokeApiItemDescMap[projLang][name] = desc
        }
      }
    }
    console.log(`📦 已加载 PokeAPI 道具数据，共 ${rawArr.length} 个`)
  } catch { /* ignore */ }
}

const wazaIdSet = new Set(wazaRaw.map((w: any) => w.id))
const wazaMap: Record<string, any> = {}
for (const w of wazaRaw) wazaMap[w.id] = w

const dmById: Record<string, any> = {}
for (const dm of dictMgmtRaw) dmById[dm.id] = dm
function getSoftwareIds(dm: any): string[] {
  if (dm.mdSoftwareIds?.length > 0) return dm.mdSoftwareIds
  if (dm.hostDicId && dmById[dm.hostDicId]) return getSoftwareIds(dmById[dm.hostDicId])
  return []
}

const dexListConfig = dictMgmtRaw
  .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
  .map((dm: any) => {
    let pokemonIds: string[] = []
    try {
      pokemonIds = loadJson(`dictionarySW${dm.dicMdName.replace('SW', '')}.json`).map(
        (e: any) => e.mdDicId,
      )
    } catch { /* ignore */ }
    const softwareIds = getSoftwareIds(dm)
    return { id: dm.id, softwareIds, pokemonIds }
  })
  .filter((d: any) => d.pokemonIds.length > 0)

const colorHexMap = Object.fromEntries(colorRaw.map((c: any) => [c.id, c.color]))

const pokemonStatic = dictRaw
  .filter((d: any) => d.dictionaryId > 0)
  .filter(
    (d: any) =>
      !(formChangeRestrictedDexNums.has(d.dictionaryId) && !formChangeAllowedIds.has(d.id)),
  )
  .map((d: any) => {
    const dexNum = d.dictionaryId
    const psId = `PS${String(dexNum).padStart(4, '0')}${String(d.formNo || 0).padStart(3, '0')}`
    const stats = personalMap[psId]
    const evo = evoMap[d.mdEvoPatId]
    let evoChain: { dexNum: number; formNo: number }[] = []
    let evoTemplate = ''
    if (evo?.mdPokemonImages?.length > 0) {
      evoTemplate = evo.templatePrefab || ''
      evoChain = evo.mdPokemonImages.map((img: string) => {
        const numPart = img.replace('DI', '').replace(/[A-Z]$/, '')
        return {
          dexNum: parseInt(numPart.substring(0, 4), 10),
          formNo: parseInt(numPart.substring(4), 10),
        }
      })
    }
    const icon = imageMap[d.mdPokemonImage] || ''
    const iconFemale = imageFemaleMap[d.mdPokemonImage] || ''
    const entry: any = {
      id: d.id,
      n: dexNum,
      fn: d.formNo || 0,
      fg: d.formGender,
      icon: icon ? icon.replace(IMG_BASE, '') : '',
      icf: iconFemale ? iconFemale.replace(IMG_BASE, '') : '',
      types: d.mdTypeIds || [],
      ab: d.mdTokuIds || [],
      kt: d.mdKata || '',
      colId: d.mdColor || '',
      colh: colorHexMap[d.mdColor] || '',
    }
    if (stats)
      entry.st = [stats.hp, stats.atk, stats.def, stats.spatk, stats.spdef, stats.agi]
    if (evoChain.length > 0) entry.evo = evoChain.map(e => [e.dexNum, e.formNo])
    if (evoTemplate) entry.evot = evoTemplate
    if (d.isMega === 1) entry.mg = 1
    if (d.isDMax === 1) entry.dm = 1
    if (d.isInNumberSort === 1) entry.ns = 1
    if (d.appearSoftwareAper?.length) entry.ag = d.appearSoftwareAper
    // 图鉴大图
    const zukanKey = `${dexNum}_${d.formNo || 0}_0_${d.isDMax || 0}`
    let image = zukanImageMap[zukanKey] || ''
    if (specialZukanKeyMap.hasOwnProperty(d.id)) {
      image = zukanOrgImageMap[specialZukanKeyMap[d.id]]
    }
    if (image) entry.i = image.replace(ZUKAN_IMG_PREFIX, '').replace(/\.png$/, '')
    const zukanKeyFemale = `${dexNum}_${d.formNo || 0}_1_${d.isDMax || 0}`
    const imageFemale = zukanImageMap[zukanKeyFemale] || ''
    if (imageFemale) entry.if = imageFemale.replace(ZUKAN_IMG_PREFIX, '').replace(/\.png$/, '')
    return entry
  })


// ── 为每种语言生成数据 ──
for (const [langId, langName, folder, suffix] of LANGS) {
  const texts = parseTexts(folder, suffix)
  if (Object.keys(texts).length === 0) {
    console.log(`⚠ Skipping ${langId}: no text`)
    continue
  }
  const t = makeTranslator(texts)
  const langOut = resolve(OUT, langId)

  // 属性
  const typeMap: Record<string, any> = {}
  const typeNames: any[] = []
  for (const ty of pokemonTypesRaw) {
    typeMap[ty.id] = {
      id: ty.id,
      name: t(ty.msname) || ty.id,
      color: ty.color,
      image: ty.image,
      sort: ty.sort,
      weakTo: ty.mdTypes2_0 || [],
      resistTo: ty.mdTypes0_5 || [],
      immuneTo: ty.mdTypes0_0 || [],
    }
    typeNames.push({ id: ty.id, name: t(ty.msname) || ty.id })
  }

  // 特性
  const tokuseiMap: Record<string, any> = {}
  for (const tk of tokuseiRaw) {
    tokuseiMap[tk.id] = { id: tk.id, name: t(tk.msname), desc: t(tk.mstext) }
  }

  // 性格
  const abMap: Record<string, string> = {}
  for (const ab of abilityRaw) abMap[ab.id] = t(ab.ms)

  const natures = temperRaw.map((pe: any) => {
    const rawDesc = t(pe.mstext)
    const desc = rawDesc.replace(/\[VAR [^\]]+\]/g, '').trim()
    return { id: pe.id, name: t(pe.ms), desc: desc || '' }
  })

  const statNames = abilityRaw.map((ab: any) => ({ id: ab.id, name: t(ab.ms) }))
  writeJson(resolve(langOut, 'stats.json'), statNames)

  // 精灵球
  const balls = ballsRaw
    .map((b: any) => ({ id: b.id, number: b.number, name: t(b.msText), sort: b.sort }))
    .sort((a: any, b: any) => a.number - b.number)

  // 区域
  const regions = regionsRaw.map((r: any) => ({ id: r.id, name: t(r.ms) }))

  // 招式
  const wcMap: Record<string, string> = {}
  for (const wc of wazaCatRaw) wcMap[wc.id] = t(wc.ms)

  const moveNameMap: Record<string, string> = {}
  const moveDescMap: Record<string, string> = {}
  for (const key of Object.keys(texts)) {
    const nameMatch = key.match(/^wazaname[^:]*:WAZANAME_(\d+)$/i)
    if (nameMatch) {
      const num = parseInt(nameMatch[1], 10)
      if (num === 0) continue
      const wzId = `WZ${String(num).padStart(4, '0')}`
      moveNameMap[wzId] = texts[key]
    }
    const descMatch = key.match(/^wazainfo_all[^:]*:WAZAINFO_ALL_(\d+)$/i)
    if (descMatch) {
      const num = parseInt(descMatch[1], 10)
      if (num === 0) continue
      const wzId = `WZ${String(num).padStart(4, '0')}`
      moveDescMap[wzId] = texts[key]
    }
  }

  const allMoveIds = new Set([...Object.keys(moveNameMap), ...wazaRaw.map((w: any) => w.id)])
  const moves = [...allMoveIds]
    .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10))
    .filter(wzId => moveNameMap[wzId])
    .map(wzId => {
      const w = wazaMap[wzId]
      const api = pokeApiMovesMap[wzId]
      const typeId = w?.mdPokemonType || api?.type || ''
      const catId = w?.mdWazaCategory || api?.categoryId || ''
      return {
        id: wzId,
        name: moveNameMap[wzId] || '',
        desc: moveDescMap[wzId] || '',
        type: typeId,
        typeName: typeMap[typeId]?.name || '',
        categoryId: catId,
        category: wcMap[catId] || '',
      }
    })

  // 名称/形态/分类/身高/体重/颜色
  const nmMap: Record<string, string> = {}
  for (const n of nameRaw) nmMap[n.id] = t(n.msname)
  const fmMap: Record<string, string> = {}
  for (const f of formRaw) {
    const v = t(f.ms)
    fmMap[f.id] = v && v !== f.ms ? v : ''
  }
  const ctMap: Record<string, string> = {}
  for (const c of catRaw) ctMap[c.id] = t(c.msname)
  const htMap: Record<string, string> = {}
  for (const h of heightRaw) htMap[h.id] = t(h.ms)
  const wtMap: Record<string, string> = {}
  for (const w of weightRaw) wtMap[w.id] = t(w.ms)
  const clMap: Record<string, string> = {}
  const colorNames: any[] = []
  for (const c of colorRaw) {
    const name = t(c.ms)
    clMap[c.id] = name
    if (name) colorNames.push({ id: c.id, name })
  }

  // 图鉴描述
  const zukanGames = [
    { file: 'zukan_comment_x', prefix: 'ZKN_X', digits: 3, label: 'Pokémon X' },
    { file: 'zukan_comment_y', prefix: 'ZKN_Y', digits: 3, label: 'Pokémon Y' },
    { file: 'zukan_comment_alpha', prefix: 'ZKN_ALPHA', digits: 3, label: 'Pokémon Alpha Sapphire' },
    { file: 'zukan_comment_omega', prefix: 'ZKN_OMEGA', digits: 3, label: 'Pokémon Omega Ruby' },
    { file: 'zukan_comment_sun', prefix: 'ZKN_SUN', digits: 3, label: 'Pokémon Sun' },
    { file: 'zukan_comment_moon', prefix: 'ZKN_MOON', digits: 3, label: 'Pokémon Moon' },
    { file: 'zukan_comment_ultrasun', prefix: 'ZKN_ULSUN', digits: 3, label: 'Pokémon Ultra Sun' },
    { file: 'zukan_comment_ultramoon', prefix: 'ZKN_ULMOON', digits: 3, label: 'Pokémon Ultra Moon' },
    { file: 'zukan_comment_letsgo', prefix: 'ZKN_LETSGO', digits: 3, label: "Pokémon Let's Go" },
    { file: 'zukan_comment_sword', prefix: 'ZKN_SWORD', digits: 3, label: 'Pokémon Sword' },
    { file: 'zukan_comment_shield', prefix: 'ZKN_SHIELD', digits: 3, label: 'Pokémon Shield' },
    { file: 'zukan_comment_brilliantdiamond', prefix: 'ZKN_DIAMOND', digits: 3, label: 'Pokémon Brilliant Diamond' },
    { file: 'zukan_comment_shiningpearl', prefix: 'ZKN_PEARL', digits: 3, label: 'Pokémon Shining Pearl' },
    { file: 'zukan_comment_arceus', prefix: 'ZKN_ARCEUS', digits: 3, label: 'Pokémon Legends: Arceus' },
    { file: 'zukan_comment_scarlet', prefix: 'ZKN_SCARLET', digits: 4, label: 'Pokémon Scarlet' },
    { file: 'zukan_comment_violet', prefix: 'ZKN_VIOLET', digits: 4, label: 'Pokémon Violet' },
    { file: 'zukan_comment_za', prefix: 'ZKN_ZA', digits: 4, label: 'Pokémon Legends Z-A' },
  ]

  const gameNameMap: Record<string, string> = {}
  const gameSoftIdsMap: Record<string, string[]> = {}
  for (const sf of softRaw) {
    if (sf.msZukanCommentFile) {
      const name = t(sf.msname)
      if (name) {
        if (gameNameMap[sf.msZukanCommentFile]) {
          if (!gameNameMap[sf.msZukanCommentFile].includes(name)) {
            gameNameMap[sf.msZukanCommentFile] += ' / ' + name
          }
        } else {
          gameNameMap[sf.msZukanCommentFile] = name
        }
      }
      if (!gameSoftIdsMap[sf.msZukanCommentFile]) gameSoftIdsMap[sf.msZukanCommentFile] = []
      gameSoftIdsMap[sf.msZukanCommentFile].push(sf.id)
    }
  }

  // 游戏 sids 全局去重索引
  const gIndex: string[][] = []
  const gMap: Record<string, number> = {}
  function getGIdx(sids: string[]) {
    const key = sids.join(',')
    if (gMap[key] !== undefined) return gMap[key]
    gMap[key] = gIndex.length
    gIndex.push(sids)
    return gIndex.length - 1
  }

  function getZukanDescs(dexNum: number, formNo: number) {
    const descs: [number, string][] = []
    for (const g of zukanGames) {
      const dexStr = String(dexNum).padStart(g.digits, '0')
      const formStr = String(formNo).padStart(3, '0')
      const textKey = `${g.file}:${g.prefix}_${dexStr}_${formStr}`
      const desc = t(textKey)
      if (desc && desc !== textKey) {
        descs.push([getGIdx(gameSoftIdsMap[g.file] || []), desc])
      }
    }
    return descs
  }

  // 宝可梦
  const pokemon: any[] = []
  const pokemonExtras: Record<string, any> = {}
  for (const d of dictRaw) {
    const dexNum = d.dictionaryId
    if (dexNum <= 0) continue
    if (formChangeRestrictedDexNums.has(dexNum) && !formChangeAllowedIds.has(d.id)) continue
    const zukanDescs = getZukanDescs(dexNum, d.formNo || 0)
    const ext: any = {}
    if (zukanDescs.length > 0) ext.z = zukanDescs
    if (Object.keys(ext).length) pokemonExtras[d.id] = ext
    const entry: any = { id: d.id, _n: dexNum, _fn: d.formNo || 0 }
    entry.name = nmMap[d.mdNameId] || `#${dexNum}`
    if (fmMap[d.mdForm]) entry.form = fmMap[d.mdForm]
    if (ctMap[d.mdCateId]) entry.cat = ctMap[d.mdCateId]
    if (htMap[d.mdHeightId]) entry.ht = htMap[d.mdHeightId]
    if (wtMap[d.mdWeightId]) entry.wt = wtMap[d.mdWeightId]
    pokemon.push(entry)
  }
  pokemon.sort((a, b) => a._n - b._n || a._fn - b._fn)
  for (const p of pokemon) { delete p._n; delete p._fn }

  const softwares = softRaw
    .filter((s: any) => s.msname)
    .map((s: any) => ({ id: s.id, name: t(s.msname) }))
    .filter((s: any) => s.name && s.name !== s.id)

  const dexListValidIds = new Set(dexListConfig.map((d: any) => d.id))
  const dexList = dictMgmtRaw
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .filter((dm: any) => dexListValidIds.has(dm.id))
    .map((dm: any) => {
      const name = t(dm.msRegionDicName)
      return { id: dm.id, name: name || dm.dicMdName }
    })

  const abilities = Object.values(tokuseiMap).filter((a: any) => a.name)

  // 奖章
  const ribbons = ribbonRaw
    .map((r: any) => {
      const idx = r.id.slice(2)
      const name = t(`ribbon_SV:mes_ribbon_name_${idx}`)
      const desc = t(`ribbon_SV:mes_ribbon_info_${idx}`)
      return { id: r.id, name: name || '', desc: desc || '' }
    })
    .sort((a: any, b: any) => a.order - b.order)

  // 道具
  const langItemDescs = pokeApiItemDescMap[langId] || {}
  const itemNames: any[] = []
  for (let i = 1; i <= 3000; i++) {
    const key = `itemname:ITEMNAME_${String(i).padStart(3, '0')}`
    const name = t(key)
    if (name && name !== key) {
      const entry: any = { id: i, name }
      if (langItemDescs[name]) entry.desc = langItemDescs[name]
      itemNames.push(entry)
    }
  }

  writeJson(resolve(langOut, 'pokemon.json'), pokemon)
  writeJson(resolve(langOut, 'pokemon-descs.json'), { _g: gIndex, ...pokemonExtras })
  writeJson(resolve(langOut, 'types.json'), typeNames)
  writeJson(resolve(langOut, 'moves.json'), moves)
  writeJson(resolve(langOut, 'natures.json'), natures)
  writeJson(resolve(langOut, 'balls.json'), balls)
  writeJson(resolve(langOut, 'regions.json'), regions)
  writeJson(resolve(langOut, 'softwares.json'), softwares)
  writeJson(resolve(langOut, 'dexList.json'), dexList)
  writeJson(resolve(langOut, 'abilities.json'), abilities)
  writeJson(resolve(langOut, 'colors.json'), colorNames)
  writeJson(resolve(langOut, 'ribbons.json'), ribbons)
  writeJson(resolve(langOut, 'items.json'), itemNames)

  console.log(
    `✅ ${langId} (${langName}): ${pokemon.length} pokémon, ${moves.length} moves, ${abilities.length} abilities`,
  )
}


// ── 全局配置文件 ──
const langMeta = LANGS.map(([id, name]) => ({ id, name }))
writeJson(resolve(OUT, 'langs.json'), langMeta)
writeJson(resolve(OUT, 'types.json'), typeConfig)

// 全局 moves.json
const allLangMoveIds = new Set<string>()
for (const [, , folder, suffix] of LANGS) {
  const texts = parseTexts(folder, suffix)
  for (const key of Object.keys(texts)) {
    const nameMatch = key.match(/^wazaname[^:]*:WAZANAME_(\d+)$/i)
    if (nameMatch) {
      const num = parseInt(nameMatch[1], 10)
      if (num > 0) allLangMoveIds.add(`WZ${String(num).padStart(4, '0')}`)
    }
  }
}
for (const w of wazaRaw) allLangMoveIds.add(w.id)

const moveConfig = [...allLangMoveIds]
  .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10))
  .map(wzId => {
    const w = wazaMap[wzId]
    const api = pokeApiMovesMap[wzId]
    const base: any = {
      id: wzId,
      type: w?.mdPokemonType || api?.type || '',
      categoryId: w?.mdWazaCategory || api?.categoryId || '',
      isAvailable: wazaIdSet.has(wzId),
    }
    if (api) {
      for (const k of ['power', 'accuracy', 'pp', 'priority', 'effectChance', 'target'] as const) {
        if (api[k] !== undefined) base[k] = api[k]
      }
    }
    return base
  })

writeJson(resolve(OUT, 'moves.json'), moveConfig)
writeJson(resolve(OUT, 'dexList.json'), dexListConfig)
writeJson(resolve(OUT, 'pokemon.json'), pokemonStatic)

// 性格全局配置
const natureConfig = temperRaw.map((pe: any) => ({
  id: pe.id,
  plus: pe.mdAbilityPlus || '',
  minus: pe.mdAbilityMinus || '',
}))
writeJson(resolve(OUT, 'natures.json'), natureConfig)

// 区域全局配置
const regionConfig = regionsRaw.map((r: any) => ({ id: r.id, no: r.no }))
writeJson(resolve(OUT, 'regions.json'), regionConfig)

// 奖章全局配置
const ribbonConfig = ribbonRaw
  .map((r: any) => ({
    id: r.id,
    order: r.order,
    image: r.image_a,
    hasAlt: !!r.image_b,
  }))
  .sort((a: any, b: any) => a.order - b.order)
writeJson(resolve(OUT, 'ribbons.json'), ribbonConfig)

// 游戏版本全局配置
const msToRegionId = Object.fromEntries(regionsRaw.map((r: any) => [r.ms, r.id]))
function findRegionId(msregion: string) {
  if (!msregion) return ''
  if (msToRegionId[msregion]) return msToRegionId[msregion]
  const mrKey = msregion.includes(':') ? msregion.split(':').pop()! : msregion
  const swSuffix = mrKey.includes('MAPNAME_') ? mrKey.split('MAPNAME_').pop()! : mrKey
  let bestRid = ''
  let bestLen = 0
  for (const [ms, rid] of Object.entries(msToRegionId)) {
    const msKey = ms.includes(':') ? ms.split(':').pop()! : ms
    const suffix = msKey.includes('MAPNAME_') ? msKey.split('MAPNAME_').pop()! : msKey
    if (swSuffix.endsWith(suffix) && suffix.length > bestLen) {
      bestRid = rid as string
      bestLen = suffix.length
    }
  }
  return bestRid
}

const softwareConfig = softRaw
  .filter((s: any) => s.msname)
  .map((s: any) => ({
    id: s.id,
    romId: s.romId,
    gen: s.gen,
    regionId: findRegionId(s.msregion),
  }))
writeJson(resolve(OUT, 'softwares.json'), softwareConfig)

// 游戏组
const gameGroups = softAppearRaw
  .filter((sa: any) => sa.appearTarget === 1)
  .sort((a: any, b: any) => a.appearTargetSort - b.appearTargetSort)
  .map((sa: any) => ({ id: sa.id, softwareIds: sa.mdSoftwares }))
writeJson(resolve(OUT, 'gameGroups.json'), gameGroups)

// ── 从 PokeAPI 宝可梦缓存生成 learnsets.json ──
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
  'brilliant-diamond-shining-pearl',
  'legends-arceus',
  'scarlet-violet',
  'legends-za',
])

type LevelUpEntry = { move: number; level: number }
type LearnsetBucket = {
  'level-up'?: LevelUpEntry[]
  machine?: number[]
  egg?: number[]
  tutor?: number[]
}

function extractLearnsetFromPokemon(pokemonData: any): Record<string, LearnsetBucket> {
  const byVg: Record<string, { 'level-up': LevelUpEntry[]; machine: number[]; egg: number[]; tutor: number[] }> = {}
  for (const entry of pokemonData.moves ?? []) {
    const moveId = entry.move?.url?.match(/\/(\d+)\/$/)?.[1]
    if (!moveId) continue
    const mid = parseInt(moveId, 10)
    for (const vg of entry.version_group_details ?? []) {
      const vgName: string = vg.version_group?.name
      if (!vgName || !KEEP_VGS.has(vgName)) continue
      if (!byVg[vgName]) byVg[vgName] = { 'level-up': [], machine: [], egg: [], tutor: [] }
      const bucket = byVg[vgName]
      const method: string = vg.move_learn_method?.name
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
  // 排序 level-up，清理空数组/空版本组
  for (const vg of Object.values(byVg)) {
    vg['level-up'].sort((a, b) => a.level - b.level || a.move - b.move)
    for (const key of Object.keys(vg) as (keyof typeof vg)[]) {
      if (vg[key]!.length === 0) delete (vg as any)[key]
    }
  }
  for (const k of Object.keys(byVg)) {
    if (Object.keys(byVg[k]).length === 0) delete byVg[k]
  }
  return byVg
}

const pokeApiPokemonsPath = resolve(OUT, '_pokeapi_pokemons.json')
if (existsSync(pokeApiPokemonsPath)) {
  try {
    const rawData = JSON.parse(readFileSync(pokeApiPokemonsPath, 'utf-8'))
    const learnsets: Record<string, Record<string, Record<string, LearnsetBucket>>> = {}

    for (const [dexNum, speciesEntry] of Object.entries<any>(rawData)) {
      if (!speciesEntry?.varieties?.length) continue
      const entry: Record<number, Record<string, LearnsetBucket>> = {}
      for (let i = 0; i < speciesEntry.varieties.length; i++) {
        const pokemonData = speciesEntry.varieties[i]
        if (!pokemonData?.moves) continue
        const ls = extractLearnsetFromPokemon(pokemonData)
        if (Object.keys(ls).length > 0) entry[i] = ls
      }
      if (Object.keys(entry).length > 0) {
        // 优化：如果所有形态完全一样，只保留 form 0
        const base = JSON.stringify(entry[0])
        const allSame = Object.keys(entry).every(k => JSON.stringify(entry[+k]) === base)
        learnsets[dexNum] = allSame ? { '0': entry[0] } : (entry as any)
      }
    }

    writeJson(resolve(OUT, 'learnsets.json'), learnsets)
    console.log(`📋 已从 PokeAPI 宝可梦缓存生成 learnsets.json，共 ${Object.keys(learnsets).length} 个 species`)
  } catch (e: any) {
    console.warn(`⚠️ 生成 learnsets.json 失败: ${e.message}`)
  }
} else {
  console.log('⚠ 未找到 _pokeapi_pokemons.json，跳过 learnsets.json 生成')
}

console.log('✅ All done!')
