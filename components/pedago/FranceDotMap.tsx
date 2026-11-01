"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { absoluteHex, anomalyHex, anomalyWords } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import { project } from "@/lib/france-shape"
import LinerFrance from "@/components/brand/LinerFrance"
import ScaleLegend from "@/components/ui/ScaleLegend"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP)

export interface DotCity {
  id: string
  name: string
  slug: string
  region: string
  lat: number
  lon: number
  temp: number
  normal: number | null
  anomaly: number | null
}

type Mode = "ecart" | "thermo"

/**
 * Carte de France en points. Deux lectures :
 *   « Le thermomètre » : la température brute (en hiver, tout est bleu…)
 *   « L'écart à la normale » : la même journée, comparée à ce qui est normal pour le mois.
 * Basculer de l'une à l'autre fait balayer les couleurs d'ouest en est : c'est le cœur de la pédagogie du site.
 */
export default function FranceDotMap({ cities, monthLabel, initialMode = "ecart" }: { cities: DotCity[]; monthLabel: string; initialMode?: Mode }) {
  const root = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [selected, setSelected] = useState<DotCity | null>(null)
  const first = useRef(true)

  const placed = useMemo(() => cities.map((c) => {
    const [x, y] = project(c.lat, c.lon)
    return { ...c, x, y }
  }), [cities])

  const colorOf = (c: DotCity, m: Mode) => (m === "ecart" ? anomalyHex(c.anomaly) : absoluteHex(c.temp))

  const { contextSafe } = useGSAP({ scope: root })

  const switchTo = contextSafe((m: Mode) => {
    if (m === mode) return
    setMode(m)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dots = gsap.utils.toArray<SVGCircleElement>("[data-dot]", root.current)
    dots.forEach((el) => {
      const c = placed.find((p) => p.id === el.dataset.dot)
      if (!c) return
      const fill = colorOf(c, m)
      if (reduce) { el.setAttribute("fill", fill); return }
      gsap.to(el, {
        attr: { fill },
        duration: 0.5,
        delay: ((c.lon + 5) / 15) * 0.7, // balayage ouest → est
        ease: "power2.out",
      })
      gsap.fromTo(el, { attr: { r: 9 } }, { attr: { r: 12 }, duration: 0.25, yoyo: true, repeat: 1, delay: ((c.lon + 5) / 15) * 0.7 })
    })
  })

  useGSAP(() => {
    if (!first.current) return
    first.current = false
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-dot]", { attr: { r: 0 }, duration: 0.5, ease: "back.out(2)", stagger: { each: 0.012, from: "random" } })
      gsap.from("[data-outline]", { autoAlpha: 0, duration: 0.6 })
    })
  }, { scope: root })

  const above = cities.filter((c) => (c.anomaly ?? 0) >= 0.5).length
  const below = cities.filter((c) => (c.anomaly ?? 0) <= -0.5).length

  return (
    <div ref={root} className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="relative rounded-[var(--radius-card)] bg-white p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Lecture de la carte">
          {([
            ["thermo", "Le thermomètre"],
            ["ecart", "L'écart à la normale"],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchTo(m)}
              aria-pressed={mode === m}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 font-display text-[15px] font-bold transition-colors",
                mode === m ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <LinerFrance id="carte-du-jour" className="h-auto w-full" label={`Carte des ${cities.length} villes. Choisissez une ville pour voir son détail.`}>
          {placed.map((c) => {
            const isSel = selected?.id === c.id
            return (
              <g key={c.id}>
                <circle
                  data-dot={c.id}
                  cx={c.x}
                  cy={c.y}
                  r={isSel ? 13 : 9.5}
                  fill={colorOf(c, mode)}
                  stroke="var(--color-ink)"
                  strokeWidth={isSel ? 4 : 2.5}
                />
                {/* zone de clic élargie */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={18}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={`${c.name} : ${fmt(c.temp, 0)} degrés, ${fmtDelta(c.anomaly)} par rapport à la normale`}
                  aria-pressed={isSel}
                  className="cursor-pointer outline-none focus-visible:stroke-froid focus-visible:[stroke-width:3]"
                  onClick={() => setSelected(c)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(c) } }}
                />
              </g>
            )
          })}
        </LinerFrance>
        <div className="mt-3">
          {mode === "ecart" ? <ScaleLegend /> : (
            <figure className="flex flex-col gap-1.5" aria-label="Légende : température ressentie">
              <div className="grid h-3 grid-cols-9 overflow-hidden rounded-full" aria-hidden="true">
                {[-6, -2, 3, 8, 13, 18, 23, 29, 35].map((t) => <span key={t} style={{ background: absoluteHex(t) }} />)}
              </div>
              <figcaption className="flex justify-between font-mono text-[12px] text-mute"><span>−5&#8239;°C</span><span>ressenti du jour</span><span>+33&#8239;°C</span></figcaption>
            </figure>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--radius-card)] bg-ink p-5 text-paper sm:p-6" aria-live="polite">
          {mode === "thermo" ? (
            <p className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-tight">
              Vu comme ça, il fait <span className="text-a-m1">{cities.length && placed.filter((c) => c.temp < 12).length > cities.length / 2 ? "plutôt frais" : "plutôt doux"}</span>.
              <span className="mt-3 block font-sans text-[16px] font-normal text-paper/80">
                Le thermomètre ne dit pas si c&apos;est normal. Passez en « écart à la normale » pour comparer chaque ville à un {monthLabel} habituel.
              </span>
            </p>
          ) : (
            <p className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-tight">
              <span className="text-signal">{above} villes sur {cities.length}</span> sont au-dessus de la normale {monthLabel === "" ? "" : `de ${monthLabel}`}
              {below > 0 && <>, {below} en dessous</>}.
              <span className="mt-3 block font-sans text-[16px] font-normal text-paper/80">
                Même couleur partout sur le site : rouge au-dessus, bleu en dessous de la normale du mois.
              </span>
            </p>
          )}
        </div>

        {selected ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-mute">{selected.region}</p>
                <p className="font-display text-3xl font-extrabold leading-none tracking-tight">{selected.name}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="min-h-11 rounded-full px-3 text-[14px] font-semibold text-mute hover:text-ink">
                Fermer
              </button>
            </div>
            <dl className="grid grid-cols-3 gap-2">
              <div><dt className="text-[13px] text-mute">Ressenti</dt><dd className="font-display text-2xl font-extrabold tabular">{fmt(selected.temp, 0)}°</dd></div>
              <div><dt className="text-[13px] text-mute">Normale</dt><dd className="font-display text-2xl font-extrabold tabular">{fmt(selected.normal)}°</dd></div>
              <div><dt className="text-[13px] text-mute">Écart</dt><dd className="font-display text-2xl font-extrabold tabular" style={{ color: (selected.anomaly ?? 0) >= 0 ? "var(--color-chaud)" : "var(--color-froid)" }}>{fmtDelta(selected.anomaly)}°</dd></div>
            </dl>
            <p className="text-[15px] text-ink-soft">{selected.name} est {anomalyWords(selected.anomaly)} de {monthLabel}.</p>
            <Link href={`/a/${selected.slug}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-ink px-5 font-display font-bold text-paper hover:bg-ink-soft">
              Toute la fiche {selected.name} →
            </Link>
          </div>
        ) : (
          <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line p-5 text-[15px] text-mute">
            Touchez une ville sur la carte pour voir son ressenti, sa normale et son écart.
          </p>
        )}
      </div>
    </div>
  )
}
