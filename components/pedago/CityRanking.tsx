"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { useGSAP } from "@gsap/react"
import { anomalyHex, anomalyInk } from "@/lib/anomaly"
import { fmt, fmtDelta } from "@/lib/format"
import type { DotCity } from "@/components/pedago/FranceDotMap"
import { cn } from "@/lib/cn"

gsap.registerPlugin(Flip, useGSAP)

type Sort = "ecart" | "thermo" | "nom"

const LABELS: Record<Sort, string> = { ecart: "Par écart", thermo: "Par ressenti", nom: "De A à Z" }

/**
 * Classement des villes. Changer de tri réordonne les lignes avec GSAP Flip :
 * on voit qu'une ville « froide » au thermomètre peut être en tête des écarts.
 */
export default function CityRanking({ cities, limit = 12 }: { cities: DotCity[]; limit?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState<Sort>("ecart")
  const [expanded, setExpanded] = useState(false)
  const flipState = useRef<Flip.FlipState | null>(null)

  const sorted = useMemo(() => {
    const list = [...cities]
    if (sort === "ecart") list.sort((a, b) => (b.anomaly ?? -99) - (a.anomaly ?? -99))
    if (sort === "thermo") list.sort((a, b) => b.temp - a.temp)
    if (sort === "nom") list.sort((a, b) => a.name.localeCompare(b.name, "fr"))
    return list
  }, [cities, sort])

  const visible = expanded ? sorted : sorted.slice(0, limit)
  const maxAbs = Math.max(1, ...cities.map((c) => Math.abs(c.anomaly ?? 0)))

  const { contextSafe } = useGSAP({ scope: root })
  const change = contextSafe((s: Sort) => {
    flipState.current = Flip.getState(gsap.utils.toArray("[data-row]", root.current))
    setSort(s)
  })

  useGSAP(() => {
    if (!flipState.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { flipState.current = null; return }
    Flip.from(flipState.current, {
      targets: gsap.utils.toArray("[data-row]", root.current),
      duration: 0.6,
      ease: "power3.inOut",
      absolute: false,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.2 }),
    })
    flipState.current = null
  }, { dependencies: [sort], scope: root })

  return (
    <div ref={root} className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Trier les villes">
        {(Object.keys(LABELS) as Sort[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => change(s)}
            aria-pressed={sort === s}
            className={cn(
              "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold transition-colors",
              sort === s ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink",
            )}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>

      <ol className="flex flex-col">
        {visible.map((c, i) => {
          const a = c.anomaly ?? 0
          const w = `${(Math.abs(a) / maxAbs) * 50}%`
          return (
            <li key={c.id} data-row data-flip-id={c.id} className="border-b border-line last:border-0">
              <Link href={`/a/${c.slug}`} className="group grid min-h-12 grid-cols-[2rem_minmax(0,1fr)_3.2rem_5rem] items-center gap-2 py-1.5 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3.2rem_5rem]">
                <span className="font-mono text-[13px] text-mute tabular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[17px] font-bold group-hover:underline">{c.name}</span>
                  <span className="block truncate text-[13px] text-mute">{c.region}</span>
                </span>
                {/* barre divergente centrée */}
                <span className="relative hidden h-3 sm:block" aria-hidden="true">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                  <span
                    className="absolute inset-y-0 rounded-full"
                    style={{ background: anomalyHex(c.anomaly), width: w, left: a >= 0 ? "50%" : `calc(50% - ${w})` }}
                  />
                </span>
                <span className="text-right font-mono text-[14px] tabular text-ink-soft">{fmt(c.temp, 0)}°</span>
                <span className="justify-self-end rounded-full px-2 py-0.5 font-mono text-[13px] font-semibold tabular" style={{ background: anomalyHex(c.anomaly), color: anomalyInk(c.anomaly) }}>
                  {fmtDelta(c.anomaly)}°
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      {cities.length > limit && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="min-h-11 self-start rounded-full border-2 border-ink px-4 font-display text-[14px] font-bold hover:bg-ink hover:text-paper">
          {expanded ? "Réduire la liste" : `Voir les ${cities.length} villes`}
        </button>
      )}
    </div>
  )
}
