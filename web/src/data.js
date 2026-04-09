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

export const getPokemon = (lang) => load('pokemon', lang || currentLang.value)
export const getTypes = (lang) => load('types', lang || currentLang.value)
export const getMoves = (lang) => load('moves', lang || currentLang.value)
export const getNatures = (lang) => load('natures', lang || currentLang.value)
export const getBalls = (lang) => load('balls', lang || currentLang.value)
export const getRegions = (lang) => load('regions', lang || currentLang.value)
export const getPlans = (lang) => load('plans', lang || currentLang.value)
export const getSoftwares = (lang) => load('softwares', lang || currentLang.value)
export const getAbilities = (lang) => load('abilities', lang || currentLang.value)
export const getItems = (lang) => load('items', lang || currentLang.value)
