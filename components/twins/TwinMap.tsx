import DotWorld, { makeProjection, WORLD_BOUNDS, type GeoBounds } from "@/components/brand/DotWorld"

export interface MapPoint {
  id: string
  name: string
  lat: number
  lon: number
}

const WIDTH = 720

/** Cadre carré (en degrés) autour de la ville et de ses jumeaux, avec une marge, sans sortir du planisphère. */
export function squareBounds(points: { lat: number; lon: number }[], minSpan = 40): GeoBounds {
  const lats = points.map((p) => p.lat), lons = points.map((p) => p.lon)
  const span = Math.min(
    Math.max((Math.max(...lons) - Math.min(...lons)) * 1.45, (Math.max(...lats) - Math.min(...lats)) * 1.7, minSpan),
    WORLD_BOUNDS.latMax - WORLD_BOUNDS.latMin,
  )
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
  const cLon = clamp((Math.max(...lons) + Math.min(...lons)) / 2, WORLD_BOUNDS.lonMin + span / 2, WORLD_BOUNDS.lonMax - span / 2)
  const cLat = clamp((Math.max(...lats) + Math.min(...lats)) / 2 + span * 0.06, WORLD_BOUNDS.latMin + span / 2, WORLD_BOUNDS.latMax - span / 2)
  return { lonMin: cLon - span / 2, lonMax: cLon + span / 2, latMin: cLat - span / 2, latMax: cLat + span / 2 }
}

/** Arc quadratique de a vers b, bombé vers le haut. */
export function arcPath([x1, y1]: [number, number], [x2, y2]: [number, number], lift = 0.4) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len, ny = dx / len
  if (ny > 0) { nx = -nx; ny = -ny }
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2 + nx * len * lift).toFixed(1)} ${((y1 + y2) / 2 + ny * len * lift).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

/**
 * Le planisphère en points (composant partagé DotWorld) et les repères à la Liner :
 * anneaux (cercle rempli + contour épais), trajet en pointillés jaune signal sur fond encre.
 * Tout est rendu par le serveur dans son état final ; TwinReveal anime les éléments marqués data-*.
 */
export default function TwinMap({ origin, twins, world, close }: { origin: MapPoint; twins: MapPoint[]; world: MapPoint[]; close: boolean }) {
  // Cadré sur la ville et son jumeau principal ; les suivants s'affichent s'ils tombent dans le cadre
  const bounds = squareBounds([origin, twins[0] ?? origin])
  const { project, height } = makeProjection(bounds, WIDTH)
  const o = project(origin.lat, origin.lon)
  const inBounds = (c: { lat: number; lon: number }) => c.lon >= bounds.lonMin && c.lon <= bounds.lonMax && c.lat >= bounds.latMin && c.lat <= bounds.latMax
  const placed = twins.filter((t, i) => i === 0 || inBounds(t)).map((t) => ({ ...t, p: project(t.lat, t.lon) }))
  const main = close ? placed[0] : undefined
  const others = placed.filter((t) => t !== main)
  const inside = world.filter(inBounds)
  const pct = ([x, y]: [number, number]) => ({ left: `clamp(3.5rem, ${(x / WIDTH) * 100}%, calc(100% - 3.5rem))`, top: `${(y / height) * 100}%` })

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#1b1b1a]">
      <DotWorld
        bounds={bounds}
        width={WIDTH}
        className="block h-auto w-full"
        dotColor="var(--color-paper)"
        dotOpacity={0.45}
        label={main ? `Planisphère : un trajet part de ${origin.name} et rejoint ${main.name}.` : `Planisphère : ${origin.name} et les villes du monde comparées.`}
      >
        {inside.map((c) => {
          const [x, y] = project(c.lat, c.lon)
          return <circle key={c.id} cx={x} cy={y} r="4" fill="var(--color-paper)" opacity="0.75" />
        })}
        {others.map((t) => (
          <circle key={t.id} data-ring cx={t.p[0]} cy={t.p[1]} r="8" fill="var(--color-ink)" stroke="var(--color-chaud)" strokeWidth="4" />
        ))}
        {main && (
          <>
            <path data-arc d={arcPath(o, main.p)} fill="none" stroke="var(--color-signal)" strokeWidth="4" strokeDasharray="6 7" strokeLinecap="round" />
            <circle data-ring cx={main.p[0]} cy={main.p[1]} r="13" fill="var(--color-chaud)" stroke="var(--color-paper)" strokeWidth="5" />
            <circle data-plane cx="0" cy="0" r="7" fill="var(--color-signal)" stroke="var(--color-ink)" strokeWidth="2" transform={`translate(${main.p[0]} ${main.p[1]})`} />
          </>
        )}
        <circle cx={o[0]} cy={o[1]} r="11" fill="var(--color-froid)" stroke="var(--color-paper)" strokeWidth="5" />
      </DotWorld>

      <span data-label="origin" className="pointer-events-none absolute -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full bg-froid px-2.5 py-0.5 font-display text-[13px] font-bold text-white sm:text-[15px]" style={pct(o)}>
        {origin.name}
      </span>
      {main && (
        <span data-label="twin" className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-full bg-signal px-3 py-1 font-display text-[15px] font-extrabold text-ink sm:text-[18px]" style={pct(main.p)}>
          {main.name}
        </span>
      )}
    </div>
  )
}
