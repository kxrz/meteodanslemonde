import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "En vrai, c'est chaud — cestchaud.fr"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5f4f0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, fontSize: 64, fontWeight: 900, color: "#111", letterSpacing: "-2px", lineHeight: 1 }}>
            <span>En vrai, c’est </span>
            <span style={{ position: "relative", display: "inline-block", marginLeft: 12 }}>
              <span>chaud</span>
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 6, background: "#ef4444", borderRadius: 9999 }} />
            </span>
            <span>.</span>
          </div>
          <div style={{ marginTop: 32, fontSize: 24, color: "#737373", lineHeight: 1.5, maxWidth: 700 }}>
            Ressenti max aujourd’hui, villes jumelles dans le monde, et ce que le GIEC prédit pour 2030–2050.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["Open-Meteo", "ERA5", "CMIP6 GIEC"].map((s) => (
              <div key={s} style={{ background: "white", borderRadius: 100, padding: "8px 20px", fontSize: 14, fontWeight: 700, color: "#525252" }}>
                {s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#a3a3a3", letterSpacing: "-0.5px" }}>
            cestchaud.fr
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
