// Aperçu 1200×630 d'une idée reçue (next/og) : affirmation barrée, réponse surlignée, marque.
// La story verticale 1080×1920 passe par lib/story-image.tsx.

import { ImageResponse } from "next/og"
import type { Myth } from "@/lib/myths"
import { loadBrandFonts } from "@/lib/og-fonts"
import { splitHighlight } from "@/lib/pedago"

export async function mythOgImage(myth: Myth) {
  const fonts = await loadBrandFonts().catch(() => [])
  const display = fonts.length ? "Bricolage" : "sans-serif"
  const body = fonts.length ? "DM Sans" : "sans-serif"
  const words = splitHighlight(myth.answer, myth.highlight).flatMap((p) => p.text.split(/\s+/).filter(Boolean).map((w) => ({ w, hl: p.hl })))
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f5f4f0", color: "#111111", padding: "56px 64px", fontFamily: body }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: "#5f5e58", fontWeight: 700 }}>Idée reçue</div>
          <div style={{ display: "flex", fontFamily: display, fontSize: 40, lineHeight: 1.1, color: "#5f5e58", textDecoration: "line-through", textDecorationColor: "#e3261b" }}>« {myth.claim} »</div>
          <div style={{ display: "flex", flexWrap: "wrap", fontFamily: display, fontSize: 62, lineHeight: 1.05, letterSpacing: -2 }}>
            {words.map(({ w, hl }, i) => (
              <span key={i} style={{ background: hl ? "#ffe14d" : "transparent", padding: hl ? "0 8px" : 0, marginRight: (hl && words[i + 1]?.hl) || /^[.,;:!?…]/.test(words[i + 1]?.w ?? "") ? 0 : 15 }}>{w}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 64 64">
            <path d="M46.85 17.15A21 21 0 0 0 17.15 46.85" fill="none" stroke="#e3261b" strokeWidth="14" />
            <path d="M46.85 17.15A21 21 0 0 1 17.15 46.85" fill="none" stroke="#1d4ed8" strokeWidth="14" />
          </svg>
          <span style={{ fontFamily: display, fontSize: 40, letterSpacing: -1 }}>cestchaud.fr</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  )
}
