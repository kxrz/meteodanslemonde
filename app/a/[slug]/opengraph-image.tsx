import { ImageResponse } from "next/og"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import type { ClimateEntry } from "@/lib/climate"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; region: string; lat: number; lon: number }>

async function fetchApparentTemp(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=apparent_temperature_max&forecast_days=1`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Math.round(data.daily.apparent_temperature_max[0]) as number
  } catch { return null }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = citiesFR.find((c) => slugify(c.name) === slug)

  if (!city) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: "#171717" }}>cestchaud.fr</span>
      </div>
    )
  }

  const climateMap = loadClimateMap()
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const m = new Date().getMonth()
  const proj2050 = climate?.proj2050?.[m] ?? null
  const normal = climate?.normal?.[m] ?? null
  const temp = await fetchApparentTemp(city.lat, city.lon)
  const anomaly = temp !== null && normal !== null ? Math.round((temp - normal) * 10) / 10 : null

  const bgColor = anomaly === null ? "#f5f4f0"
    : anomaly > 4 ? "#fecaca"
    : anomaly > 1 ? "#fde68a"
    : anomaly < -2 ? "#bfdbfe"
    : "#f5f4f0"

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, background: bgColor, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#737373", marginBottom: 16 }}>
          {city.region} · cestchaud.fr
        </span>
        <span style={{ fontSize: 72, fontWeight: 900, color: "#171717", lineHeight: 1 }}>
          {city.name}
        </span>
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
        {temp !== null && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#737373", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Ressenti max</span>
            <span style={{ fontSize: 96, fontWeight: 900, color: "#171717", lineHeight: 1 }}>{temp}°C</span>
            {anomaly !== null && (
              <span style={{ fontSize: 24, fontWeight: 700, color: anomaly > 0 ? "#ea580c" : "#2563eb", marginTop: 8 }}>
                {anomaly > 0 ? "+" : ""}{anomaly.toFixed(1)}°C vs normale
              </span>
            )}
          </div>
        )}
        {proj2050 !== null && (
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#737373", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>GIEC 2050</span>
            <span style={{ fontSize: 64, fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{fmtDelta(proj2050)}°C</span>
          </div>
        )}
      </div>
    </div>,
    { ...size }
  )
}
