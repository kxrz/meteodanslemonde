// Images partageables d'une idée reçue (next/og) : story verticale 1080×1920 et carte 1200×630.
// Affirmation barrée, réponse avec son passage surligné, marque.

import { ImageResponse } from "next/og"
import type { Myth } from "@/lib/myths"
import { loadOgFonts } from "@/lib/og-fonts"
import { splitHighlight } from "@/lib/pedago"

const INK = "#111111", SIGNAL = "#ffe14d", CHAUD = "#e3261b"

async function fonts() {
  const f = await loadOgFonts().catch(() => null)
  return {
    family: f ? "DM Sans" : "sans-serif",
    config: f ? [
      { name: "DM Sans", data: f.regular, weight: 400 as const },
      { name: "DM Sans", data: f.semibold, weight: 700 as const },
    ] : [],
  }
}

/** L'anneau de l'écart : un « ° » moitié chaud, moitié froid (cf. components/brand/Mark). */
function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.4 }}>
      <div style={{ display: "flex", width: size, height: size, borderRadius: size, border: `${size * 0.22}px solid ${CHAUD}`, borderLeftColor: "#1d4ed8", borderBottomColor: "#1d4ed8", transform: "rotate(45deg)" }} />
      <span style={{ fontSize: size * 1.1, fontWeight: 700, letterSpacing: -1 }}>cestchaud.fr</span>
    </div>
  )
}

function Answer({ myth, size }: { myth: Myth; size: number }) {
  const words = splitHighlight(myth.answer, myth.highlight).flatMap((p) => p.text.split(/\s+/).filter(Boolean).map((w) => ({ w, hl: p.hl })))
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1.5 }}>
      {words.map(({ w, hl }, i) => {
        const joined = hl && words[i + 1]?.hl
        return (
          <span key={i} style={{ background: hl ? INK : "transparent", color: hl ? SIGNAL : INK, padding: hl ? `0 ${size * 0.12}px` : 0, marginRight: joined ? 0 : size * 0.24 }}>{w}</span>
        )
      })}
    </div>
  )
}

function Claim({ myth, size }: { myth: Myth; size: number }) {
  return (
    <div style={{ display: "flex", position: "relative", fontSize: size, fontWeight: 700, lineHeight: 1.1, color: "rgba(17,17,17,0.55)", letterSpacing: -1 }}>
      <span style={{ textDecoration: "line-through", textDecorationColor: CHAUD }}>« {myth.claim} »</span>
    </div>
  )
}

export async function mythStoryImage(myth: Myth) {
  const { family, config } = await fonts()
  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", justifyContent: "space-between", background: SIGNAL, color: INK, padding: "120px 90px", fontFamily: family }}>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>Idée reçue</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 70 }}>
          <Claim myth={myth} size={76} />
          <div style={{ display: "flex", width: 160, height: 14, background: CHAUD }} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>En vrai</div>
          <Answer myth={myth} size={98} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 34 }}>Les chiffres de votre ville :</span>
          <Brand size={56} />
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: config, headers: { "Content-Disposition": `inline; filename="cestchaud-${myth.slug}.png"` } },
  )
}

export async function mythOgImage(myth: Myth) {
  const { family, config } = await fonts()
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", background: SIGNAL, color: INK, padding: "56px 64px", fontFamily: family }}>
        <Claim myth={myth} size={40} />
        <Answer myth={myth} size={60} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent" }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: INK }}>Idée reçue</span>
          <Brand size={36} />
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: config },
  )
}

