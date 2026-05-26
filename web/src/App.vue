<template>
  <nav class="nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">Pokémon Dex</router-link>
      <div class="nav-links">
        <router-link to="/pokemons">宝可梦</router-link>
        <router-link to="/moves">招式</router-link>
        <router-link to="/abilities">特性</router-link>
        <router-link to="/items">道具</router-link>
        <router-link to="/natures">性格</router-link>
        <router-link to="/types">属性</router-link>
        <router-link to="/ribbons">奖章</router-link>
        <router-link to="/battle-usage">使用率</router-link>
        <router-link to="/ptcg">卡牌</router-link>
        <!-- <router-link to="/about">关于</router-link> -->
      </div>
      <IconSelect v-model="lang" :options="langOptions" placeholder="语言" hidePlaceholder class="nav-lang" />
    </div>
  </nav>
  <div class="container">
    <router-view v-slot="{ Component }" :key="lang">
      <keep-alive include="PokemonList,PtcgView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { currentLang, getLangs, type LangEntry } from './data'
import IconSelect from './components/IconSelect.vue'

const lang = currentLang
const langs = ref<LangEntry[]>([])

const langOptions = computed(() =>
  langs.value.length
    ? langs.value.map(l => ({ value: l.id, label: l.name }))
    : []
)

onMounted(async () => {
  langs.value = await getLangs()
})
</script>
