/**
 * 数据预处理脚本 - 多语言版
 * 为每种语言生成一套聚合 JSON
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

// ── 获取宝可梦图鉴 API 图片数据 ──
async function fetchZukanImages() {
  const CACHE = resolve(__dirname, '..', 'public', 'data', '_zukan_cache.json')
  if (existsSync(CACHE)) {
    console.log('Using cached zukan API data')
    return JSON.parse(readFileSync(CACHE, 'utf-8'))
  }
  console.log('Fetching zukan API...')
  const res = await fetch('https://zukan.pokemon.co.jp/zukan-api/api/search/?limit=2000&page=1')
  const data = await res.json()
  writeFileSync(CACHE, JSON.stringify(data.results))
  console.log(`Fetched ${data.results.length} zukan entries`)
  return data.results
}

const zukanList = await fetchZukanImages()

// 构建匹配映射: key → image_m
// key 格式: "{dexNum}_{formNo}_{isDMax}"
const zukanImageMap = {}
for (const z of zukanList) {
  const no = parseInt(z.no, 10)
  if (z.sub_name === 'キョダイマックスのすがた' || z.kyodai_flg === 1) {
    // 超极巨化: dexNum + formNo=0 + isDMax=1
    zukanImageMap[`${no}_0_1`] = z.image_m
  } else if (z.sub === 0) {
    // 基础形态
    zukanImageMap[`${no}_0_0`] = z.image_m
  } else {
    // 其他形态: sub 对应 formNo
    zukanImageMap[`${no}_${z.sub}_0`] = z.image_m
  }
}
const MD = resolve(ROOT, 'madatsubomi', 'Master Data')
const TEXT_ROOT = resolve(ROOT, 'megaturtle-text')
const OUT = resolve(__dirname, '..', 'public', 'data')

mkdirSync(OUT, { recursive: true })

const loadJson = (name) => JSON.parse(readFileSync(resolve(MD, name), 'utf-8'))

// 语言配置: [id, 显示名, 文件夹名, 文件后缀]
const LANGS = [
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
function parseTexts(folder, suffix) {
  const filePath = resolve(TEXT_ROOT, folder, `msbt_${suffix}.txt`)
  if (!existsSync(filePath)) return {}
  const raw = readFileSync(filePath, 'utf-8')
  const map = {}
  let currentFile = ''
  const suffixPattern = new RegExp(`_${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.msbt$`)
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

function makeTranslator(texts) {
  const byKey = {}
  for (const [fullKey, val] of Object.entries(texts)) {
    const ci = fullKey.indexOf(':')
    if (ci !== -1) {
      const bare = fullKey.substring(ci + 1)
      if (!byKey[bare]) byKey[bare] = val
    }
  }
  return (msKey) => {
    if (!msKey) return ''
    if (texts[msKey]) return texts[msKey]
    if (byKey[msKey]) return byKey[msKey]
    return ''
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
const ribbonRaw = loadJson('ribbon.json')
const wazaRaw = loadJson('waza.json')
const wazaCatRaw = loadJson('wazaCategory.json')
const dictRaw = loadJson('dictionary.json')
const nameRaw = loadJson('pokemonName.json')
const formRaw = loadJson('pokemonForm.json')
const pokemonImageRaw = loadJson('pokemonImage.json')

// 构建图片 ID → icon URL 映射
const IMG_BASE = 'https://resource.pokemon-home.com/battledata/img/pokei128/'
const imageMap = {}
const imageFemaleMap = {}
for (const pi of pokemonImageRaw) {
  if (pi.dicListImage) {
    const icon = pi.dicListImage.replace(/^cap/, 'icon').replace(/_128$/, '')
    imageMap[pi.id] = `${IMG_BASE}${icon}.png`
  }
  if (pi.dicListImageFemale) {
    const icon = pi.dicListImageFemale.replace(/^cap/, 'icon').replace(/_128$/, '')
    imageFemaleMap[pi.id] = `${IMG_BASE}${icon}.png`
  }
}
const catRaw = loadJson('category.json')
const heightRaw = loadJson('height.json')
const weightRaw = loadJson('weight.json')
const descRaw = loadJson('descText.json')
const colorRaw = loadJson('color.json')
const planRaw = loadJson('plan.json')
const softRaw = loadJson('software.json')

const personalMap = {}
for (const p of personalRaw) personalMap[p.id] = p
const evoMap = {}
for (const e of evoRaw) evoMap[e.id] = e

// 缎带结构数据（不再单独输出到根目录，已按语言生成）

// ── 为每种语言生成数据 ──
for (const [langId, langName, folder, suffix] of LANGS) {
  const texts = parseTexts(folder, suffix)
  if (Object.keys(texts).length === 0) { console.log(`⚠ Skipping ${langId}: no text`); continue }
  const t = makeTranslator(texts)
  const langOut = resolve(OUT, langId)
  mkdirSync(langOut, { recursive: true })

  // 属性
  const typeMap = {}
  for (const ty of pokemonTypesRaw) {
    typeMap[ty.id] = {
      id: ty.id, name: t(ty.msname) || ty.id, color: ty.color,
      image: ty.image, sort: ty.sort,
      weakTo: ty.mdTypes2_0 || [], resistTo: ty.mdTypes0_5 || [], immuneTo: ty.mdTypes0_0 || [],
    }
  }

  // 特性
  const tokuseiMap = {}
  for (const tk of tokuseiRaw) {
    tokuseiMap[tk.id] = { id: tk.id, name: t(tk.msname), desc: t(tk.mstext) }
  }

  // 性格
  const abMap = {}
  for (const ab of abilityRaw) abMap[ab.id] = t(ab.ms)
  const natures = temperRaw.map(pe => {
    const rawDesc = t(pe.mstext)
    const desc = rawDesc.replace(/\[VAR [^\]]+\]/g, '').trim()
    return {
      id: pe.id, name: t(pe.ms),
      plus: abMap[pe.mdAbilityPlus] || '', minus: abMap[pe.mdAbilityMinus] || '',
      desc: desc || '',
    }
  })

  // 精灵球
  const balls = ballsRaw.map(b => ({ id: b.id, number: b.number, name: t(b.msText), sort: b.sort })).sort((a, b) => a.number - b.number)

  // 区域
  const regions = regionsRaw.map(r => ({ id: r.id, no: r.no, name: t(r.ms) }))

  // 招式
  const wcMap = {}
  for (const wc of wazaCatRaw) wcMap[wc.id] = t(wc.ms)
  const moves = wazaRaw.map(w => ({
    id: w.id, name: t(w.msname), desc: t(w.mstext),
    type: w.mdPokemonType, typeName: typeMap[w.mdPokemonType]?.name || '',
    typeColor: typeMap[w.mdPokemonType]?.color || '#999', category: wcMap[w.mdWazaCategory] || '',
  }))

  // 名称/形态/分类/身高/体重/描述/颜色
  const nmMap = {}; for (const n of nameRaw) nmMap[n.id] = t(n.msname)
  const fmMap = {}; for (const f of formRaw) { const v = t(f.ms); fmMap[f.id] = (v && v !== f.ms) ? v : '' }
  const ctMap = {}; for (const c of catRaw) ctMap[c.id] = t(c.msname)
  const htMap = {}; for (const h of heightRaw) htMap[h.id] = t(h.ms)
  const wtMap = {}; for (const w of weightRaw) wtMap[w.id] = t(w.ms)
  const clMap = {}; for (const c of colorRaw) clMap[c.id] = t(c.ms)

  // 构建游戏版本图鉴描述查找器
  const zukanSofts = softRaw.filter(s => s.msZukanCommentFile && s.msZukanCommentID)
  function getZukanDescs(dexNum, formNo, mdDescTextId) {
    const descEntry = descRaw.find(d => d.id === mdDescTextId)
    if (!descEntry) return []
    const allowedSofts = new Set(descEntry.mdSoftwares)
    const descs = []
    for (const sf of zukanSofts) {
      if (!allowedSofts.has(sf.id)) continue
      const gameName = t(sf.msname)
      if (!gameName) continue
      // 解析 ID 模板: "zc:ZKN_SWORD_{0:D3}_{1:D3}" 或 "zc:ZKN_SCARLET_{0:D4}_{1:D3}"
      const tmpl = sf.msZukanCommentID // e.g. "zc:ZKN_SWORD_{0:D3}_{1:D3}"
      const file = sf.msZukanCommentFile // e.g. "zukan_comment_sword"
      // 替换 {0:D3} → 3位数字, {0:D4} → 4位数字
      const key = tmpl
        .replace(/\{0:D(\d)\}/, (_, d) => String(dexNum).padStart(parseInt(d), '0'))
        .replace(/\{1:D(\d)\}/, (_, d) => String(formNo).padStart(parseInt(d), '0'))
      // key 现在是 "zc:ZKN_SWORD_001_000"，但文本 map 中的 key 是 "zukan_comment_sword:ZKN_SWORD_001_000"
      const textKey = key.replace(/^zc:/, `${file}:`)
      const desc = t(textKey)
      if (desc && desc !== textKey) descs.push({ game: gameName, desc })
    }
    return descs
  }

  // 宝可梦
  const pokemon = []
  for (const d of dictRaw) {
    const dexNum = d.dictionaryId
    if (dexNum <= 0) continue
    const psId = `PS${String(dexNum).padStart(4, '0')}${String(d.formNo || 0).padStart(3, '0')}`
    const stats = personalMap[psId]
    const evo = evoMap[d.mdEvoPatId]
    let evoChain = []
    if (evo?.mdPokemonImages?.length > 0) {
      evoChain = evo.mdPokemonImages.map(img => parseInt(img.replace('DI', '').substring(0, 4), 10))
    }
    const zukanDescs = getZukanDescs(dexNum, d.formNo || 0, d.mdDescTextId)
    const icon = imageMap[d.mdPokemonImage] || ''
    const iconFemale = imageFemaleMap[d.mdPokemonImage] || ''
    const zukanKey = `${dexNum}_${d.formNo || 0}_${d.isDMax || 0}`
    const image = zukanImageMap[zukanKey] || ''
    pokemon.push({
      id: d.id, dexNum, formNo: d.formNo || 0, icon, iconFemale, image,
      formGender: d.formGender,
      name: nmMap[d.mdNameId] || `#${dexNum}`, form: fmMap[d.mdForm] || '',
      types: (d.mdTypeIds || []).map(tid => ({ id: tid, name: typeMap[tid]?.name || '', color: typeMap[tid]?.color || '#999' })),
      category: ctMap[d.mdCateId] || '', height: htMap[d.mdHeightId] || '',
      weight: wtMap[d.mdWeightId] || '',
      color: clMap[d.mdColor] || '',
      zukanDescs,
      abilities: (d.mdTokuIds || []).map(tid => tokuseiMap[tid] ? { name: tokuseiMap[tid].name, desc: tokuseiMap[tid].desc } : null).filter(Boolean),
      stats: stats ? { hp: stats.hp, atk: stats.atk, def: stats.def, spatk: stats.spatk, spdef: stats.spdef, agi: stats.agi, total: stats.hp + stats.atk + stats.def + stats.spatk + stats.spdef + stats.agi } : null,
      evoChain, isMega: d.isMega === 1, isDMax: d.isDMax === 1, isInNumberSort: d.isInNumberSort === 1,
    })
  }
  pokemon.sort((a, b) => a.dexNum - b.dexNum || a.formNo - b.formNo)

  // 计划/版本
  const plans = planRaw.map(p => ({ id: p.id, isFree: p.isFree === 1, name: t(p.msname), info: t(p.msinfo) }))
  const softwares = softRaw.filter(s => s.msname).map(s => ({ id: s.id, romId: s.romId, gen: s.gen, name: t(s.msname), region: t(s.msregion) })).filter(s => s.name && s.name !== s.id)
  const abilities = Object.values(tokuseiMap).filter(a => a.name)
  const typeList = Object.values(typeMap).sort((a, b) => a.sort - b.sort)

  // 缎带（使用 ribbon_SV 文本，最完整）
  const ribbons = ribbonRaw.map(r => {
    const idx = String(r.order).padStart(3, '0')
    const name = t(`ribbon_SV:mes_ribbon_name_${idx}`)
    const desc = t(`ribbon_SV:mes_ribbon_info_${idx}`)
    return { id: r.id, order: r.order, image: r.image_a, name: name || '', desc: desc || '' }
  }).sort((a, b) => a.order - b.order)

  // 道具（精灵球已有，加上完整道具名称列表）
  const itemNames = []
  for (let i = 1; i <= 2000; i++) {
    const key = `itemname:ITEMNAME_${String(i).padStart(3, '0')}`
    const name = t(key)
    if (name && name !== key) itemNames.push({ id: i, name })
  }

  writeFileSync(resolve(langOut, 'pokemon.json'), JSON.stringify(pokemon))
  writeFileSync(resolve(langOut, 'types.json'), JSON.stringify(typeList))
  writeFileSync(resolve(langOut, 'moves.json'), JSON.stringify(moves))
  writeFileSync(resolve(langOut, 'natures.json'), JSON.stringify(natures))
  writeFileSync(resolve(langOut, 'balls.json'), JSON.stringify(balls))
  writeFileSync(resolve(langOut, 'regions.json'), JSON.stringify(regions))
  writeFileSync(resolve(langOut, 'plans.json'), JSON.stringify(plans))
  writeFileSync(resolve(langOut, 'softwares.json'), JSON.stringify(softwares))
  writeFileSync(resolve(langOut, 'abilities.json'), JSON.stringify(abilities))
  writeFileSync(resolve(langOut, 'ribbons.json'), JSON.stringify(ribbons))
  writeFileSync(resolve(langOut, 'items.json'), JSON.stringify(itemNames))

  console.log(`✅ ${langId} (${langName}): ${pokemon.length} pokémon, ${moves.length} moves, ${abilities.length} abilities`)
}

// 语言列表元数据
const langMeta = LANGS.map(([id, name]) => ({ id, name }))
writeFileSync(resolve(OUT, 'langs.json'), JSON.stringify(langMeta))
console.log('✅ All done!')
