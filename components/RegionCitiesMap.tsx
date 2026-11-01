import { FRANCE_PATH, NEIGHBOURS_PATH, VIEW_H, VIEW_W, graticulePath, project } from "@/lib/france-shape"
import { regionCrop } from "@/lib/city-page"
import { anomalyHex } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import { slugify } from "@/lib/slugify"
import RegionFires from "@/components/RegionFires"

export interface RegionMapCity {
  id: string
  name: string
  lat: number
  lon: number
  /** écart du jour à la normale du mois (null si relevé indisponible) */
  anomaly: number | null
  temp: number | null
}

/**
 * Carte de région en SVG, au style Liner (même fond que l'accueil, recadré sur la région) :
 * chaque ville est un anneau rempli de la couleur de son ÉCART du jour (lib/anomaly), contour encre.
 * Le fond reprend le tracé de components/brand/LinerFrance (qui n'accepte pas de recadrage) avec des traits
 * insensibles au zoom. Pas de tuiles externes : rien à attribuer à OSM/CARTO, rien qui casse hors ligne.
 */
export default function RegionCitiesMap({ cities, showFires = false, label }: { cities: RegionMapCity[]; showFires?: boolean; label: string }) {
  const pts = cities.map((c) => project(c.lat, c.lon))
  const crop = regionCrop(pts, { minSpan: 110, ratio: 4 / 3, maxW: VIEW_W, maxH: VIEW_H })
  // Tailles calées sur un affichage mobile (≈ 358 px de large) : libellés ≥ 13 px sur téléphone.
  const s = crop.w / 358
  const r = 8 * s
  const font = 13 * s
  const dot = 5 * s

  return (
    <svg viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`} className="h-auto w-full bg-paper" role="group" aria-label={label}>
      <defs>
        <pattern id="trame-region" width={dot} height={dot} patternUnits="userSpaceOnUse">
          <rect x={dot * 0.36} y={dot * 0.36} width={dot * 0.28} height={dot * 0.28} fill="var(--color-ink)" opacity="0.55" />
        </pattern>
      </defs>
      <path d={graticulePath(1)} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="2 5" fill="none" opacity="0.45" vectorEffect="non-scaling-stroke" />
      <path d={NEIGHBOURS_PATH} stroke="var(--color-ink)" strokeWidth="1" fill="none" opacity="0.55" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={FRANCE_PATH} fill="url(#trame-region)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

      {showFires && <RegionFires crop={crop} radius={4 * s} />}

      {cities.map((c, i) => {
        const [x, y] = pts[i]
        const detail = c.anomaly != null ? `${fmtDelta(c.anomaly)} °C par rapport à la normale${c.temp != null ? `, ${fmt(c.temp, 0)} °C ressentis` : ""}` : "relevé indisponible"
        const right = x < crop.x + crop.w * 0.7
        return (
          <a key={c.id} href={`/a/${slugify(c.name)}`} aria-label={`${c.name} : ${detail}`}>
            <title>{`${c.name} : ${detail}`}</title>
            <circle cx={x} cy={y} r={r * 2.2} fill="transparent" />
            <circle cx={x} cy={y} r={r} fill={anomalyHex(c.anomaly)} stroke="var(--color-ink)" strokeWidth={r * 0.42} />
            <text
              x={right ? x + r * 1.6 : x - r * 1.6}
              y={y + font * 0.35}
              textAnchor={right ? "start" : "end"}
              fontSize={font}
              fontWeight={700}
              fill="var(--color-ink)"
              stroke="var(--color-paper)"
              strokeWidth={font * 0.28}
              paintOrder="stroke"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {c.name}
            </text>
          </a>
        )
      })}
    </svg>
  )
}
