import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "La chaleur en France · cestchaud.fr"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#dbeafe",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e40af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            France · Vue d’ensemble
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-2px", lineHeight: 1 }}>
            La chaleur en France
          </div>
          <div style={{ marginTop: 28, fontSize: 24, color: "#3b82f6", lineHeight: 1.5, maxWidth: 720 }}>
            Températures actuelles, tendances ERA5 sur 30 ans et projections GIEC CMIP6 pour 36 villes françaises.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["36 villes", "ERA5 · 1991–2020", "GIEC 2050"].map((s) => (
              <div key={s} style={{ background: "white", borderRadius: 100, padding: "8px 20px", fontSize: 14, fontWeight: 700, color: "#1e40af" }}>
                {s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#60a5fa", letterSpacing: "-0.5px" }}>
            cestchaud.fr
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
