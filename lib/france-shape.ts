// Silhouette simplifiée de la France métropolitaine (lat, lon), assumée comme un pictogramme :
// l'« hexagone » de la marque. Suffisant pour placer 62 villes, pas pour de la cartographie fine.

export const FRANCE_OUTLINE: [number, number][] = [
  [51.09, 2.55], [50.95, 1.6], [50.37, 1.55], [50.06, 1.4], [49.72, 0.18], [49.43, 0.2], [49.3, -0.4],
  [49.38, -1.1], [49.72, -1.3], [49.65, -1.95], [49.2, -1.6], [48.65, -1.4], [48.68, -2.0], [48.53, -2.75],
  [48.86, -3.2], [48.68, -4.05], [48.62, -4.75], [48.36, -4.78], [48.0, -4.5], [47.8, -4.0], [47.6, -3.1],
  [47.3, -2.5], [47.1, -2.15], [46.75, -1.95], [46.3, -1.25], [45.9, -1.15], [45.55, -1.15], [44.65, -1.2],
  [44.0, -1.35], [43.55, -1.5], [43.38, -1.78], [43.05, -1.4], [42.8, -0.3], [42.7, 0.7], [42.5, 1.7],
  [42.43, 3.15], [43.0, 3.05], [43.3, 3.55], [43.52, 4.2], [43.35, 4.85], [43.2, 5.5], [43.08, 6.15],
  [43.25, 6.75], [43.55, 7.05], [43.78, 7.52], [44.15, 7.66], [44.45, 6.9], [45.1, 7.1], [45.9, 7.0],
  [46.4, 6.8], [46.15, 6.2], [46.6, 6.12], [47.1, 6.9], [47.5, 7.0], [47.6, 7.55], [48.1, 7.6],
  [48.98, 8.2], [49.15, 6.75], [49.5, 6.35], [49.6, 5.8], [49.85, 4.85], [50.15, 4.2], [50.3, 4.0],
  [50.6, 3.3], [50.8, 2.75], [51.09, 2.55],
]

export const CORSICA_OUTLINE: [number, number][] = [
  [43.0, 9.45], [42.6, 9.55], [42.1, 9.55], [41.4, 9.2], [41.6, 8.8], [41.95, 8.6], [42.35, 8.55], [42.7, 9.1], [43.0, 9.45],
]

export const BOUNDS = { latMin: 41.3, latMax: 51.15, lonMin: -5.0, lonMax: 9.7 }
const K = Math.cos((46.5 * Math.PI) / 180)
export const PX_PER_DEG = 62

export const VIEW_W = Math.round((BOUNDS.lonMax - BOUNDS.lonMin) * K * PX_PER_DEG) + 20
export const VIEW_H = Math.round((BOUNDS.latMax - BOUNDS.latMin) * PX_PER_DEG) + 20

export function project(lat: number, lon: number): [number, number] {
  return [10 + (lon - BOUNDS.lonMin) * K * PX_PER_DEG, 10 + (BOUNDS.latMax - lat) * PX_PER_DEG]
}

export function outlinePath(points: [number, number][]): string {
  return points.map(([lat, lon], i) => {
    const [x, y] = project(lat, lon)
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ") + " Z"
}
