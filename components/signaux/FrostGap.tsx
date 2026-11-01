"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { Flip } from "gsap/Flip"
import { useGSAP } from "@gsap/react"
import { fmt } from "@/lib/format"
import { cn } from "@/lib/cn"

gsap.registerPlugin(Flip, useGSAP)

export interface FrostRow {
  id: string
  name: string
  slug: string
  region: string
  /** nuits de gel observées (null : relevé indisponible pour cette ville) */
  observed: number | null
  /** nuits attendues à cette date selon la normale 1991-2020 (null : normale absente) */
  expected: number | null
}

type Mode = "observees" | "ecart"

const LABELS: Record<Mode, string> = { observees: "Nuits de gel", ecart: "Observées / attendues" }

/**
 * Le gel qui manque. Deux lectures du même tableau :
 *   « Nuits de gel » : ce qui a été observé, trié du plus au moins gelé ;
 *   « Observées / attendues » : la barre fantôme (la normale) apparaît, les barres observées rétrécissent
 *   à la même échelle et les lignes se réordonnent par gel manquant (GSAP Flip).
 */
export default function FrostGap({ rows, windowLabel, limit = 12 }: { rows: FrostRow[]; windowLabel: string; limit?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const hasNormals = rows.some((r) => r.expected != null)
  const [mode, setMode] = useState<Mode>("observees")
  const [expanded, setExpanded] = useState(false)
  const flipState = useRef<Flip.FlipState | null>(null)

  const sorted = useMemo(() => {
    const gap = (r: FrostRow) => (r.expected ?? 0) - (r.observed ?? 0)
    return [...rows].sort((a, b) => {
      // relevés indisponibles en dernier
      if ((a.observed == null) !== (b.observed == null)) return a.observed == null ? 1 : -1
      const d = mode === "ecart" ? gap(b) - gap(a) : (b.observed ?? 0) - (a.observed ?? 0)
      return d || (b.expected ?? 0) - (a.expected ?? 0) || a.name.localeCompare(b.name, "fr")
    })
  }, [rows, mode])

  const visible = expanded ? sorted : sorted.slice(0, limit)
  const maxObserved = Math.max(1, ...rows.map((r) => r.observed ?? 0))
  const maxBoth = Math.max(maxObserved, ...rows.map((r) => r.expected ?? 0))
  const scale = mode === "ecart" ? maxBoth : maxObserved
  const pct = (v: number | null) => `${Math.min(100, ((v ?? 0) / scale) * 100)}%`

  const { contextSafe } = useGSAP({ scope: root })
  const snapshot = contextSafe(() => {
    flipState.current = Flip.getState(gsap.utils.toArray("[data-flip-id]", root.current), { props: "opacity" })
  })
  const change = (m: Mode) => {
    if (m === mode) return
    snapshot()
    setMode(m)
  }
  const toggleExpanded = () => {
    snapshot()
    setExpanded((e) => !e)
  }

  useGSAP(() => {
    const state = flipState.current
    flipState.current = null
    if (!state) return
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      Flip.from(state, {
        targets: gsap.utils.toArray("[data-flip-id]", root.current),
        duration: 0.7,
        ease: "power3.inOut",
        absolute: false,
        nested: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }),
      })
    })
  }, { dependencies: [mode, expanded], scope: root })

  return (
    <div ref={root} className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-4 sm:p-6">
      {hasNormals ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lecture du tableau">
          {(Object.keys(LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => change(m)}
              aria-pressed={mode === m}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 font-display text-[14px] font-bold transition-colors",
                mode === m ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink",
              )}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-hl-signal px-4 py-3 text-[15px] leading-snug">
          <strong>Normale en cours de calcul.</strong> Le nombre de nuits de gel attendues (moyenne 1991-2020) n&apos;est pas encore publié : seul l&apos;observé est affiché pour l&apos;instant.
        </p>
      )}

      {hasNormals && (
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-mute" aria-hidden="true">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-froid" /> observées</span>
          <span className={cn("inline-flex items-center gap-2 transition-opacity", mode === "ecart" ? "opacity-100" : "opacity-40")}>
            <span className="h-3 w-6 rounded-full border-2 border-dashed border-froid bg-hl-froid" /> attendues (normale)
          </span>
        </p>
      )}

      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">
          Nuits de gel {windowLabel} par ville{hasNormals ? ", comparées aux nuits attendues selon la normale 1991-2020" : ""}. Tri : {LABELS[mode]}.
        </caption>
        <thead>
          <tr className="border-b-2 border-ink font-mono text-[12px] uppercase tracking-[0.08em] text-mute">
            <th scope="col" className="w-[38%] py-2 pr-2 font-semibold sm:w-[30%]">Ville</th>
            <th scope="col" className="py-2 pr-2 font-semibold"><span className="sr-only">Barres</span></th>
            <th scope="col" className="w-[4.2rem] py-2 text-right font-semibold"><span aria-hidden="true">Obs.</span><span className="sr-only">Observées</span></th>
            {hasNormals && <th scope="col" className="w-[4.2rem] py-2 text-right font-semibold"><span aria-hidden="true">Att.</span><span className="sr-only">Attendues</span></th>}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id} data-flip-id={`row-${r.id}`} className="border-b border-line last:border-0">
              <th scope="row" className="min-w-0 py-2 pr-2 font-normal">
                <Link href={`/a/${r.slug}`} className="group flex min-h-11 flex-col justify-center">
                  <span className="truncate font-display text-[16px] font-bold group-hover:underline">{r.name}</span>
                  <span className="truncate text-[13px] text-mute">{r.region}</span>
                </Link>
              </th>
              <td className="py-2 pr-2" aria-hidden="true">
                <span className="relative block h-4 rounded-full bg-paper-deep">
                  {r.expected != null && (
                    <span
                      data-flip-id={`exp-${r.id}`}
                      className="absolute inset-y-0 left-0 rounded-full border-2 border-dashed border-froid bg-hl-froid"
                      style={{ width: mode === "ecart" ? pct(r.expected) : "0%", opacity: mode === "ecart" ? 1 : 0 }}
                    />
                  )}
                  {r.observed != null && r.observed > 0 && (
                    <span
                      data-flip-id={`obs-${r.id}`}
                      className="absolute inset-y-[3px] left-0 rounded-full bg-froid"
                      style={{ width: pct(r.observed) }}
                    />
                  )}
                </span>
              </td>
              {r.observed == null ? (
                <td colSpan={hasNormals ? 2 : 1} className="py-2 text-right text-[13px] text-mute">relevé indisponible</td>
              ) : (
                <>
                  <td className="py-2 text-right font-display text-[18px] font-extrabold tabular">{r.observed}</td>
                  {hasNormals && (
                    <td className="py-2 text-right font-mono text-[14px] tabular text-ink-soft">{r.expected == null ? "–" : fmt(r.expected, 1)}</td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > limit && (
        <button type="button" onClick={toggleExpanded} aria-expanded={expanded} className="min-h-11 self-start rounded-full border-2 border-ink px-4 font-display text-[14px] font-bold hover:bg-ink hover:text-paper">
          {expanded ? "Réduire la liste" : `Voir les ${rows.length} villes`}
        </button>
      )}
    </div>
  )
}
