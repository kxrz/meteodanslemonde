// Fond de carte de la France, style « Liner » (LesWWW) : graticule en pointillés, voisins en trait fin,
// la France en trait épais remplie d'une trame de points, les villes en anneaux.
// Contours issus de github.com/kxrz/leswww-liner (licence MIT), construits par scripts/build-geo.mjs.

import geo from "@/data/geo/france.json"

type LonLat = [number, number]

export const BOUNDS = { latMin: 41.2, latMax: 51.25, lonMin: -5.2, lonMax: 9.8 }
const K = Math.cos((46.5 * Math.PI) / 180)
export const PX_PER_DEG = 62
const PAD = 10

export const VIEW_W = Math.round((BOUNDS.lonMax - BOUNDS.lonMin) * K * PX_PER_DEG) + PAD * 2
export const VIEW_H = Math.round((BOUNDS.latMax - BOUNDS.latMin) * PX_PER_DEG) + PAD * 2

/** (lat, lon) → (x, y) dans le repère SVG de la carte */
export function project(lat: number, lon: number): [number, number] {
  return [PAD + (lon - BOUNDS.lonMin) * K * PX_PER_DEG, PAD + (BOUNDS.latMax - lat) * PX_PER_DEG]
}

function ringsToPath(rings: LonLat[][]): string {
  return rings.map((r) => r.map(([lon, lat], i) => {
    const [x, y] = project(lat, lon)
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join("") + "Z").join("")
}

export const FRANCE_RINGS = geo.france as LonLat[][]
export const NEIGHBOUR_RINGS = geo.neighbours as LonLat[][]

/** Tracés prêts à l'emploi (calculés une fois) */
export const FRANCE_PATH = ringsToPath(FRANCE_RINGS)
export const NEIGHBOURS_PATH = ringsToPath(NEIGHBOUR_RINGS)

/** Graticule tous les `step` degrés, à tracer en pointillés */
export function graticulePath(step = 2): string {
  let d = ""
  for (let lon = Math.ceil(BOUNDS.lonMin / step) * step; lon <= BOUNDS.lonMax; lon += step) {
    const [x] = project(0, lon)
    d += `M${x.toFixed(1)} 0V${VIEW_H}`
  }
  for (let lat = Math.ceil(BOUNDS.latMin / step) * step; lat <= BOUNDS.latMax; lat += step) {
    const [, y] = project(lat, 0)
    d += `M0 ${y.toFixed(1)}H${VIEW_W}`
  }
  return d
}

// ── Compatibilité avec la première version (anneaux en [lat, lon]) ──
const byArea = [...FRANCE_RINGS].sort((a, b) => b.length - a.length)
export const FRANCE_OUTLINE: [number, number][] = byArea[0].map(([lon, lat]) => [lat, lon])
export const CORSICA_OUTLINE: [number, number][] = (FRANCE_RINGS.find((r) => r[0][0] > 8) ?? byArea[1]).map(([lon, lat]) => [lat, lon])

export function outlinePath(points: [number, number][]): string {
  return points.map(([lat, lon], i) => {
    const [x, y] = project(lat, lon)
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ") + " Z"
}
