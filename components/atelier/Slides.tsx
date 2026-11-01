"use client"

import Link from "next/link"
import { useRef } from "react"
import CityPicker from "@/components/pedago/CityPicker"
import { useStepTimeline } from "@/components/atelier/useStepTimeline"
import type { PedagoCity } from "@/lib/pedago-data"
import { anomalyHex, anomalyInk, anomalyWords } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import { MONTHS, deMonth } from "@/lib/season"
import { splitHighlight, type Deroule } from "@/lib/pedago"
import { cn } from "@/lib/cn"

export interface DeckMyth { slug: string; claim: string; answer: string; highlight: string; explanation: string }

export interface DeckData {
  city: PedagoCity
  cities: { id: string; name: string }[]
  month: number
  deroule: Deroule
  myths: DeckMyth[]
}

/* Typo de projection : rien sous 20 px. */
const EYEBROW = "font-mono text-[clamp(1.25rem,1.6vw,1.6rem)] font-semibold uppercase tracking-[0.12em] opacity-80"
const TITLE = "font-display text-[clamp(2.4rem,min(6.4vw,9vh),6.4rem)] font-extrabold leading-[0.98] tracking-tight"
const BODY = "text-[clamp(1.25rem,min(2.2vw,3.4vh),2.1rem)] leading-snug"
const GIANT = "font-display text-[clamp(4.5rem,min(17vw,24vh),15rem)] font-extrabold leading-[0.9] tracking-tight tabular"

function Frame({ children, step, className }: { children: React.ReactNode; step: number; className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  useStepTimeline(root, step)
  return <div ref={root} className={cn("flex w-full max-w-[1500px] flex-col gap-[clamp(1.25rem,3vh,2.5rem)]", className)}>{children}</div>
}

function Vote({ options, step = 0 }: { options: string[]; step?: number }) {
  return (
    <div data-step={step || undefined} className="flex flex-col gap-4">
      <p className={cn(BODY, "font-semibold")}>Votez à main levée&#8239;:</p>
      <ul className="flex flex-wrap gap-3">
        {options.map((o) => <li key={o} className="rounded-full border-[3px] border-current px-6 py-2 font-display text-[clamp(1.4rem,2.4vw,2.2rem)] font-extrabold">{o}</li>)}
      </ul>
    </div>
  )
}

function Unavailable({ children }: { children: React.ReactNode }) {
  return <p className={cn(BODY, "rounded-3xl border-[3px] border-dashed border-current p-6")}>{children}</p>
}

export function TodaySlide({ d, step }: { d: DeckData; step: number }) {
  const { city } = d
  return (
    <Frame step={step}>
      <p className={EYEBROW}>Chez nous · {city.name}</p>
      <h2 className={TITLE}>Quel temps fait-il chez nous <span className="text-signal">aujourd&apos;hui</span>&#8239;?</h2>
      <CityPicker cities={d.cities} value={city.id} label="Notre ville" keep={{ deroule: d.deroule }} tone="dark" size="xl" />
      <div data-step="1" className="flex flex-col gap-2">
        {city.today != null ? (
          <>
            <p className={GIANT}>{fmt(city.today, 0)}&#8239;°C</p>
            <p className={BODY}>de ressenti, au plus chaud de la journée.</p>
          </>
        ) : (
          <Unavailable>Relevé du jour indisponible. On continue avec la normale du mois.</Unavailable>
        )}
      </div>
    </Frame>
  )
}

export function NormalSlide({ d, step }: { d: DeckData; step: number }) {
  const { city, month } = d
  return (
    <Frame step={step}>
      <p className={EYEBROW}>{city.today != null ? `${fmt(city.today, 0)} °C aujourd'hui à ${city.name}` : city.name}</p>
      <h2 className={TITLE}>C&apos;est <span className="text-signal">normal</span>&#8239;?</h2>
      {city.today != null && <Vote options={["Au-dessus", "Normal", "En dessous"]} />}
      <p data-step="1" className={cn(BODY, "max-w-[34ch]")}>
        Un {MONTHS[month]} normal à {city.name} (moyenne 1991-2020)&#8239;: <strong className="font-display text-[1.4em] font-extrabold">{fmt(city.normal)}&#8239;°C</strong>.
      </p>
      {city.today != null && city.anomaly != null && (
        <div data-step="2" className="flex flex-wrap items-center gap-6">
          <span className={cn(GIANT, "rounded-[2rem] px-6 pb-3 pt-2")} style={{ background: anomalyHex(city.anomaly), color: anomalyInk(city.anomaly) }}>
            {fmtDelta(city.anomaly)}&#8239;°C
          </span>
          <p className={cn(BODY, "max-w-[18ch] font-semibold")}>{anomalyWords(city.anomaly)} {deMonth(month)}.</p>
        </div>
      )}
    </Frame>
  )
}

export function BreakdownSlide({ d, step }: { d: DeckData; step: number }) {
  const { city, month } = d
  if (city.normal == null || city.trend == null) return <Frame step={step}><Unavailable>Normales indisponibles pour {city.name}.</Unavailable></Frame>
  const normal = city.normal, trend = city.trend, shifted = normal + trend, today = city.today
  const vals = [normal, shifted, ...(today != null ? [today] : [])]
  const lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 2)
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100
  const weather = today != null ? today - shifted : null
  return (
    <Frame step={step}>
      <p className={EYEBROW}>Décomposer l&apos;écart · {city.name}</p>
      <h2 className={TITLE}>Météo du jour ou <span className="text-signal">climat qui change</span>&#8239;?</h2>
      <div className="relative mt-[6vh] h-[clamp(9rem,22vh,14rem)]" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-10 h-1 bg-paper/40" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((v) => v % 2 === 0).map((v) => (
          <span key={v} className="absolute bottom-0 -translate-x-1/2 font-mono text-[22px] tabular opacity-80" style={{ left: `${pct(v)}%` }}>{fmt(v, 0)}°</span>
        ))}
        <span className="absolute bottom-10 h-[70%] w-2 -translate-x-1/2 rounded-full bg-paper" style={{ left: `${pct(normal)}%` }} />
        <span className="absolute -top-12 -translate-x-1/2 whitespace-nowrap font-mono text-[22px] font-semibold" style={{ left: `${pct(normal)}%` }}>normale {fmt(normal)}°</span>
        <span data-step-grow="1" className="absolute bottom-[45%] h-6 rounded-full bg-a-p2" style={{ left: `${pct(Math.min(normal, shifted))}%`, width: `${(Math.abs(trend) / (hi - lo)) * 100}%` }} />
        {weather != null && today != null && (
          <>
            <span data-step-grow="2" className={cn("absolute bottom-[25%] h-6 rounded-full", weather < 0 ? "bg-froid" : "bg-chaud")} style={{ left: `${pct(Math.min(shifted, today))}%`, width: `${(Math.abs(weather) / (hi - lo)) * 100}%` }} />
            <span data-step="2" className={cn("absolute bottom-[calc(25%-0.5rem)] h-10 w-10 -translate-x-1/2 rounded-full border-4 border-paper", weather < 0 ? "bg-froid" : "bg-chaud")} style={{ left: `${pct(today)}%` }} />
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-paper/10 p-5"><p className="text-[22px] opacity-85">Normale {deMonth(month)}</p><p className="font-display text-[clamp(2.2rem,4vw,3.6rem)] font-extrabold tabular">{fmt(normal)}&#8239;°C</p></div>
        <div data-step="1" className="rounded-3xl bg-a-p2 p-5 text-ink"><p className="text-[22px]">Climat&#8239;: ce que 30 ans ont ajouté</p><p className="font-display text-[clamp(2.2rem,4vw,3.6rem)] font-extrabold tabular">{fmtDelta(trend)}&#8239;°C</p></div>
        {weather != null ? (
          <div data-step="2" className={cn("rounded-3xl p-5", weather < 0 ? "bg-froid text-white" : "bg-signal text-ink")}><p className="text-[22px]">Météo&#8239;: ce que la journée ajoute</p><p className="font-display text-[clamp(2.2rem,4vw,3.6rem)] font-extrabold tabular">{fmtDelta(weather)}&#8239;°C</p></div>
        ) : (
          <div data-step="1" className="rounded-3xl border-[3px] border-dashed border-paper/60 p-5 text-[22px]">Météo du jour&#8239;: relevé indisponible.</div>
        )}
      </div>
    </Frame>
  )
}

const smooth = (a: number[]) => a.map((_, i) => (a[(i + 11) % 12] + a[i] + a[(i + 1) % 12]) / 3)

export function CurveSlide({ d, step }: { d: DeckData; step: number }) {
  const { city, month } = d
  if (!city.normals || !city.trends || !city.proj2030 || !city.proj2050) return <Frame step={step}><Unavailable>Courbe indisponible pour {city.name}.</Unavailable></Frame>
  const normal = city.normals
  const t = smooth(city.trends)
  const p = smooth(city.proj2050.map((v, i) => (v ?? 0) - (city.proj2030![i] ?? 0)))
  const series = [normal, normal.map((v, i) => v + t[i]), normal.map((v, i) => v + t[i] + Math.max(0, p[i]))]
  const W = 1000, H = 420, L = 56, R = 16, T = 16, B = 44
  const all = series.flat()
  const yMin = Math.floor(Math.min(...all) / 5) * 5, yMax = Math.ceil(Math.max(...all) / 5) * 5
  const x = (i: number) => L + (i * (W - L - R)) / 11
  const y = (v: number) => T + ((yMax - v) * (H - T - B)) / (yMax - yMin)
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const shift = city.shiftDays
  const slope = normal[(month + 1) % 12] - normal[(month + 11) % 12]
  return (
    <Frame step={step}>
      <p className={EYEBROW}>La courbe qui glisse · {city.name}</p>
      <h2 className={cn(TITLE, "text-[clamp(2.2rem,min(5vw,7.5vh),5.4rem)] first-letter:uppercase")}>
        {shift != null && Math.abs(shift) >= 3
          ? slope < 0
            ? <>{MONTHS[month]} ressemble à celui d&apos;il y a 30 ans… <span className="text-signal">avec {Math.abs(shift)} jours de retard</span>.</>
            : <>{MONTHS[month]} arrive <span className="text-signal">{Math.abs(shift)} jours plus tôt</span>.</>
          : <>Toute l&apos;année <span className="text-signal">glisse vers le haut</span>.</>}
      </h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto max-h-[36vh] w-full" role="img" aria-label={`Ressenti maximal moyen à ${city.name} : en ${MONTHS[month]}, ${fmt(normal[month])} °C en 1991-2020, ${fmt(series[1][month])} °C aujourd'hui, environ ${fmt(series[2][month])} °C en 2050.`}>
        {Array.from({ length: (yMax - yMin) / 5 + 1 }, (_, i) => yMin + i * 5).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.2" />
            <text x={L - 10} y={y(v) + 7} textAnchor="end" fontSize="22" fill="currentColor" fontFamily="var(--font-mono)">{v}°</text>
          </g>
        ))}
        {"JFMAMJJASOND".split("").map((m, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="22" fontWeight={i === month ? 800 : 400} fill="currentColor" fontFamily="var(--font-mono)">{m}</text>
        ))}
        <line x1={x(month)} x2={x(month)} y1={T} y2={H - B} stroke="currentColor" strokeDasharray="4 6" />
        <path d={path(series[0])} fill="none" stroke="var(--color-a-m2)" strokeWidth="5" />
        <path data-step-draw="1" d={path(series[1])} fill="none" stroke="var(--color-a-p2)" strokeWidth="6" />
        <path data-step-draw="2" d={path(series[2])} fill="none" stroke="var(--color-chaud)" strokeWidth="6" />
      </svg>
      <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[clamp(1.25rem,1.8vw,1.7rem)] font-semibold">
        <li className="flex items-center gap-3"><span className="h-2 w-10 rounded-full bg-a-m2" />1991-2020&#8239;: {fmt(normal[month])}&#8239;°C</li>
        <li data-step="1" className="flex items-center gap-3"><span className="h-2 w-10 rounded-full bg-a-p2" />Aujourd&apos;hui&#8239;: {fmtDelta(series[1][month] - normal[month])}&#8239;°C</li>
        <li data-step="2" className="flex items-center gap-3"><span className="h-2 w-10 rounded-full bg-chaud" />2050&#8239;: {fmtDelta(series[2][month] - normal[month])}&#8239;°C</li>
      </ul>
    </Frame>
  )
}

export function MythSlide({ d, step, index }: { d: DeckData; step: number; index: number }) {
  const m = d.myths[index]
  if (!m) return null
  return (
    <Frame step={step}>
      <p className={EYEBROW}>Idée reçue {index + 1}/{d.myths.length} · Vrai ou faux&#8239;?</p>
      <blockquote className={cn(TITLE, "text-[clamp(2.2rem,min(5.4vw,8vh),5.6rem)]")}>
        «&#8239;<span
          data-step-strike="1"
          style={{ backgroundImage: "linear-gradient(var(--color-chaud), var(--color-chaud))", backgroundRepeat: "no-repeat", backgroundPosition: "0 58%", backgroundSize: "100% 0.1em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
        >{m.claim}</span>&#8239;»
      </blockquote>
      <div className="grid [&>*]:[grid-area:1/1]">
      {step === 0 && <Vote options={["Vrai", "Faux"]} />}
      <p data-step="1" className="max-w-[26ch] font-display text-[clamp(1.9rem,min(4.4vw,6.6vh),4.2rem)] font-extrabold leading-[1.04] tracking-tight">
        {splitHighlight(m.answer, m.highlight).map((p, i) => p.hl ? <span key={i} className="hl hl-ink" style={{ backgroundSize: "100% 100%" }}>{p.text}</span> : <span key={i}>{p.text}</span>)}
      </p>
      </div>
      <p data-step="2" className={cn(BODY, "max-w-[52ch]")}>{m.explanation}</p>
    </Frame>
  )
}

export function FutureSlide({ d, step }: { d: DeckData; step: number }) {
  const { city } = d
  const rows = city.future2050.filter((s) => s.central != null)
  const top = Math.max(3, ...rows.map((r) => r.high ?? 0))
  const summer = rows.find((r) => r.season === "ete")
  return (
    <Frame step={step}>
      <p className={EYEBROW}>2050 · {city.name}</p>
      <h2 className={TITLE}>Combien de degrés <span className="text-signal">en plus</span> en 2050&#8239;?</h2>
      <p className={BODY}>Votez&#8239;: et l&apos;été, à {city.name}&#8239;?</p>
      {rows.length ? (
        <div data-step="1" className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.season} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 md:grid-cols-[10rem_1fr_15rem]">
              <span className="font-display text-[clamp(1.5rem,2.4vw,2.2rem)] font-extrabold first-letter:uppercase">{r.label}</span>
              <div className="relative h-10 rounded-full bg-paper/10">
                <span data-step-grow="1" className="absolute inset-y-0 left-0 rounded-full bg-chaud" style={{ width: `${((r.central ?? 0) / top) * 100}%` }} />
                <span className="absolute inset-y-[-6px] rounded-full border-[3px] border-signal" style={{ left: `${((r.low ?? 0) / top) * 100}%`, width: `${(((r.high ?? 0) - (r.low ?? 0)) / top) * 100}%` }} />
              </div>
              <span className="col-span-2 font-display text-[clamp(1.4rem,2.2vw,2rem)] font-extrabold tabular md:col-span-1">
                {fmtDelta(r.central)}&#8239;°C <span className="font-sans text-[20px] font-normal opacity-85">({fmtDelta(r.low)} à {fmtDelta(r.high)})</span>
              </span>
            </div>
          ))}
          <p className="text-[20px] opacity-85">
            Par rapport à 2000-2020, moyenne de chaque saison. Barre rouge&#8239;: médiane des modèles. Cadre jaune&#8239;: fourchette entre modèles. Modèles climatiques du CMIP6.
          </p>
          {summer && <p className="sr-only">Été 2050 : {fmtDelta(summer.central)} degrés.</p>}
        </div>
      ) : (
        <Unavailable>Projections indisponibles pour {city.name}.</Unavailable>
      )}
    </Frame>
  )
}

export function TwinSlide({ d, step }: { d: DeckData; step: number }) {
  const { city } = d
  return (
    <Frame step={step}>
      <p className={EYEBROW}>Jumeau climatique · {city.name}</p>
      <h2 className={TITLE}>Le climat de {city.name} en 2050 <span className="text-signal">existe déjà</span>.</h2>
      <p className={BODY}>Devinez&#8239;: dans quelle ville du monde&#8239;?</p>
      <div data-step="1" className="flex flex-col gap-4">
        <Link href={`/jumeaux?ville=${city.id}`} className="inline-flex min-h-16 w-fit items-center gap-3 rounded-full bg-signal px-8 font-display text-[clamp(1.5rem,2.6vw,2.4rem)] font-extrabold text-ink hover:bg-paper">
          Découvrir le jumeau de {city.name} →
        </Link>
        <p className={BODY}>Ou sur votre téléphone&#8239;: <strong>cestchaud.fr/jumeaux</strong></p>
      </div>
    </Frame>
  )
}

export function ActSlide({ step }: { d: DeckData; step: number }) {
  const cards = [
    { href: "/citoyens", t: "Écrire à ses élus", s: "Un modèle de lettre, avec les chiffres de votre territoire." },
    { href: "/notifications", t: "Recevoir le briefing", s: "L'écart de votre ville, chaque matin, en une phrase." },
    { href: "/idees-recues", t: "Démonter une idée reçue", s: "Une carte à partager, une image story à poster." },
  ]
  return (
    <Frame step={step}>
      <p className={EYEBROW}>Et maintenant&#8239;?</p>
      <h2 className={TITLE}>Le climat change. <span className="text-signal">Nous aussi</span>.</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="flex h-full flex-col gap-2 rounded-3xl bg-paper p-6 text-ink hover:bg-signal">
              <span className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-extrabold leading-tight">{c.t}</span>
              <span className="text-[20px] leading-snug">{c.s}</span>
              <span className="mt-auto font-mono text-[20px]">cestchaud.fr{c.href}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-[20px] opacity-85">
        Sources&#8239;: normales et tendances Copernicus ERA5 (1991-2020) · projections GIEC AR6, modèles CMIP6 · relevés du jour Open-Meteo · Météo-France. Méthode&#8239;: cestchaud.fr/a-propos
      </p>
    </Frame>
  )
}
