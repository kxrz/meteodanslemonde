// Images de partage 1200×630 des pages Jumeaux 2050 et du jeu, aux couleurs de la marque.

import { ImageResponse } from "next/og"
import { loadBrandFonts } from "@/lib/og-fonts"

export const OG_SIZE = { width: 1200, height: 630 }

export async function twinsOg({ eyebrow, before, highlight, after, sub }: { eyebrow: string; before: string; highlight: string; after: string; sub: string }) {
  const fonts = await loadBrandFonts().catch(() => [])
  const display = fonts.length ? "Bricolage" : "sans-serif"
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111111", color: "#f5f4f0", padding: "64px 72px", fontFamily: fonts.length ? "DM Sans" : "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: "#ffe14d", fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ display: "flex", flexWrap: "wrap", fontFamily: display, fontSize: 92, lineHeight: 1, letterSpacing: -3 }}>
          <span>{before}</span>
          <span style={{ color: "#ffe14d", padding: "0 18px" }}>{highlight}</span>
          <span>{after}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 28, color: "#c9c7bf", maxWidth: 820 }}>{sub}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: display, fontSize: 44, letterSpacing: -1 }}>cestchaud</span>
            <svg width="54" height="54" viewBox="0 0 64 64">
              <path d="M46.85 17.15A21 21 0 0 0 17.15 46.85" fill="none" stroke="#e3261b" strokeWidth="14" />
              <path d="M46.85 17.15A21 21 0 0 1 17.15 46.85" fill="none" stroke="#5b8cff" strokeWidth="14" />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  )
}
