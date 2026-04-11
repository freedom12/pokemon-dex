<template>
  <nav class="nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">Pokémon HOME Data</router-link>
      <div class="nav-links">
        <router-link to="/pokemons">宝可梦</router-link>
        <router-link to="/moves">招式</router-link>
        <router-link to="/abilities">特性</router-link>
        <router-link to="/items">道具</router-link>
        <router-link to="/natures">性格</router-link>
        <router-link to="/types">属性</router-link>
        <router-link to="/ribbons">奖章</router-link>
        <router-link to="/battle-usage">使用率</router-link>
        <!-- <router-link to="/about">关于</router-link> -->
      </div>
      <select class="lang-select" v-model="lang" v-if="langs.length">
        <option v-for="l in langs" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
    </div>
  </nav>
  <div class="container">
    <router-view v-slot="{ Component }" :key="lang">
      <keep-alive include="Pokemons">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { currentLang, getLangs, type LangEntry } from './data'

const lang = currentLang
const langs = ref<LangEntry[]>([])

onMounted(async () => {
  langs.value = await getLangs()
})
</script>
