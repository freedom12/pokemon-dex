import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import PokemonList from './views/PokemonList.vue'
import PokemonDetail from './views/PokemonDetail.vue'
import MoveList from './views/MoveList.vue'
import TypeList from './views/TypeList.vue'
import NatureList from './views/NatureList.vue'
import AbilityList from './views/AbilityList.vue'
import ItemList from './views/ItemList.vue'
import RibbonList from './views/RibbonList.vue'
import About from './views/About.vue'
import BattleUsage from './views/BattleUsage.vue'

export default createRouter({
  history: createWebHistory('/pokedex/'),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/pokemons' },
    { path: '/pokemons', component: PokemonList },
    { path: '/pokemon/:id', component: PokemonDetail, props: true },
    { path: '/moves', component: MoveList },
    { path: '/abilities', component: AbilityList },
    { path: '/types', component: TypeList },
    { path: '/natures', component: NatureList },
    { path: '/items', component: ItemList },
    { path: '/ribbons', component: RibbonList },
    { path: '/battle-usage', component: BattleUsage },
    { path: '/about', component: About },
  ],
})
