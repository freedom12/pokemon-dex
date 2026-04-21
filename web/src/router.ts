import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory('/pokedex/'),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/pokemons' },
    { path: '/pokemons', component: () => import('./views/PokemonList.vue') },
    { path: '/pokemon/:id', component: () => import('./views/PokemonDetail.vue'), props: true },
    { path: '/moves', component: () => import('./views/MoveList.vue') },
    { path: '/abilities', component: () => import('./views/AbilityList.vue') },
    { path: '/types', component: () => import('./views/TypeList.vue') },
    { path: '/natures', component: () => import('./views/NatureList.vue') },
    { path: '/items', component: () => import('./views/ItemList.vue') },
    { path: '/ribbons', component: () => import('./views/RibbonList.vue') },
    { path: '/battle-usage', component: () => import('./views/BattleUsage.vue') },
    { path: '/ptcg', component: () => import('./views/PtcgView.vue') },
    { path: '/ptcg/serie/:serieId', component: () => import('./views/PtcgView.vue') },
    { path: '/ptcg/set/:setId(.*)', component: () => import('./views/PtcgView.vue') },
    { path: '/ptcg/card/:id(.*)', component: () => import('./views/PtcgCardDetail.vue'), props: true },
    { path: '/about', component: () => import('./views/About.vue') },
  ],
})
