import { ImageResponse } from "next/og"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; region: string
}>

const REGION_LABELS: Record<string, string> = {
  "bretagne": "Bretagne",
  "occitanie": "Occitanie",
  "provence-alpes-cote-d-azur": "Provence-Alpes-Côte d'Azur",
  "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes",
  "nouvelle-aquitaine": "Nouvelle-Aquitaine",
  "hauts-de-france": "Hauts-de-France",
  "ile-de-france": "Île-de-France",
  "grand-est": "Grand Est",
  "pays-de-la-loire": "Pays de la Loire",
  "bourgogne-franche-comte": "Bourgogne-Franche-Comté",
  "normandie": "Normandie",
  "centre-val-de-loire": "Centre-Val de Loire",
  "corse": "Corse",
}

export default async function Image({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params
  const label = REGION_LABELS[region]

  if (!label) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: "#171717" }}>cestchaud.fr</span>
      </div>
    )
  }

  const climateMap = loadClimateMap()
  const m = new Date().getMonth()

  const cities = citiesFR.filter((c) => c.region === label)
  const trends = cities
    .map((c) => climateMap[c.id]?.trend)
    .filter(Boolean)
    .map((t) => t!.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0) / t!.filter((v): v is number => v !== null).length)

  const avgTrend = trends.length ? trends.reduce((s, v) => s + v, 0) / trends.length : null

  const maxNormal = cities
    .map((c) => ({ name: c.name, normal: climateMap[c.id]?.normal?.[m] ?? null }))
    .filter((c) => c.normal !== null)
    .sort((a, b) => (b.normal ?? 0) - (a.normal ?? 0))[0] ?? null

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, background: "#f5f4f0", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#737373", marginBottom: 16 }}>
          France · cestchaud.fr
        </span>
        <span style={{ fontSize: 72, fontWeight: 900, color: "#171717", lineHeight: 1 }}>
          {label}
        </span>
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
        {avgTrend !== null && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#737373", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tendance ERA5 annuelle</span>
            <span style={{ fontSize: 96, fontWeight: 900, color: avgTrend > 0 ? "#ef4444" : "#3b82f6", lineHeight: 1 }}>{fmtDelta(avgTrend)}°C</span>
            <span style={{ fontSize: 18, color: "#737373", marginTop: 8 }}>depuis 1990 · {cities.length} villes</span>
          </div>
        )}
        {maxNormal && (
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#737373", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Ville la plus chaude</span>
            <span style={{ fontSize: 48, fontWeight: 900, color: "#171717", lineHeight: 1 }}>{maxNormal.name}</span>
            <span style={{ fontSize: 24, color: "#ea580c", fontWeight: 700, marginTop: 8 }}>{maxNormal.normal?.toFixed(1)}°C normale</span>
          </div>
        )}
      </div>
    </div>,
    { ...size }
  )
}
