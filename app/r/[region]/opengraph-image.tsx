import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"
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

function loadFonts() {
  const regular = readFileSync(join(process.cwd(), "public/fonts/DMSans-Regular.ttf"))
  const semibold = readFileSync(join(process.cwd(), "public/fonts/DMSans-SemiBold.ttf"))
  return { regular, semibold }
}

export default async function Image({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params
  const label = REGION_LABELS[region]
  const fonts = loadFonts()

  if (!label) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans" }}>
        <span style={{ fontSize: 48, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
      </div>,
      { ...size, fonts: [{ name: "DM Sans", data: fonts.semibold, weight: 700 }] }
    )
  }

  const climateMap = loadClimateMap()
  const m = new Date().getMonth()
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  const cities = citiesFR.filter((c) => c.region === label)

  const trends = cities
    .map((c) => climateMap[c.id]?.trend)
    .filter(Boolean)
    .map((t) => t!.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0) / t!.filter((v): v is number => v !== null).length)

  const avgTrend = trends.length ? trends.reduce((s, v) => s + v, 0) / trends.length : null

  const hottestCity = cities
    .map((c) => ({ name: c.name, normal: climateMap[c.id]?.normal?.[m] ?? null }))
    .filter((c) => c.normal !== null)
    .sort((a, b) => (b.normal ?? 0) - (a.normal ?? 0))[0] ?? null

  return new ImageResponse(
    <div style={{
      width: 1200, height: 630,
      background: "#f5f4f0",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "52px 72px",
      fontFamily: "DM Sans",
    }}>

      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          France
        </span>
        <span style={{ color: "#d4d4d4" }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          cestchaud.fr
        </span>
      </div>

      {/* Center: region name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <span style={{
          fontSize: label.length > 20 ? 72 : label.length > 12 ? 88 : 112,
          fontWeight: 700,
          color: "#171717",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}>
          {label}
        </span>
        <div style={{ width: 80, height: 5, background: "#ef4444", borderRadius: 99, marginTop: 18 }} />
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {avgTrend !== null && (
            <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 20, padding: "16px 24px" }}>
              <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 6 }}>
                Tendance ERA5 annuelle
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, color: avgTrend > 0 ? "#ea580c" : "#2563eb", lineHeight: 1 }}>
                {fmtDelta(avgTrend)}°C
              </span>
              <span style={{ fontSize: 14, color: "#a3a3a3", marginTop: 6 }}>depuis 1990 · {cities.length} villes</span>
            </div>
          )}
          {hottestCity && (
            <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 20, padding: "16px 24px" }}>
              <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 6 }}>
                Ville la plus chaude en {monthName}
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, color: "#171717", lineHeight: 1 }}>
                {hottestCity.name}
              </span>
              <span style={{ fontSize: 14, color: "#a3a3a3", marginTop: 6 }}>{hottestCity.normal?.toFixed(1)}°C normale</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
          <span style={{ fontSize: 13, color: "#a3a3a3", marginTop: 2 }}>ERA5 · CMIP6</span>
        </div>
      </div>

    </div>,
    {
      ...size,
      fonts: [
        { name: "DM Sans", data: fonts.regular, weight: 400 },
        { name: "DM Sans", data: fonts.semibold, weight: 700 },
      ],
    }
  )
}
