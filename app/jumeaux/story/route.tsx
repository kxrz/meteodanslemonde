import type { NextRequest } from "next/server"
import { makeProjection } from "@/components/brand/DotWorld"
import { arcPath, squareBounds } from "@/components/twins/TwinMap"
import worldDots from "@/data/geo/world-dots.json"
import { cityFromSlug, twinsOf, WORLD_CITIES } from "@/lib/twins-data"
import { storyImage } from "@/lib/story-image"
import { fmt } from "@/lib/format"

export const runtime = "nodejs"

/** Planisphère en points simplifié (cercles + arc, sans motif), dans le même repère que DotWorld. Encre sur papier. */
function MapVisual({ origin, twin, size }: { origin: { lat: number; lon: number }; twin: { lat: number; lon: number } | null; size: number }) {
  const bounds = squareBounds(twin ? [origin, twin] : [origin])
  const { project, k } = makeProjection(bounds, size)
  const r = Math.max(1.5, Math.min(4, k * 0.3))
  const dots = (worldDots.dots as [number, number][]).filter(([lon, lat]) => lon >= bounds.lonMin && lon <= bounds.lonMax && lat >= bounds.latMin && lat <= bounds.latMax)
  const o = project(origin.lat, origin.lon)
  const t = twin ? project(twin.lat, twin.lon) : null
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {dots.map(([lon, lat], i) => {
        const [x, y] = project(lat, lon)
        return <circle key={i} cx={x} cy={y} r={r} fill="#111111" fillOpacity="0.28" />
      })}
      {WORLD_CITIES.map((c) => {
        const [x, y] = project(c.lat, c.lon)
        return <circle key={c.id} cx={x} cy={y} r="6" fill="#111111" fillOpacity="0.6" />
      })}
      {t && <path d={arcPath(o, t)} fill="none" stroke="#111111" strokeWidth="7" strokeDasharray="12 12" strokeLinecap="round" />}
      {t && <circle cx={t[0]} cy={t[1]} r="20" fill="#e3261b" stroke="#111111" strokeWidth="8" />}
      <circle cx={o[0]} cy={o[1]} r="17" fill="#1d4ed8" stroke="#111111" strokeWidth="8" />
    </svg>
  )
}

/** Story verticale 1080×1920 : « Paris en 2050, c'est Séville aujourd'hui. » */
export async function GET(req: NextRequest) {
  const city = cityFromSlug(req.nextUrl.searchParams.get("ville"))
  const res = twinsOf(city)
  const twin = res?.hasCloseTwin ? res.top[0] : null
  const geo = twin ? WORLD_CITIES.find((w) => w.id === twin.id)! : null
  if (!twin) {
    return storyImage({
      eyebrow: "Jumeau 2050",
      headline: `${city.name} en 2050 n'a pas de jumeau proche dans nos 67 villes.`,
      highlight: "pas de jumeau proche",
      tone: "signal",
      footer: "cestchaud.fr/jumeaux",
      visual: <MapVisual origin={city} twin={null} size={760} />,
    })
  }
  return storyImage({
    eyebrow: "Jumeau 2050",
    headline: `${city.name} en 2050, c'est ${twin.name} aujourd'hui.`,
    highlight: twin.name,
    tone: "chaud",
    sub: `Même climat à ${fmt(twin.rmse)} °C près, mois par mois. Et votre ville ?`,
    footer: "cestchaud.fr/jumeaux",
    visual: <MapVisual origin={city} twin={geo} size={760} />,
  })
}
