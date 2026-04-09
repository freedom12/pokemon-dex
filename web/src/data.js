import { ref, watch } from 'vue'

const cache = {}
export const currentLang = ref(localStorage.getItem('lang') || 'sch')

watch(currentLang, (v) => { localStorage.setItem('lang', v) })

async function load(name, lang) {
  const key = `${lang}/${name}`
  if (cache[key]) return cache[key]
  const res = await fetch(`${import.meta.env.BASE_URL}data/${lang}/${name}.json`)
  const data = await res.json()
  cache[key] = data
  return data
}

async function loadGlobal(name) {
  if (cache[name]) return cache[name]
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  const data = await res.json()
  cache[name] = data
  return data
}

export const getLangs = () => loadGlobal('langs')
export const getRibbons = (lang) => load('ribbons', lang || currentLang.value)

const ICON_BASE = 'https://resource.pokemon-home.com/battledata/img/pokei128/'
export const ZUKAN_IMG_BASE = 'https://zukan.pokemon.co.jp/zukan-api/up/images/index/'

async function loadPokemon(lang) {
  const key = `${lang}/pokemon`
  if (cache[key]) return cache[key]
  const res = await fetch(`${import.meta.env.BASE_URL}data/${lang}/pokemon.json`)
  const raw = await res.json()
  const data = raw.map(p => ({
    id: p.id,
    dexNum: p.n,
    formNo: p.fn,
    formGender: p.fg,
    icon: p.icon ? ICON_BASE + p.icon : '',
    iconFemale: p.icf ? ICON_BASE + p.icf : '',
    name: p.name,
    form: p.form || '',
    types: (p.types || []).map(t => ({ id: t[0], name: t[1], color: t[2] })),
    category: p.cat || '',
    height: p.ht || '',
    weight: p.wt || '',
    color: p.col || '',
    abilities: p.ab || [],
    stats: p.st ? { hp: p.st[0], atk: p.st[1], def: p.st[2], spatk: p.st[3], spdef: p.st[4], agi: p.st[5], total: p.st.reduce((a, b) => a + b, 0) } : null,
    evoChain: (p.evo || []).map(e => ({ dexNum: e[0], formNo: e[1] })),
    evoTemplate: p.evot || '',
    isMega: !!p.mg,
    isDMax: !!p.dm,
    isInNumberSort: !!p.ns,
    appearGames: p.ag || [],
  }))
  cache[key] = data
  return data
}

export const getPokemon = (lang) => loadPokemon(lang || currentLang.value)
export const getPokemonDescs = (lang) => load('pokemon-descs', lang || currentLang.value)
export const getTypes = (lang) => load('types', lang || currentLang.value)
export const getMoves = (lang) => load('moves', lang || currentLang.value)
export const getNatures = (lang) => load('natures', lang || currentLang.value)
export const getBalls = (lang) => load('balls', lang || currentLang.value)
export const getRegions = (lang) => load('regions', lang || currentLang.value)
export const getPlans = (lang) => load('plans', lang || currentLang.value)
export const getSoftwares = (lang) => load('softwares', lang || currentLang.value)
export const getAbilities = (lang) => load('abilities', lang || currentLang.value)
export const getItems = (lang) => load('items', lang || currentLang.value)
export const getDexList = (lang) => load('dexList', lang || currentLang.value)
export const getGameGroups = () => loadGlobal('gameGroups')
export const getLearnsets = () => loadGlobal('learnsets')
