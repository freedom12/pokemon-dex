/** 进化树节点（已解析的宝可梦精简信息） */
export interface EvoNode {
  id: string
  dexNum: number
  formNo: number
  name: string
  form: string
  icon: string
  types: Array<{ id: string; name: string; color: string }>
}

/** 分支节点：branches 中每项是单个节点或节点链 */
export interface EvoBranchNode {
  isBranchStart?: true
  branches: Array<EvoNode | EvoNode[]>
}

export type EvoTreeItem = EvoNode | EvoBranchNode

/**
 * 根据进化模板字符串将线性节点数组构建为进化树。
 * 这是一个纯函数，不依赖任何 Vue 响应式状态。
 *
 * 模板类型说明：
 *   Eevee  → 1 → N 分支（伊布家族）
 *   3B     → A → (B | C)
 *   4B     → A → B → (C | D)
 *   4C     → A → (B | C | D)
 *   4D     → A → (B | C), C → D
 *   5A     → A → (B | D), B → C, D → E
 *   5B     → A → (B | C | D), D → E
 *   默认   → 线性链
 */
export function buildEvoTree(nodes: EvoNode[], template: string): EvoTreeItem[] {
  if (!nodes || nodes.length <= 1) return nodes ?? []
  const t = template || ''

  if (t.includes('Eevee')) {
    return [nodes[0], { branches: nodes.slice(1) }]
  }
  if (t.includes('3B') && nodes.length === 3) {
    return [nodes[0], { branches: [nodes[1], nodes[2]] }]
  }
  if (t.includes('4B') && nodes.length === 4) {
    return [nodes[0], nodes[1], { branches: [nodes[2], nodes[3]] }]
  }
  if (t.includes('4C') && nodes.length === 4) {
    return [nodes[0], { branches: [nodes[1], nodes[2], nodes[3]] }]
  }
  if (t.includes('4D') && nodes.length === 4) {
    return [nodes[0], { branches: [nodes[1], [nodes[2], nodes[3]]] }]
  }
  if (t.includes('5A') && nodes.length >= 5) {
    return [nodes[0], { branches: [[nodes[1], nodes[2]], [nodes[3], nodes[4]]] }]
  }
  if (t.includes('5B') && nodes.length >= 5) {
    return [nodes[0], { branches: [nodes[1], nodes[2], [nodes[3], nodes[4]]] }]
  }
  return nodes
}
