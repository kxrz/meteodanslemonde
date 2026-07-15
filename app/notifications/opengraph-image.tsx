import { ImageResponse } from "next/og"
import { loadOgFonts } from "@/lib/og-fonts"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const fonts = await loadOgFonts().catch(() => null)

  const fontConfig = fonts
    ? [
        { name: "DM Sans", data: fonts.regular, weight: 400 as const },
        { name: "DM Sans", data: fonts.semibold, weight: 700 as const },
      ]
    : []
  const fontFamily = fonts ? "DM Sans" : "sans-serif"

  const features = [
    "Ressenti max du jour",
    "Anomalie vs normale ERA5",
    "Alerte canicule",
    "Jumeau climatique mondial",
    "Projections GIEC 2050",
  ]

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
          Briefing matinal
        </span>
        <span style={{ color: "#d4d4d4" }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          cestchaud.fr
        </span>
      </div>

      {/* Titre + tagline */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#171717",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            Votre météo climatique,
          </span>
          <span style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#f97316",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            chaque matin.
          </span>
        </div>
        <div style={{ width: 80, height: 5, background: "#f97316", borderRadius: 99 }} />
      </div>

      {/* Features + branding */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        {/* Liste features */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 720 }}>
          {features.map((f) => (
            <div key={f} style={{
              background: "#111111",
              borderRadius: 99,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}>
              {f}
            </div>
          ))}
        </div>

        {/* Branding */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, marginLeft: 32 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#171717" }}>cestchaud.fr</span>
          <span style={{ fontSize: 13, color: "#a3a3a3", marginTop: 2 }}>Email quotidien · gratuit</span>
        </div>
      </div>
    </div>,
    { ...size, fonts: fontConfig }
  )
}
