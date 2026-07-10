import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import type { ClimateEntry } from "@/lib/climate"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; region: string; lat: number; lon: number
}>

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

function loadFonts() {
  const regular = readFileSync(join(process.cwd(), "public/fonts/DMSans-Regular.ttf"))
  const semibold = readFileSync(join(process.cwd(), "public/fonts/DMSans-SemiBold.ttf"))
  return { regular, semibold }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = citiesFR.find((c) => slugify(c.name) === slug)
  const fonts = loadFonts()

  if (!city) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans" }}>
        <span style={{ fontSize: 48, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
      </div>,
      { ...size, fonts: [{ name: "DM Sans", data: fonts.semibold, weight: 700 }] }
    )
  }

  const climateMap = loadClimateMap()
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const m = new Date().getMonth()
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const proj2050 = climate?.proj2050?.[m] ?? null
  const normal = climate?.normal?.[m] ?? null
  const temp = await fetchApparentTemp(city.lat, city.lon)
  const anomaly = temp !== null && normal !== null ? Math.round((temp - normal) * 10) / 10 : null

  const isHot = anomaly !== null && anomaly > 1
  const isCold = anomaly !== null && anomaly < -1

  return new ImageResponse(
    <div style={{
      width: 1200, height: 630,
      background: "#f5f4f0",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "52px 72px",
      fontFamily: "DM Sans",
    }}>

      {/* Top: breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          {city.region}
        </span>
        <span style={{ color: "#d4d4d4", fontSize: 13 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          cestchaud.fr
        </span>
      </div>

      {/* Center: city name + red bar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <span style={{
          fontSize: city.name.length > 12 ? 96 : city.name.length > 8 ? 112 : 128,
          fontWeight: 700,
          color: "#171717",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}>
          {city.name}
        </span>
        <div style={{ width: 80, height: 5, background: "#ef4444", borderRadius: 99, marginTop: 18 }} />
      </div>

      {/* Bottom: data cards + branding */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {temp !== null && (
            <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 20, padding: "16px 24px" }}>
              <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 6 }}>
                Ressenti max {monthName}
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, color: "#171717", lineHeight: 1 }}>
                {temp}°C
              </span>
              {anomaly !== null && (
                <span style={{ fontSize: 18, fontWeight: 700, color: isHot ? "#ea580c" : isCold ? "#2563eb" : "#737373", marginTop: 6 }}>
                  {anomaly > 0 ? "+" : ""}{anomaly.toFixed(1)}°C vs normale
                </span>
              )}
            </div>
          )}
          {proj2050 !== null && (
            <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 20, padding: "16px 24px" }}>
              <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 6 }}>
                GIEC 2050
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, color: proj2050 > 0 ? "#ea580c" : "#2563eb", lineHeight: 1 }}>
                {fmtDelta(proj2050)}°C
              </span>
              <span style={{ fontSize: 14, color: "#a3a3a3", marginTop: 6 }}>scénario SSP2-4.5</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
          <span style={{ fontSize: 13, color: "#a3a3a3", marginTop: 2 }}>ERA5 · CMIP6 · Open-Meteo</span>
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
