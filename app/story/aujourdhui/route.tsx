import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { storyImage } from "@/lib/story-image"
import { fmtDelta } from "@/lib/format"
import { MONTHS, deMonth } from "@/lib/season"
import { anomalyHex } from "@/lib/anomaly"
import { FRANCE_PATH, NEIGHBOURS_PATH, VIEW_H, VIEW_W, project } from "@/lib/france-shape"

export const runtime = "nodejs"
export const revalidate = 86400

/** Story du jour : l'écart moyen de la France à la normale du mois. */
export async function GET() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climate = loadClimateMap()
  const date = new Date(fetchedAt)
  const month = date.getMonth()
  const points = citiesFR
    .filter((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)
    .map((c) => {
      const n = climate[c.id]?.normal?.[month]
      return n == null ? null : { c, a: c.apparent_temp_max - n }
    })
    .filter((p): p is NonNullable<typeof p> => p != null)
  const anomalies = points.map((p) => p.a)
  const visual = (
    <svg width="860" height={Math.round((860 * VIEW_H) / VIEW_W)} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <path d={NEIGHBOURS_PATH} fill="none" stroke="#111111" strokeWidth="1" opacity="0.4" />
      <path d={FRANCE_PATH} fill="#ebe9e2" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
      {points.map(({ c, a }) => {
        const [x, y] = project(c.lat, c.lon)
        return <circle key={c.id} cx={x} cy={y} r="10" fill={anomalyHex(a)} stroke="#111111" strokeWidth="2.5" />
      })}
    </svg>
  )
  const avg = anomalies.length ? anomalies.reduce((a, b) => a + b, 0) / anomalies.length : null
  const above = anomalies.filter((a) => a >= 0.5).length
  const day = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  if (avg == null) {
    return storyImage({ eyebrow: day, headline: "L'écart à la normale, ville par ville.", highlight: "l'écart", tone: "signal" })
  }
  const value = `${fmtDelta(avg)} °C`
  return storyImage({
    eyebrow: `Aujourd'hui · ${day}`,
    headline: `La France est à ${value} de la normale ${deMonth(month)}.`,
    highlight: value,
    tone: avg >= 0 ? "chaud" : "froid",
    sub: `${above} villes sur ${anomalies.length} au-dessus de la normale.`,
    footer: `cestchaud.fr · normales ${MONTHS[month]} 1991-2020`,
    visual,
  })
}
