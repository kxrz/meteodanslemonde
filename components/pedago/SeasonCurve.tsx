"use client"

import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { fmt, fmtDelta } from "@/lib/format"
import { MONTHS } from "@/lib/season"
import Explain from "@/components/ui/Explain"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Props {
  city: string
  normal: number[]
  trend: number[]
  proj2030: (number | null)[]
  proj2050: (number | null)[]
  month: number
  shiftDays: number | null
}

const W = 680, H = 280, L = 40, R = 14, T = 20, B = 30
const SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

function smooth(arr: number[]): number[] {
  // moyenne glissante sur 3 mois (circulaire) : retire le bruit mensuel sans changer l'ordre de grandeur
  return arr.map((_, i) => (arr[(i + 11) % 12] + arr[i] + arr[(i + 1) % 12]) / 3)
}

/**
 * La courbe qui glisse : la normale mensuelle, puis la même courbe avec le réchauffement observé,
 * puis 2050. Les écarts sont lissés sur 3 mois (le bruit mensuel ferait croire à des « baisses »).
 */
export default function SeasonCurve({ city, normal, trend, proj2030, proj2050, month, shiftDays }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(2)

  const t = smooth(trend)
  // Hausse supplémentaire projetée entre 2030 et 2050 (même scénario, même référence : pas de double compte
  // avec la tendance observée, qui n'a pas la même période de base).
  const p = smooth(proj2050.map((v, i) => (v ?? 0) - (proj2030[i] ?? 0)))
  const series = [
    normal,
    normal.map((v, i) => v + t[i]),
    normal.map((v, i) => v + t[i] + Math.max(0, p[i])),
  ]
  const all = series.flat()
  const yMin = Math.floor(Math.min(...all) / 5) * 5
  const yMax = Math.ceil(Math.max(...all) / 5) * 5
  const x = (i: number) => L + (i * (W - L - R)) / 11
  const y = (v: number) => T + ((yMax - v) * (H - T - B)) / (yMax - yMin)
  const d = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const area = (a: number[], b: number[]) =>
    `${d(a)} ${b.map((v, i) => `L${x(11 - i).toFixed(1)} ${y(b[11 - i]).toFixed(1)}`).join(" ")} Z`

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root)
      q("[data-draw]").forEach((el) => {
        const len = (el as unknown as SVGPathElement).getTotalLength()
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
      })
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
      tl.to(q("[data-draw=normal]"), { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" })
        .from(q("[data-fill=now]"), { autoAlpha: 0, duration: 0.4 })
        .to(q("[data-draw=now]"), { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "<")
        .from(q("[data-fill=future]"), { autoAlpha: 0, duration: 0.4 })
        .to(q("[data-draw=future]"), { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "<")
        .from(q("[data-month]"), { scale: 0, transformOrigin: "center", ease: "back.out(2)", duration: 0.4 })
    })
  }, { scope: root })

  const shown = (s: number) => step >= s
  const deltaNow = series[1][month] - normal[month]
  const delta2050 = series[2][month] - normal[month]
  const slope = normal[(month + 1) % 12] - normal[(month + 11) % 12]

  return (
    <div ref={root} className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-mute">La courbe qui glisse · {city}</p>
        <h3 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight">
          {shiftDays != null && Math.abs(shiftDays) >= 3 ? (
            slope < 0
              ? <>Votre {MONTHS[month]} ressemble à celui d&apos;il y a 30 ans… <span className="hl hl-chaud" data-anim="hl">avec {Math.abs(shiftDays)} jours de retard</span>.</>
              : <>Votre {MONTHS[month]} arrive <span className="hl hl-chaud" data-anim="hl">{Math.abs(shiftDays)} jours plus tôt</span> qu&apos;il y a 30 ans.</>
          ) : (
            <>Toute l&apos;année <span className="hl hl-chaud" data-anim="hl">glisse vers le haut</span>.</>
          )}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Courbes affichées">
        {["Normale 1991-2020", "Aujourd'hui", "2050"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            aria-pressed={step === i}
            className={cn(
              "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold transition-colors",
              step === i ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-labelledby="sc-title sc-desc">
          <title id="sc-title">Ressenti maximal moyen à {city}, mois par mois</title>
          <desc id="sc-desc">
            {`En ${MONTHS[month]}, normale ${fmt(normal[month])} °C, aujourd'hui ${fmt(series[1][month])} °C, en 2050 environ ${fmt(series[2][month])} °C.`}
          </desc>
          {Array.from({ length: (yMax - yMin) / 5 + 1 }, (_, i) => yMin + i * 5).map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--color-mute)" fontFamily="var(--font-mono)">{v}°</text>
            </g>
          ))}
          {SHORT.map((m, i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={i === month ? 700 : 400} fill={i === month ? "var(--color-ink)" : "var(--color-mute)"} fontFamily="var(--font-mono)">{m}</text>
          ))}
          <line x1={x(month)} x2={x(month)} y1={T} y2={H - B} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="3 4" />

          <path data-fill="future" d={area(series[2], series[1])} fill="var(--color-a-p3)" opacity={shown(2) ? 0.18 : 0} style={{ transition: "opacity .4s" }} />
          <path data-fill="now" d={area(series[1], series[0])} fill="var(--color-a-p2)" opacity={shown(1) ? 0.28 : 0} style={{ transition: "opacity .4s" }} />

          <path data-draw="normal" d={d(series[0])} fill="none" stroke="var(--color-froid)" strokeWidth="2.5" strokeDasharray={undefined} />
          <path data-draw="now" d={d(series[1])} fill="none" stroke="var(--color-a-p2)" strokeWidth="3" opacity={shown(1) ? 1 : 0} style={{ transition: "opacity .4s" }} />
          <path data-draw="future" d={d(series[2])} fill="none" stroke="var(--color-chaud)" strokeWidth="3" opacity={shown(2) ? 1 : 0} style={{ transition: "opacity .4s" }} />

          <circle data-month cx={x(month)} cy={y(series[step][month])} r="6" fill="var(--color-ink)" stroke="#fff" strokeWidth="2" style={{ transition: "cy .5s cubic-bezier(.2,.8,.2,1)" }} />
        </svg>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-hl-froid p-3">
          <dt className="text-[13px] text-ink-soft">{MONTHS[month]} 1991-2020 <Explain term="normale" /></dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmt(normal[month])}&#8239;°C</dd>
        </div>
        <div className="rounded-2xl bg-hl-chaud p-3">
          <dt className="text-[13px] text-ink-soft">Déjà observé <Explain term="tendance" /></dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmtDelta(deltaNow)}&#8239;°C</dd>
        </div>
        <div className="rounded-2xl bg-chaud p-3 text-white">
          <dt className="text-[13px] opacity-90">En 2050 (observé + hausse projetée) <Explain term="projection" invert /></dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmtDelta(delta2050)}&#8239;°C</dd>
        </div>
      </dl>
      <p className="text-[13px] text-mute">Écarts lissés sur trois mois pour retirer le bruit mensuel. 2050 = réchauffement déjà observé (ERA5) + hausse supplémentaire projetée entre 2030 et 2050 par les modèles CMIP6 (SSP2-4.5). Une estimation prudente.</p>
    </div>
  )
}
