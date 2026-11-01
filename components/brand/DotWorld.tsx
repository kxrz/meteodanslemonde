import world from "@/data/geo/world-dots.json"

export interface GeoBounds { lonMin: number; lonMax: number; latMin: number; latMax: number }
export const WORLD_BOUNDS: GeoBounds = { lonMin: -180, lonMax: 180, latMin: -58, latMax: 80 }
/** Cadrage utile pour la plupart des jumeaux des villes françaises */
export const EURAFRICA_BOUNDS: GeoBounds = { lonMin: -30, lonMax: 60, latMin: -5, latMax: 62 }

const DOTS = world.dots as [number, number][]
const STEP = world.step as number

/** Projection équirectangulaire dans un repère de largeur `width` px pour les bornes données. */
export function makeProjection(bounds: GeoBounds, width = 720) {
  const k = width / (bounds.lonMax - bounds.lonMin)
  const height = Math.round((bounds.latMax - bounds.latMin) * k)
  return {
    width,
    height,
    k,
    project: (lat: number, lon: number): [number, number] => [(lon - bounds.lonMin) * k, (bounds.latMax - lat) * k],
  }
}

/**
 * Planisphère « en points » (style Liner) : une grille de points posée sur les terres émergées.
 * Composant serveur : il dessine le fond ; les repères et animations se posent en `children`
 * (dans le même repère : utiliser `makeProjection(bounds, width).project`).
 */
export default function DotWorld({ bounds = WORLD_BOUNDS, width = 720, className, label, children, dotColor = "var(--color-ink)", dotOpacity = 0.28 }: {
  bounds?: GeoBounds
  width?: number
  className?: string
  label?: string
  children?: React.ReactNode
  dotColor?: string
  dotOpacity?: number
}) {
  const { height, k, project } = makeProjection(bounds, width)
  const r = Math.max(0.6, Math.min(2.2, (STEP * k) * 0.3))
  const rr = r.toFixed(2)
  const visible = DOTS.filter(([lon, lat]) => lon >= bounds.lonMin && lon <= bounds.lonMax && lat >= bounds.latMin && lat <= bounds.latMax)
  // un seul <path> pour des milliers de points : léger à rendre
  const d = visible.map(([lon, lat]) => {
    const [x, y] = project(lat, lon)
    return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(1)} 0a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(1)} 0`
  }).join("")
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={d} fill={dotColor} opacity={dotOpacity} />
      {children}
    </svg>
  )
}
