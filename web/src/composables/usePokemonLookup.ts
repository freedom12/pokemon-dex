import { ref } from 'vue'
import type { Pokemon } from '../types'

// learnsets 的原始数据结构类型
export type VgData = {
  'level-up'?: Array<{ move: number }>
  machine?: number[]
  egg?: number[]
  tutor?: number[]
}
export type Learnsets = Record<string, Record<string, Record<string, VgData>>>

/**
 * 统一的宝可梦弹窗查找 composable。
 * 消除了以下文件中完全相同的查找逻辑：
 *   - MoveList.vue (lookupMove)
 *   - LearnsetPanel.vue (lookupMove)
 *   - AbilityList.vue (lookupAbility)
 *   - PokemonDetail.vue (lookupAbility)
 */
export function usePokemonLookup() {
  const lookupVisible = ref(false)
  const lookupTitle = ref('')
  const lookupResults = ref<Pokemon[]>([])

  function closeLookup() {
    lookupVisible.value = false
  }

  /** 查找拥有指定特性的所有基础形态宝可梦 */
  function lookupByAbility(abilityName: string, allPokemon: Pokemon[]) {
    const seen = new Set<number>()
    const results: Pokemon[] = []
    for (const p of allPokemon) {
      if (p.formNo !== 0) continue
      if (p.abilities.includes(abilityName) && !seen.has(p.dexNum)) {
        seen.add(p.dexNum)
        results.push(p)
      }
    }
    results.sort((a, b) => a.dexNum - b.dexNum)
    lookupTitle.value = `拥有「${abilityName}」特性的宝可梦 (${results.length})`
    lookupResults.value = results
    lookupVisible.value = true
  }

  /** 查找可学习指定招式编号的所有基础形态宝可梦 */
  function lookupByMove(
    moveNum: number,
    moveName: string,
    allLearnsets: Learnsets,
    allPokemon: Pokemon[],
  ) {
    const seen = new Set<number>()
    const results: Pokemon[] = []
    for (const [dexNum, speciesData] of Object.entries(allLearnsets)) {
      let found = false
      outer: for (const formData of Object.values(speciesData)) {
        for (const vgData of Object.values(formData)) {
          const allMoveIds = [
            ...(vgData['level-up'] ?? []).map(e => e.move),
            ...(vgData.machine ?? []),
            ...(vgData.egg ?? []),
            ...(vgData.tutor ?? []),
          ]
          if (allMoveIds.includes(moveNum)) { found = true; break outer }
        }
      }
      if (found) {
        const num = parseInt(dexNum, 10)
        if (!seen.has(num)) {
          const p = allPokemon.find(pk => pk.dexNum === num && pk.formNo === 0)
          if (p) { seen.add(num); results.push(p) }
        }
      }
    }
    results.sort((a, b) => a.dexNum - b.dexNum)
    lookupTitle.value = `可学习「${moveName}」的宝可梦 (${results.length})`
    lookupResults.value = results
    lookupVisible.value = true
  }

  return { lookupVisible, lookupTitle, lookupResults, closeLookup, lookupByAbility, lookupByMove }
}
