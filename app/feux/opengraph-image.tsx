import { ImageResponse } from "next/og"
import { loadOgFonts } from "@/lib/og-fonts"
import { fetchFireSummary } from "@/lib/fire-data"

export const runtime = "nodejs"
export const revalidate = 3600
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const [fonts, summary] = await Promise.all([
    loadOgFonts().catch(() => null),
    fetchFireSummary().catch(() => null),
  ])

  const fontConfig = fonts
    ? [
        { name: "DM Sans", data: fonts.regular, weight: 400 as const },
        { name: "DM Sans", data: fonts.semibold, weight: 700 as const },
      ]
    : []
  const fontFamily = fonts ? "DM Sans" : "sans-serif"

  const total = summary?.activeCount ?? 0

  return new ImageResponse(
    <div style={{
      width: 1200, height: 630,
      background: "#f5f4f0",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "52px 72px",
      fontFamily,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          Anomalies thermiques
        </span>
        <span style={{ color: "#d4d4d4" }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          cestchaud.fr
        </span>
      </div>

      {/* Titre central */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <span style={{
          fontSize: 112,
          fontWeight: 700,
          color: "#171717",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}>
          Anomalies thermiques
        </span>
        <div style={{ width: 80, height: 5, background: "#f97316", borderRadius: 99, marginTop: 18 }} />
      </div>

      {/* Cartes données + branding */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", background: "#431407", borderRadius: 20, padding: "16px 24px" }}>
            <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fed7aa", marginBottom: 6 }}>
              Zones détectées
            </span>
            <span style={{ fontSize: 64, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
              {total}
            </span>
            <span style={{ fontSize: 14, color: "#fb923c", marginTop: 6 }}>7 derniers jours</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 20, padding: "16px 24px" }}>
            <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 6 }}>
              Source
            </span>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#171717", lineHeight: 1.2 }}>
              NASA FIRMS
            </span>
            <span style={{ fontSize: 14, color: "#a3a3a3", marginTop: 6 }}>VIIRS · mis à jour toutes les heures</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
          <span style={{ fontSize: 13, color: "#a3a3a3", marginTop: 2 }}>Lecture satellite NASA FIRMS</span>
        </div>
      </div>
    </div>,
    { ...size, fonts: fontConfig }
  )
}
