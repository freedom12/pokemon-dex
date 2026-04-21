<template>
  <div
    class="holo-card"
    :class="{ interacting }"
    :style="rotateStyle"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div class="holo-card__rotator">
      <img :src="src" :alt="alt" class="holo-card__img" loading="lazy" />
      <div class="holo-card__shine" :style="shineStyle"></div>
      <div class="holo-card__glare" :style="glareStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{ src: string; alt?: string }>()

const interacting = ref(false)
const rotateX = ref(0)
const rotateY = ref(0)
const pointerX = ref(50)
const pointerY = ref(50)
const opacity = ref(0)

const rotateStyle = computed(() => ({
  '--rx': `${rotateX.value}deg`,
  '--ry': `${rotateY.value}deg`,
}))

const shineStyle = computed(() => ({
  background: `radial-gradient(circle at ${pointerX.value}% ${pointerY.value}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 30%, transparent 60%)`,
  opacity: opacity.value,
}))

const glareStyle = computed(() => ({
  background: `radial-gradient(circle at ${pointerX.value}% ${pointerY.value}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 20%, transparent 55%)`,
  opacity: opacity.value,
}))

function clamp(val: number, min = 0, max = 100) {
  return Math.min(Math.max(val, min), max)
}

function onMove(e: PointerEvent) {
  interacting.value = true
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = clamp(((e.clientX - rect.left) / rect.width) * 100)
  const y = clamp(((e.clientY - rect.top) / rect.height) * 100)

  rotateX.value = -((x - 50) / 4)
  rotateY.value = (y - 50) / 4
  pointerX.value = x
  pointerY.value = y
  opacity.value = 0.85
}

function onLeave() {
  interacting.value = false
  rotateX.value = 0
  rotateY.value = 0
  pointerX.value = 50
  pointerY.value = 50
  opacity.value = 0
}
</script>

<style scoped>
.holo-card {
  perspective: 800px;
  display: inline-block;
  width: 100%;
}

.holo-card__rotator {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transform-style: preserve-3d;
  transform: rotateY(var(--rx)) rotateX(var(--ry));
  transition: transform 0.4s ease;
  will-change: transform;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.holo-card.interacting .holo-card__rotator {
  transition: transform 0.05s ease-out;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}

.holo-card__img {
  width: 100%;
  display: block;
  border-radius: 8px;
}

.holo-card__shine {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  pointer-events: none;
  mix-blend-mode: soft-light;
  transition: opacity 0.4s ease;
}

.holo-card.interacting .holo-card__shine {
  transition: opacity 0.05s ease-out;
}

.holo-card__glare {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  pointer-events: none;
  mix-blend-mode: overlay;
  transition: opacity 0.4s ease;
}

.holo-card.interacting .holo-card__glare {
  transition: opacity 0.05s ease-out;
}
</style>
