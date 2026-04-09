/**
 * Download Pokémon HOME game icons from Bulbagarden Archives
 * and save them with internal software IDs as filenames.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'img', 'game_icon')
mkdirSync(OUT, { recursive: true })

// Mapping: Bulbagarden filename keyword → internal software ID
const ICONS = [
  // SF024 - X
  { url: 'https://archives.bulbagarden.net/media/upload/7/73/HOME_X_icon.png', id: 'SF024' },
  // SF025 - Y
  { url: 'https://archives.bulbagarden.net/media/upload/d/d5/HOME_Y_icon.png', id: 'SF025' },
  // SF026 - Alpha Sapphire
  { url: 'https://archives.bulbagarden.net/media/upload/e/e3/HOME_Alpha_Sapphire_icon.png', id: 'SF026' },
  // SF027 - Omega Ruby
  { url: 'https://archives.bulbagarden.net/media/upload/b/b7/HOME_Omega_Ruby_icon.png', id: 'SF027' },
  // SF030 - Sun
  { url: 'https://archives.bulbagarden.net/media/upload/7/7c/HOME_Sun_icon.png', id: 'SF030' },
  // SF031 - Moon
  { url: 'https://archives.bulbagarden.net/media/upload/2/25/HOME_Moon_icon.png', id: 'SF031' },
  // SF032 - Ultra Sun
  { url: 'https://archives.bulbagarden.net/media/upload/b/be/HOME_Ultra_Sun_icon.png', id: 'SF032' },
  // SF033 - Ultra Moon
  { url: 'https://archives.bulbagarden.net/media/upload/b/bb/HOME_Ultra_Moon_icon.png', id: 'SF033' },
  // SF034 - GO
  { url: 'https://archives.bulbagarden.net/media/upload/4/44/HOME_GO_icon.png', id: 'SF034' },
  // SF042 - Let's Go Pikachu
  { url: 'https://archives.bulbagarden.net/media/upload/1/19/HOME_Let%27s_Go_Pikachu_icon.png', id: 'SF042' },
  // SF043 - Let's Go Eevee
  { url: 'https://archives.bulbagarden.net/media/upload/3/3f/HOME_Let%27s_Go_Eevee_icon.png', id: 'SF043' },
  // SF044 - Sword
  { url: 'https://archives.bulbagarden.net/media/upload/f/fe/HOME_Sword_icon.png', id: 'SF044' },
  // SF045 - Shield
  { url: 'https://archives.bulbagarden.net/media/upload/c/c8/HOME_Shield_icon.png', id: 'SF045' },
  // SF046 - HOME
  { url: 'https://archives.bulbagarden.net/media/upload/c/cc/HOME_HOME_icon.png', id: 'SF046' },
  // SF047 - Legends Arceus
  { url: 'https://archives.bulbagarden.net/media/upload/b/ba/HOME_Legends_Arceus_icon.png', id: 'SF047' },
  // SF048 - Brilliant Diamond
  { url: 'https://archives.bulbagarden.net/media/upload/c/cf/HOME_Brilliant_Diamond_icon.png', id: 'SF048' },
  // SF049 - Shining Pearl
  { url: 'https://archives.bulbagarden.net/media/upload/7/75/HOME_Shining_Pearl_icon.png', id: 'SF049' },
  // SF050 - Scarlet
  { url: 'https://archives.bulbagarden.net/media/upload/2/29/HOME_Scarlet_icon.png', id: 'SF050' },
  // SF051 - Violet
  { url: 'https://archives.bulbagarden.net/media/upload/9/92/HOME_Violet_icon.png', id: 'SF051' },
  // SF052 - Legends Z-A
  { url: 'https://archives.bulbagarden.net/media/upload/4/4c/HOME_Legends_Z-A_icon.png', id: 'SF052' },
  // SF053 - Champions (Pokémon TCG Pocket)
  { url: 'https://archives.bulbagarden.net/media/upload/6/65/HOME_Champions_icon.png', id: 'SF053' },
  // SF000 - Bank
  { url: 'https://archives.bulbagarden.net/media/upload/f/f7/HOME_Bank_icon.png', id: 'SF000' },
]

for (const { url, id } of ICONS) {
  const outPath = resolve(OUT, `${id}.png`)
  if (existsSync(outPath)) {
    console.log(`⏭ ${id}.png already exists`)
    continue
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://archives.bulbagarden.net/' } })
    if (!res.ok) { console.log(`❌ ${id}: HTTP ${res.status}`); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(outPath, buf)
    console.log(`✅ ${id}.png (${buf.length} bytes)`)
  } catch (e) {
    console.log(`❌ ${id}: ${e.message}`)
  }
}
console.log('Done!')
