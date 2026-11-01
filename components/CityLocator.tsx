import LinerFrance from "@/components/brand/LinerFrance"
import DotWorld, { WORLD_BOUNDS, makeProjection } from "@/components/brand/DotWorld"
import { project } from "@/lib/france-shape"
import { anomalyHex } from "@/lib/anomaly"
import { fmt } from "@/lib/format"

function coords(lat: number, lon: number) {
  return `${fmt(Math.abs(lat), 1)}° ${lat >= 0 ? "N" : "S"} · ${fmt(Math.abs(lon), 1)}° ${lon >= 0 ? "E" : "O"}`
}

/**
 * Petit localisateur SVG au style Liner, sans fond de carte externe.
 *  - ville française : la France tramée et un anneau (couleur de l'écart du jour, contour encre) ;
 *  - ville du monde : planisphère en points et le même anneau, avec le pays.
 */
export default function CityLocator({ name, lat, lon, anomaly, world, country }: {
  name: string
  lat: number
  lon: number
  anomaly: number | null
  world?: boolean
  country?: string
}) {
  const fill = anomalyHex(anomaly)
  if (!world) {
    const [x, y] = project(lat, lon)
    return (
      <figure className="flex flex-col items-center gap-1">
        <LinerFrance id="locator" className="h-auto w-full" label={`${name} sur la carte de France`}>
          <circle cx={x} cy={y} r="22" fill={fill} stroke="var(--color-ink)" strokeWidth="9" />
        </LinerFrance>
        <figcaption className="hidden font-mono text-[12px] text-mute sm:block">{coords(lat, lon)}</figcaption>
      </figure>
    )
  }
  const width = 360
  const [x, y] = makeProjection(WORLD_BOUNDS, width).project(lat, lon)
  return (
    <figure className="flex flex-col items-center gap-1">
      <DotWorld width={width} className="h-auto w-full" label={`${name}${country ? `, ${country}` : ""}, sur un planisphère`} dotOpacity={0.35}>
        <circle cx={x} cy={y} r="9" fill={fill} stroke="var(--color-ink)" strokeWidth="4" />
      </DotWorld>
      <figcaption className="hidden text-center font-mono text-[12px] text-mute sm:block">
        {country && <>{country} · </>}{coords(lat, lon)}
      </figcaption>
    </figure>
  )
}
