// Construit les fonds de carte « en points » du site à partir des contours de pays
// du projet Liner (LesWWW, licence MIT) : https://github.com/kxrz/leswww-liner/blob/main/lib/countries.json
//
// Usage : node scripts/build-geo.mjs /chemin/vers/leswww-liner/lib/countries.json
// Sorties (petites, versionnées) :
//   data/geo/france.json      contours de la France métropolitaine + pays voisins, [lon, lat] arrondis à 0,01°
//   data/geo/world-dots.json  grille de points (pas de 1°) posés sur les terres émergées

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = process.argv[2]
if (!src) {
  console.error("Usage : node scripts/build-geo.mjs <countries.json de leswww-liner>")
  process.exit(1)
}
const countries = JSON.parse(readFileSync(src, "utf8"))

const bbox = (ring) => {
  const b = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of ring) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y) }
  return b
}
const intersects = (b, box) => b[2] >= box[0] && b[0] <= box[2] && b[3] >= box[1] && b[1] <= box[3]
const round = (ring) => ring.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100])

// ── France métropolitaine + voisins ──
const METRO = [-5.5, 41, 10, 51.5]
const VIEW = [-7, 40.3, 12, 52.2]
const france = countries.FR.rings.filter((r) => intersects(bbox(r), METRO)).map(round)
const neighbours = []
for (const [code, c] of Object.entries(countries)) {
  if (code === "FR") continue
  for (const r of c.rings) if (intersects(bbox(r), VIEW)) neighbours.push(round(r))
}
mkdirSync(join(root, "data/geo"), { recursive: true })
writeFileSync(join(root, "data/geo/france.json"), JSON.stringify({ source: "leswww-liner (MIT)", view: VIEW, france, neighbours }))

// ── Planisphère en points ──
const rings = []
for (const c of Object.values(countries)) for (const r of c.rings) rings.push({ r, b: bbox(r) })
function inRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const STEP = 1
const dots = []
for (let lat = 80; lat >= -58; lat -= STEP) {
  for (let lon = -180 + STEP / 2; lon < 180; lon += STEP) {
    if (rings.some(({ r, b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inRing(lon, lat, r))) dots.push([lon, lat])
  }
}
writeFileSync(join(root, "data/geo/world-dots.json"), JSON.stringify({ source: "leswww-liner (MIT)", step: STEP, dots }))

console.log(`france: ${france.length} contours, ${neighbours.length} voisins · monde: ${dots.length} points`)
