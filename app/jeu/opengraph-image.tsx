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

  return new ImageResponse(
    <div style={{
      width: 1200, height: 630,
      background: "#fdf4ff",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "52px 72px",
      fontFamily,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a855f7" }}>
          Jeu
        </span>
        <span style={{ color: "#e9d5ff" }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a3a3a3" }}>
          cestchaud.fr
        </span>
      </div>

      {/* Titre central */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <span style={{
          fontSize: 88,
          fontWeight: 700,
          color: "#3b0764",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}>
          Le jeu du jumeau climatique
        </span>
        <div style={{ width: 80, height: 5, background: "#a855f7", borderRadius: 99, marginTop: 20 }} />
        <span style={{ fontSize: 22, color: "#7e22ce", marginTop: 18, textAlign: "center" }}>
          A quel pays ressemble votre ville aujourd&apos;hui ?
        </span>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {["5 questions", "Donnees du jour", "Score a partager"].map((tag) => (
            <div key={tag} style={{ background: "#f3e8ff", borderRadius: 20, padding: "8px 16px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#7e22ce" }}>{tag}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#3b0764" }}>cestchaud.fr</span>
          <span style={{ fontSize: 13, color: "#a3a3a3", marginTop: 2 }}>Donnees ERA5 · UTCI</span>
        </div>
      </div>
    </div>,
    { ...size, fonts: fontConfig }
  )
}
