"use client"

import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { fmt, fmtDelta } from "@/lib/format"
import Explain from "@/components/ui/Explain"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Props {
  city: string
  monthLabel: string // « novembre »
  normal: number // normale 1991-2020 du mois
  trend: number // tendance observée du mois
  today: number // ressenti max du jour
  compact?: boolean
}

/**
 * Décompose l'écart du jour en deux morceaux :
 *   climat  = ce que la tendance de long terme a déjà ajouté à la normale
 *   météo   = ce que la journée ajoute (ou retire) en plus
 * Une journée froide peut tomber sur un climat qui s'est réchauffé : c'est exactement ce que montre l'étape 3.
 */
export default function AnomalyBreakdown({ city, monthLabel, normal, trend, today, compact = false }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(3)
  const tl = useRef<gsap.core.Timeline | null>(null)

  const shifted = normal + trend
  const weather = today - shifted
  const total = today - normal

  // Échelle horizontale commune
  const values = [normal, shifted, today]
  const lo = Math.floor(Math.min(...values) - 3)
  const hi = Math.ceil(Math.max(...values) + 3)
  const pct = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`
  const left = (a: number, b: number) => pct(Math.min(a, b))
  const width = (a: number, b: number) => `${(Math.abs(b - a) / (hi - lo)) * 100}%`

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root)
      const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out", duration: 0.7 } })
      t.addLabel("s1")
        .from(q("[data-part=normal]"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.5 })
        .from(q("[data-label=normal]"), { autoAlpha: 0, y: 8 }, "<0.2")
        .addLabel("s2")
        .from(q("[data-part=climat]"), { scaleX: 0, transformOrigin: trend >= 0 ? "0% 50%" : "100% 50%" })
        .from(q("[data-part=shifted]"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.4 }, "<0.3")
        .from(q("[data-label=climat]"), { autoAlpha: 0, y: 8 }, "<")
        .addLabel("s3")
        .from(q("[data-part=meteo]"), { scaleX: 0, transformOrigin: weather >= 0 ? "0% 50%" : "100% 50%" })
        .from(q("[data-part=today]"), { scale: 0, duration: 0.4, ease: "back.out(2)" }, "<0.3")
        .from(q("[data-label=meteo]"), { autoAlpha: 0, y: 8 }, "<")
        .addLabel("end")
      tl.current = t
      ScrollTrigger.create({ trigger: root.current, start: "top 75%", once: true, onEnter: () => t.play(0) })
      return () => { tl.current = null }
    })
  }, { scope: root })

  const go = (s: number) => {
    setStep(s)
    const t = tl.current
    if (!t) return
    t.tweenTo(s === 1 ? "s2" : s === 2 ? "s3" : "end")
  }

  const colder = weather < 0
  const verdict = trend > 0.3 && today < normal
    ? <>Il fait <strong>plus frais que la normale</strong> aujourd&apos;hui, mais la normale elle-même a déjà gagné <strong>{fmtDelta(trend)}&#8239;°C</strong>. Une journée froide ne fait pas reculer le climat.</>
    : trend > 0.3 && weather > 0
      ? <>Sur les <strong>{fmtDelta(total)}&#8239;°C</strong> d&apos;écart, <strong>{fmtDelta(trend)}&#8239;°C</strong> viennent du climat qui a déjà changé, le reste de la météo du jour.</>
      : <>L&apos;écart du jour vient surtout de la météo. La tendance de fond pour {monthLabel} est de <strong>{fmtDelta(trend)}&#8239;°C</strong>.</>

  return (
    <div ref={root} className={cn("flex flex-col gap-5 rounded-[var(--radius-card)] bg-white p-5 sm:p-7", compact && "p-4")}>
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-mute">Décomposer l&apos;écart · {city}</p>
        <h3 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight">
          Météo du jour ou climat qui change&#8239;?
          <Explain term="meteoClimat" />
        </h3>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Étapes">
        {["La normale", "Le climat a bougé", "La météo du jour"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => go(i + 1)}
            aria-pressed={step === i + 1}
            className={cn(
              "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold transition-colors",
              step === i + 1 ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink",
            )}
          >
            <span className="mr-1.5 font-mono text-[12px] opacity-70">{i + 1}</span>{label}
          </button>
        ))}
      </div>

      {/* Échelle */}
      <div className="relative mt-10 h-28 select-none" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-6 h-px bg-line" />
        {/* graduations */}
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((v) => v % 2 === 0).map((v) => (
          <span key={v} className="absolute bottom-0 -translate-x-1/2 font-mono text-[11px] text-mute tabular" style={{ left: pct(v) }}>{fmt(v, 0)}°</span>
        ))}
        {/* normale 1991-2020 */}
        <span data-part="normal" className="absolute bottom-6 h-16 w-1 -translate-x-1/2 rounded-full bg-ink" style={{ left: pct(normal) }} />
        <span data-label="normal" className="absolute bottom-[5.6rem] -translate-x-1/2 whitespace-nowrap font-mono text-[12px] font-semibold" style={{ left: pct(normal) }}>
          normale {fmt(normal)}°
        </span>
        {/* segment climat */}
        <span data-part="climat" className="absolute bottom-[3.1rem] h-3 rounded-full bg-a-p2" style={{ left: left(normal, shifted), width: width(normal, shifted) }} />
        <span data-part="shifted" className="absolute bottom-6 h-10 w-1 -translate-x-1/2 rounded-full bg-a-p3" style={{ left: pct(shifted) }} />
        {/* segment météo */}
        <span data-part="meteo" className={cn("absolute bottom-[2.1rem] h-3 rounded-full", colder ? "bg-froid" : "bg-chaud")} style={{ left: left(shifted, today), width: width(shifted, today) }} />
        <span data-part="today" className={cn("absolute bottom-[1.6rem] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white shadow", colder ? "bg-froid" : "bg-chaud")} style={{ left: pct(today) }} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div data-label="normal" className="rounded-2xl bg-paper p-3">
          <dt className="text-[13px] text-mute">Normale de {monthLabel} (1991-2020)</dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmt(normal)}&#8239;°C</dd>
        </div>
        <div data-label="climat" className="rounded-2xl bg-hl-chaud p-3">
          <dt className="text-[13px] text-ink-soft">Climat : ce que 30 ans ont ajouté</dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmtDelta(trend)}&#8239;°C</dd>
        </div>
        <div data-label="meteo" className={cn("rounded-2xl p-3", colder ? "bg-hl-froid" : "bg-hl-signal")}>
          <dt className="text-[13px] text-ink-soft">Météo : ce que la journée ajoute</dt>
          <dd className="font-display text-2xl font-extrabold tabular">{fmtDelta(weather)}&#8239;°C</dd>
        </div>
      </dl>

      <p className="max-w-[65ch] text-[16px] leading-relaxed text-ink-soft">{verdict}</p>
      <p className="sr-only">
        Normale {fmt(normal)} degrés, tendance {fmtDelta(trend)}, ressenti du jour {fmt(today)} degrés, soit {fmtDelta(total)} par rapport à la normale.
      </p>
    </div>
  )
}
