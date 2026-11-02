import { ImageResponse } from "next/og"
import { loadBrandFonts } from "@/lib/og-fonts"
import { splitHighlight } from "@/lib/og-words"
import { ANOMALY_STEPS } from "@/lib/anomaly"
import { FRANCE_PATH, NEIGHBOURS_PATH, VIEW_H, VIEW_W } from "@/lib/france-shape"
import { cityFromSlug, twinsOf } from "@/lib/twins-data"
import { loadClimateFull, smoothedAt } from "@/lib/climate-season"
import { fmt, fmtDelta } from "@/lib/format"
import world from "@/data/geo/world-dots.json"

// Le concept de cestchaud.fr en 7 slides, deux formats :
//   « 16x9 »     1920 × 1080 (présentation)
//   « linkedin » 1080 × 1350 (carrousel LinkedIn, 4:5)
// Chaque slide défend une idée. Les chiffres sont ceux du site (normales ERA5, jumeaux 2050).

export type SlideFormat = "16x9" | "linkedin"
export const SLIDE_FORMATS: Record<SlideFormat, { width: number; height: number; label: string }> = {
  "16x9": { width: 1920, height: 1080, label: "16:9" },
  linkedin: { width: 1080, height: 1350, label: "LinkedIn 4:5" },
}

const C = {
  paper: "#f5f4f0", paperDeep: "#ebe9e2", ink: "#111111", inkSoft: "#3d3d3a", mute: "#5f5e58",
  chaud: "#e3261b", froid: "#1d4ed8", signal: "#ffe14d", hlChaud: "#ffc9b3", hlFroid: "#c9dafc", hlSignal: "#ffe98a",
}

// ── Données réelles utilisées par les slides ──
function lyonExample() {
  const lyon = loadClimateFull().lyon
  const normal = lyon?.normal?.[10] ?? 8 // novembre
  const trend = smoothedAt(lyon?.trend, 10) ?? 1.4
  const today = normal + 5 // une journée à +5 °C : exemple pédagogique
  return { normal, trend, today, weather: today - normal - trend }
}
function parisTwin() {
  const r = twinsOf(cityFromSlug("paris"))
  return r?.top[0]?.name ?? "Istanbul"
}

export interface Slide {
  key: string
  eyebrow: string
  headline: string
  highlight?: string
  tone: "chaud" | "froid" | "signal"
  sub: string
  visual: (w: number, h: number) => React.ReactNode
}

function words(headline: string, highlight: string | undefined, tone: Slide["tone"], size: number) {
  const hl = { chaud: C.hlChaud, froid: C.hlFroid, signal: C.signal }[tone]
  const pad = Math.round(size * 0.12)
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Bricolage", fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.028, columnGap: pad * 2, rowGap: Math.round(size * 0.06) }}>
      {splitHighlight(headline, highlight).map((t, i) => (
        <span key={i} style={t.hl ? { background: hl, padding: `0 ${pad}px`, margin: `0 -${pad}px` } : {}}>{t.w}</span>
      ))}
    </div>
  )
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M46.85 17.15A21 21 0 0 0 17.15 46.85" fill="none" stroke={C.chaud} strokeWidth="14" />
      <path d="M46.85 17.15A21 21 0 0 1 17.15 46.85" fill="none" stroke={C.froid} strokeWidth="14" />
    </svg>
  )
}

function Chip({ text, bg, color = C.ink, size }: { text: string; bg: string; color?: string; size: number }) {
  return <div style={{ display: "flex", background: bg, color, borderRadius: 999, padding: `${size * 0.18}px ${size * 0.5}px`, fontFamily: "Bricolage", fontSize: size }}>{text}</div>
}

export function buildSlides(): Slide[] {
  const ly = lyonExample()
  const twin = parisTwin()
  const dots = world.dots as [number, number][]

  return [
    {
      key: "concept",
      eyebrow: "cestchaud.fr · le concept",
      headline: "En vrai, c'est chaud. Même en hiver.",
      highlight: "chaud",
      tone: "chaud",
      sub: "Chaque jour, 62 villes françaises comparées à ce qui est normal pour la saison. Pour lire le climat sans jargon, en gras, et toute l'année.",
      visual: (w, h) => {
        const s = Math.min(w / VIEW_W, h / VIEW_H)
        return (
          <div style={{ display: "flex", position: "relative", width: VIEW_W * s, height: VIEW_H * s }}>
            <svg width={VIEW_W * s} height={VIEW_H * s} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
              <path d={NEIGHBOURS_PATH} fill="none" stroke={C.ink} strokeWidth="1.2" opacity="0.35" />
              <path d={FRANCE_PATH} fill={C.paperDeep} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
            </svg>
            <div style={{ display: "flex", position: "absolute", left: VIEW_W * s * 0.36, top: VIEW_H * s * 0.34 }}><Mark size={VIEW_W * s * 0.3} /></div>
          </div>
        )
      },
    },
    {
      key: "ecart",
      eyebrow: "Principe 1 · l'écart d'abord",
      headline: "Le thermomètre ment par omission.",
      highlight: "ment par omission",
      tone: "froid",
      sub: `${fmt(ly.today, 0)} °C en novembre à Lyon : froid ou doux ? La normale y est de ${fmt(ly.normal, 0)} °C. C'est donc ${fmtDelta(ly.today - ly.normal, 0)} °C. Sur le site, l'écart passe toujours avant le chiffre brut.`,
      visual: (w, h) => {
        const big = Math.min(w * 0.22, h * 0.34, 230)
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: big * 0.25 }}>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: big, color: C.mute, textDecoration: "line-through", textDecorationColor: C.chaud }}>{fmt(ly.today, 0)}{"\u202f"}°C</div>
            <div style={{ display: "flex", alignItems: "center", gap: big * 0.2 }}>
              <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: big * 0.5, color: C.ink }}>→</div>
              <Chip text={`${fmtDelta(ly.today - ly.normal, 0)}\u202f°C`} bg={C.chaud} color="#fff" size={big * 0.8} />
            </div>
            <div style={{ display: "flex", fontSize: big * 0.17, color: C.inkSoft }}>par rapport à un mois de novembre normal (1991-2020)</div>
          </div>
        )
      },
    },
    {
      key: "meteo-climat",
      eyebrow: "Principe 2 · météo ou climat",
      headline: "Une journée ne fait pas le climat.",
      highlight: "ne fait pas le climat",
      tone: "chaud",
      sub: "On sépare ce que 30 ans de réchauffement ont déjà ajouté à la normale, et ce que la journée ajoute par-dessus. Un matin froid ne contredit pas la tendance.",
      visual: (w) => {
        const bw = w * 0.9
        const scale = bw / (ly.today - ly.normal + 2)
        const box = (label: string, value: string, bg: string, color = C.ink) => (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: bg, color, borderRadius: 24, padding: w * 0.03, gap: 6 }}>
            <div style={{ display: "flex", fontSize: w * 0.04 }}>{label}</div>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: w * 0.068, whiteSpace: "nowrap" }}>{value}</div>
          </div>
        )
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: w * 0.05, width: bw }}>
            <div style={{ display: "flex", alignItems: "center", height: w * 0.08 }}>
              <div style={{ display: "flex", width: 8, height: w * 0.12, background: C.ink, borderRadius: 4 }} />
              <div style={{ display: "flex", width: ly.trend * scale, height: w * 0.045, background: "#fb923c", borderRadius: 999 }} />
              <div style={{ display: "flex", width: ly.weather * scale, height: w * 0.045, background: C.chaud, borderRadius: 999, marginLeft: 6 }} />
            </div>
            <div style={{ display: "flex", gap: w * 0.025 }}>
              {box("Normale", `${fmt(ly.normal, 0)}\u202f°C`, C.paperDeep)}
              {box("Climat", `${fmtDelta(ly.trend)}\u202f°C`, C.hlChaud)}
              {box("Météo", `${fmtDelta(ly.weather)}\u202f°C`, C.hlSignal)}
            </div>
          </div>
        )
      },
    },
    {
      key: "echelle",
      eyebrow: "Principe 3 · une seule échelle",
      headline: "Même couleur en janvier et en juillet.",
      highlight: "Même couleur",
      tone: "signal",
      sub: "Rouge au-dessus de la normale, bleu en dessous, neuf pas centrés sur zéro. Une seule échelle sur toutes les cartes et tous les graphiques : on n'a pas à réapprendre la légende.",
      visual: (w) => (
        <div style={{ display: "flex", flexDirection: "column", gap: w * 0.03, width: w * 0.92 }}>
          <div style={{ display: "flex", height: w * 0.12, borderRadius: 24, overflow: "hidden" }}>
            {ANOMALY_STEPS.map((s) => <div key={s.key} style={{ display: "flex", flex: 1, background: s.hex }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Bricolage", fontSize: w * 0.06 }}>
            <span style={{ color: C.froid }}>−6 °C</span><span>normale</span><span style={{ color: C.chaud }}>+6 °C</span>
          </div>
        </div>
      ),
    },
    {
      key: "idees-recues",
      eyebrow: "Principe 4 · les idées reçues",
      headline: "« Il gèle, donc… » Non.",
      highlight: "Non.",
      tone: "signal",
      sub: "Chaque idée reçue reçoit une réponse en une phrase, les données de votre ville et une source vérifiable. Format court, pensé pour le téléphone et le partage.",
      visual: (w) => (
        <div style={{ display: "flex", flexDirection: "column", gap: w * 0.04, background: C.signal, borderRadius: 32, padding: w * 0.06, width: w * 0.92 }}>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: w * 0.052, color: C.mute, textDecoration: "line-through", textDecorationColor: C.chaud }}>« Il gèle ce matin. Le réchauffement, c'est du flan. »</div>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: w * 0.075, lineHeight: 1.05, color: C.ink }}>Une journée froide, c'est de la météo. Le climat, c'est 30 ans.</div>
        </div>
      ),
    },
    {
      key: "jumeaux",
      eyebrow: "Principe 5 · 2050, concrètement",
      headline: `Paris en 2050, c'est ${twin} aujourd'hui.`,
      highlight: twin,
      tone: "chaud",
      sub: `Le climat projeté de chaque ville française (médiane des modèles CMIP6) est comparé, mois par mois, aux normales actuelles de 67 villes du monde. Le plus proche est son jumeau.`,
      visual: (w, h) => {
        const b = { lonMin: -15, lonMax: 45, latMin: 25, latMax: 60 }
        const k = Math.min(w / (b.lonMax - b.lonMin), h / (b.latMax - b.latMin))
        const W = (b.lonMax - b.lonMin) * k, H = (b.latMax - b.latMin) * k
        const p = (lat: number, lon: number) => [(lon - b.lonMin) * k, (b.latMax - lat) * k]
        const r = Math.max(1, k * 0.32)
        const d = dots.filter(([lon, lat]) => lon >= b.lonMin && lon <= b.lonMax && lat >= b.latMin && lat <= b.latMax)
          .map(([lon, lat]) => { const [x, y] = p(lat, lon); return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0` }).join("")
        const [px, py] = p(48.85, 2.35)
        const [ix, iy] = p(41.01, 28.98)
        return (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <path d={d} fill={C.ink} opacity="0.28" />
            <path d={`M${px} ${py} Q ${(px + ix) / 2} ${Math.min(py, iy) - H * 0.25} ${ix} ${iy}`} fill="none" stroke={C.ink} strokeWidth={k * 0.35} strokeDasharray={`${k * 0.8} ${k * 0.8}`} />
            <circle cx={px} cy={py} r={k * 1.1} fill={C.froid} stroke={C.ink} strokeWidth={k * 0.35} />
            <circle cx={ix} cy={iy} r={k * 1.1} fill={C.chaud} stroke={C.ink} strokeWidth={k * 0.35} />
          </svg>
        )
      },
    },
    {
      key: "sources",
      eyebrow: "Principe 6 · la confiance",
      headline: "Chaque chiffre a une source.",
      highlight: "une source",
      tone: "froid",
      sub: "Aucun texte généré au hasard, aucune donnée inventée. Quand une source ne répond pas, le site le dit au lieu d'afficher zéro.",
      visual: (w) => {
        const row = (name: string, what: string) => (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, borderBottom: `3px solid ${C.ink}`, paddingBottom: w * 0.02 }}>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: w * 0.05, whiteSpace: "nowrap", flexShrink: 0 }}>{name}</div>
            <div style={{ display: "flex", flex: 1, justifyContent: "flex-end", fontSize: w * 0.032, color: C.inkSoft, textAlign: "right" }}>{what}</div>
          </div>
        )
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: w * 0.03, width: w * 0.92 }}>
            {row("Copernicus ERA5", "normales 1991-2020, tendance")}
            {row("Open-Meteo", "ressenti du jour, archives")}
            {row("GIEC · CMIP6", "projections, fourchette entre modèles")}
            {row("NASA FIRMS", "anomalies thermiques satellite")}
          </div>
        )
      },
    },
  ]
}

export const SLIDE_COUNT = 7

export async function renderSlide(index: number, format: SlideFormat) {
  const slides = buildSlides()
  const slide = slides[index]
  const { width, height } = SLIDE_FORMATS[format]
  const fonts = await loadBrandFonts().catch(() => [])
  const wide = format === "16x9"
  const pad = wide ? 96 : 80
  const n = `${String(index + 1).padStart(2, "0")}/${String(slides.length).padStart(2, "0")}`
  const last = index === slides.length - 1

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: wide ? 28 : 30, letterSpacing: 4, textTransform: "uppercase", color: C.mute, fontWeight: 700 }}>
      <span>{slide.eyebrow}</span>
      <span style={{ letterSpacing: 2 }}>{n}</span>
    </div>
  )
  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-start", fontFamily: "Bricolage", fontSize: wide ? 44 : 48, letterSpacing: -1.5 }}>
        cestchaud<div style={{ display: "flex", marginLeft: 6, marginTop: 2 }}><Mark size={wide ? 24 : 26} /></div>
      </div>
      <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: wide ? 30 : 34, color: last ? C.chaud : C.ink }}>
        {last ? "cestchaud.fr" : wide ? "cestchaud.fr" : "Glissez →"}
      </div>
    </div>
  )

  const body = wide ? (
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 80 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 44, width: 960 }}>
        {words(slide.headline, slide.highlight, slide.tone, 104)}
        <div style={{ display: "flex", fontSize: 36, lineHeight: 1.4, color: C.inkSoft }}>{slide.sub}</div>
      </div>
      <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center" }}>{slide.visual(680, 640)}</div>
    </div>
  ) : (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 44, justifyContent: "center" }}>
      {words(slide.headline, slide.highlight, slide.tone, 96)}
      <div style={{ display: "flex", justifyContent: "center" }}>{slide.visual(width - pad * 2, 420)}</div>
      <div style={{ display: "flex", fontSize: 34, lineHeight: 1.4, color: C.inkSoft }}>{slide.sub}</div>
    </div>
  )

  return new ImageResponse(
    (
      <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32, background: C.paper, color: C.ink, padding: pad, fontFamily: fonts.length ? "DM Sans" : "sans-serif" }}>
        {header}
        {body}
        {footer}
      </div>
    ),
    { width, height, fonts },
  )
}
