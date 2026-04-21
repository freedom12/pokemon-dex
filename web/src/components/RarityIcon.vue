<template>
  <span class="rarity-icon" :title="rarity">
    <img
      v-if="!errored"
      :src="imgUrl"
      :alt="rarity"
      :style="{ height: sz + 'px' }"
      class="rarity-img"
      @error="errored = true"
    />
    <span v-else class="rarity-fallback">{{ rarity }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  rarity: string
  size?: number
}>()

const sz = computed(() => props.size ?? 18)
const errored = ref(false)

const imgUrl = computed(() =>
  `https://s3.pokeos.com/pokeos-uploads/tcg/eng/rarity/${encodeURIComponent(props.rarity)}.png?v=1`
)

watch(() => props.rarity, () => { errored.value = false })
</script>

<style scoped>
.rarity-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.rarity-img {
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
}
.rarity-fallback {
  font-size: 13px;
  color: var(--text2);
}
</style>
