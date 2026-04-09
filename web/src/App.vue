<template>
  <nav class="nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">Pokémon HOME Data</router-link>
      <div class="nav-links">
        <router-link to="/pokedex">图鉴</router-link>
        <router-link to="/moves">招式</router-link>
        <router-link to="/abilities">特性</router-link>
        <router-link to="/items">道具</router-link>
        <router-link to="/natures">性格</router-link>
        <router-link to="/types">属性</router-link>
        <router-link to="/ribbons">奖章</router-link>
        <!-- <router-link to="/about">关于</router-link> -->
      </div>
      <select class="lang-select" v-model="lang" v-if="langs.length">
        <option v-for="l in langs" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
    </div>
  </nav>
  <div class="container">
    <router-view v-slot="{ Component }" :key="lang">
      <keep-alive include="Pokedex">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { currentLang, getLangs } from './data.js'

const lang = currentLang
const langs = ref([])

onMounted(async () => {
  langs.value = await getLangs()
})
</script>
