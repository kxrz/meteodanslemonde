import { ImageResponse } from "next/og"
import { slugify } from "@/lib/slugify"
import { loadClimateMap } from "@/lib/climate"
import { fmtDelta } from "@/lib/format"
import type { ClimateEntry } from "@/lib/climate"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

function getCityBySlug(slug: string) {
  return citiesFR.find((c) => slugify(c.name) === slug) ?? null
}

export async function generateStaticParams() {
  return citiesFR.map((c) => ({ slug: slugify(c.name) }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = getCityBySlug(slug)

  if (!city) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: "#111", fontFamily: "sans-serif" }}>
        cestchaud.fr
      </div>,
      { ...size }
    )
  }

  const climateMap = loadClimateMap()
  const climate = (climateMap[city.id] ?? null) as ClimateEntry
  const m = new Date().getMonth()
  const proj2050 = climate?.proj2050?.[m] ?? null
  const normal = climate?.normal?.[m] ?? null
  const trend = climate?.trend?.[m] ?? null
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" })

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#f5f4f0", display: "flex", fontFamily: "sans-serif" }}>

        {/* Left */}
        <div style={{ flex: "0 0 55%", background: "#dbeafe", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 56px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              {city.region}
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-3px", lineHeight: 1 }}>
              {city.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 8 }}>
              {normal !== null && (
                <div style={{ fontSize: 20, color: "#3b82f6" }}>
                  Normale {monthName} : {Math.round(normal)}°C (1991–2020)
                </div>
              )}
              {trend !== null && (
                <div style={{ fontSize: 20, color: "#3b82f6" }}>
                  Tendance 30 ans : {fmtDelta(trend)}°C
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#93c5fd", display: "flex" }}>
            cestchaud.fr
          </div>
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 56px", gap: 8 }}>
          {proj2050 !== null ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#a855f7", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                GIEC 2050 · SSP2-4.5
              </div>
              <div style={{ fontSize: 100, fontWeight: 900, color: "#6b21a8", letterSpacing: "-4px", lineHeight: 1, display: "flex" }}>
                {fmtDelta(proj2050)}°C
              </div>
              <div style={{ fontSize: 18, color: "#a855f7", display: "flex" }}>
                vs. 2000–2020
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 48, fontWeight: 900, color: "#d4d4d4", display: "flex" }}>—</div>
          )}
        </div>

      </div>
    ),
    { ...size }
  )
}
