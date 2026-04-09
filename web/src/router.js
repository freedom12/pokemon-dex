import { createRouter, createWebHistory } from 'vue-router'
import Pokedex from './views/Pokedex.vue'
import PokemonDetail from './views/PokemonDetail.vue'
import MoveDex from './views/MoveDex.vue'
import TypeChart from './views/TypeChart.vue'
import NatureChart from './views/NatureChart.vue'
import AbilityDex from './views/AbilityDex.vue'
import ItemDex from './views/ItemDex.vue'
import RibbonDex from './views/RibbonDex.vue'
import About from './views/About.vue'

export default createRouter({
  history: createWebHistory('/pokedex/'),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/pokemons' },
    { path: '/pokemons', component: Pokedex },
    { path: '/pokemon/:id', component: PokemonDetail, props: true },
    { path: '/moves', component: MoveDex },
    { path: '/abilities', component: AbilityDex },
    { path: '/types', component: TypeChart },
    { path: '/natures', component: NatureChart },
    { path: '/items', component: ItemDex },
    { path: '/ribbons', component: RibbonDex },
    { path: '/about', component: About },
  ],
})
