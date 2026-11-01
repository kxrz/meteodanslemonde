import { ImageResponse } from "next/og"
import { loadBrandFonts } from "@/lib/og-fonts"

/**
 * Image verticale 1080×1920 au format story (TikTok, Instagram, WhatsApp), aux couleurs de la marque.
 * `headline` : la phrase forte ; `highlight` : le morceau à surligner (doit apparaître dans `headline`).
 * `struck` : une affirmation affichée barrée au-dessus (idées reçues).
 */
export async function storyImage({ eyebrow, struck, headline, highlight, tone = "chaud", sub, footer = "cestchaud.fr", visual }: {
  eyebrow: string
  struck?: string
  headline: string
  highlight?: string
  tone?: "chaud" | "froid" | "signal"
  sub?: string
  footer?: string
  /** illustration placée entre le texte et le pied (SVG inline, largeur 900 px max) */
  visual?: React.ReactNode
}) {
  const fonts = await loadBrandFonts().catch(() => [])
  const hl = { chaud: "#ffc9b3", froid: "#c9dafc", signal: "#ffe14d" }[tone]
  // Découpage mot par mot (Satori ne coupe pas les lignes à l'intérieur d'un bloc flex) :
  // la ponctuation reste collée au mot qui la précède, le surlignage suit les mots concernés.
  const hasHl = Boolean(highlight && headline.includes(highlight))
  const parts = hasHl ? headline.split(highlight!) : [headline]
  const words: { w: string; hl: boolean }[] = []
  parts.forEach((part, i) => {
    part.split(/\s+/).filter(Boolean).forEach((w) => {
      if (/^[.,;:!?…»)]+$/.test(w) && words.length) words[words.length - 1].w += w
      else words.push({ w, hl: false })
    })
    if (hasHl && i < parts.length - 1) {
      highlight!.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, hl: true }))
    }
  })
  // ponctuation qui suit immédiatement le surlignage (« … +4,8 °C. »)
  for (let i = words.length - 1; i > 0; i--) {
    if (/^[.,;:!?…»)]+/.test(words[i].w) && !words[i].hl && words[i - 1].hl && !/\s/.test(words[i].w)) {
      const m = words[i].w.match(/^[.,;:!?…»)]+/)![0]
      if (m === words[i].w) { words[i - 1].w += m; words.splice(i, 1) }
    }
  }
  const display = fonts.length ? "Bricolage" : "sans-serif"
  const body = fonts.length ? "DM Sans" : "sans-serif"
  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f5f4f0", color: "#111111", padding: "110px 90px 100px", fontFamily: body }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, textTransform: "uppercase", color: "#5f5e58", fontWeight: 700 }}>{eyebrow}</div>
          {struck && (
            <div style={{ display: "flex", fontFamily: display, fontSize: 64, lineHeight: 1.08, color: "#5f5e58", textDecoration: "line-through", textDecorationColor: "#e3261b" }}>
              « {struck} »
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", fontFamily: display, fontSize: 112, lineHeight: 1.04, letterSpacing: -3, columnGap: 26, rowGap: 6 }}>
            {words.map((t, i) => (
              <span key={i} style={t.hl ? { background: hl, padding: "0 13px", margin: "0 -13px" } : {}}>{t.w}</span>
            ))}
          </div>
          {sub && <div style={{ display: "flex", fontSize: 44, lineHeight: 1.3, color: "#3d3d3a" }}>{sub}</div>}
        </div>
        {visual && <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div>}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontFamily: display, fontSize: 64, letterSpacing: -2 }}>cestchaud</div>
            <div style={{ display: "flex", fontSize: 34, color: "#5f5e58" }}>{footer}</div>
          </div>
          <svg width="150" height="150" viewBox="0 0 64 64">
            <path d="M46.85 17.15A21 21 0 0 0 17.15 46.85" fill="none" stroke="#e3261b" strokeWidth="14" />
            <path d="M46.85 17.15A21 21 0 0 1 17.15 46.85" fill="none" stroke="#1d4ed8" strokeWidth="14" />
          </svg>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  )
}
