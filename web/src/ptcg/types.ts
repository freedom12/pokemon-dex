export interface SerieBrief { id: string; name: string; logo?: string }
export interface SetBrief { id: string; name: string; logo?: string; symbol?: string; cardCount?: { total: number; official: number } }
export interface SerieDetail { id: string; name: string; logo?: string; sets: SetBrief[] }
export interface CardBrief { id: string; localId: string; name: string; image?: string }

export interface CardDetail {
  id: string
  localId: string | number
  name: string
  image?: string
  category: 'Pokemon' | 'Trainer' | 'Energy'
  hp?: number
  rarity?: string
  types?: string[]
  stage?: string
  suffix?: string
  evolveFrom?: string
  description?: string
  illustrator?: string
  retreat?: number
  regulationMark?: string
  dexId?: number[]
  level?: string
  set?: { id: string; name: string; logo?: string; symbol?: string }
  attacks?: { name: string; damage?: string | number; effect?: string; cost?: string[] }[]
  abilities?: { type: string; name: string; effect: string }[]
  weaknesses?: { type: string; value: string }[]
  resistances?: { type: string; value: string }[]
  item?: { name: string; effect: string }
  variants?: { normal: boolean; reverse: boolean; holo: boolean; firstEdition: boolean }
  legal?: { standard: boolean; expanded: boolean }
  // Trainer / Energy
  effect?: string
  trainerType?: string
  energyType?: string
  // Pricing
  pricing?: {
    cardmarket?: {
      updated?: string; unit?: string
      avg?: number; low?: number; trend?: number
      avg1?: number; avg7?: number; avg30?: number
      'avg-holo'?: number; 'low-holo'?: number; 'trend-holo'?: number
    }
    tcgplayer?: {
      updated?: string; unit?: string
      normal?: { lowPrice?: number; midPrice?: number; highPrice?: number; marketPrice?: number }
      holofoil?: { lowPrice?: number; midPrice?: number; highPrice?: number; marketPrice?: number }
      reverse?: { lowPrice?: number; midPrice?: number; highPrice?: number; marketPrice?: number }
    }
  }
}
