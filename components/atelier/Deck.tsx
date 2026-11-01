"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ActSlide, BreakdownSlide, CurveSlide, FutureSlide, MythSlide, NormalSlide, TodaySlide, TwinSlide, type DeckData } from "@/components/atelier/Slides"
import { deckFor, nextPos, prevPos, slideFromHash, type DeckPos, type SlideDef } from "@/lib/pedago"
import { cn } from "@/lib/cn"

const TITLES: Record<SlideDef["kind"], string> = {
  today: "Quel temps fait-il chez nous aujourd'hui ?",
  normal: "C'est normal ?",
  breakdown: "Météo du jour ou climat qui change ?",
  curve: "La courbe qui glisse",
  myth: "Idée reçue : vrai ou faux ?",
  future: "Combien de degrés en plus en 2050 ?",
  twin: "Le jumeau climatique en 2050",
  act: "Et maintenant ?",
}

/**
 * Diaporama plein écran pour animer une séance.
 * Suivant (→, espace, Page suivante, bouton) révèle d'abord l'étape suivante de la diapo, puis passe à la suivante.
 * La diapo courante est dans le hash (#d3), la ville et le déroulé dans l'URL (?ville=…&deroule=45|15).
 */
export default function Deck({ data }: { data: DeckData }) {
  const deck = useMemo(() => deckFor(data.deroule, data.city.today != null), [data.deroule, data.city.today])
  const [pos, setPos] = useState<DeckPos>({ slide: 0, step: 0 })
  const [full, setFull] = useState(false)

  // Diapo du hash au chargement et quand le hash change (liens, historique)
  useEffect(() => {
    const read = () => setPos((p) => {
      const s = slideFromHash(window.location.hash, deck.length)
      return s === p.slide ? p : { slide: s, step: 0 }
    })
    read()
    window.addEventListener("hashchange", read)
    return () => window.removeEventListener("hashchange", read)
  }, [deck.length])

  useEffect(() => {
    const h = `#d${pos.slide + 1}`
    if (window.location.hash !== h) history.replaceState(null, "", h)
  }, [pos.slide])

  const next = useCallback(() => setPos((p) => nextPos(deck, p)), [deck])
  const prev = useCallback(() => setPos((p) => prevPos(deck, p)), [deck])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return
      const onControl = tag === "BUTTON" || tag === "A"
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !onControl)) { e.preventDefault(); next() }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev() }
      else if (e.key === "Home") setPos({ slide: 0, step: 0 })
      else if (e.key === "End") setPos({ slide: deck.length - 1, step: 0 })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, deck.length])

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", on)
    return () => document.removeEventListener("fullscreenchange", on)
  }, [])

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      // plein écran refusé (navigateur, iframe) : on reste en fenêtre
    }
  }

  const def = deck[pos.slide]
  const atEnd = pos.slide === deck.length - 1 && pos.step === def.steps - 1
  const atStart = pos.slide === 0 && pos.step === 0
  const tone = def.kind === "myth" ? "bg-signal text-ink" : def.kind === "act" ? "bg-chaud text-white" : "bg-ink text-paper"
  const key = `${pos.slide}-${data.city.id}`
  const props = { d: data, step: pos.step }
  const willReveal = pos.step < def.steps - 1

  return (
    <div className={cn("flex min-h-[100svh] flex-col transition-colors duration-500", tone)}>
      <div className="flex items-center justify-between gap-4 px-[clamp(1rem,3vw,3rem)] pt-4">
        <Link href={`/atelier`} className="inline-flex min-h-11 items-center rounded-full px-3 text-[20px] font-semibold underline-offset-4 opacity-80 hover:underline hover:opacity-100">
          ← Quitter
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[20px] font-semibold tabular" aria-hidden="true">{pos.slide + 1}&#8239;/&#8239;{deck.length}</span>
          <button type="button" onClick={toggleFull} aria-pressed={full} className="inline-flex min-h-11 items-center rounded-full border-2 border-current px-4 text-[20px] font-semibold">
            {full ? "Quitter le plein écran" : "Plein écran"}
          </button>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-[clamp(1.25rem,5vw,6rem)] py-[clamp(1rem,4vh,3rem)]">
        <section aria-roledescription="diapositive" aria-label={`${pos.slide + 1} sur ${deck.length}`} className="flex w-full justify-center">
          {def.kind === "today" && <TodaySlide key={key} {...props} />}
          {def.kind === "normal" && <NormalSlide key={key} {...props} />}
          {def.kind === "breakdown" && <BreakdownSlide key={key} {...props} />}
          {def.kind === "curve" && <CurveSlide key={key} {...props} />}
          {def.kind === "myth" && <MythSlide key={key} {...props} index={def.myth ?? 0} />}
          {def.kind === "future" && <FutureSlide key={key} {...props} />}
          {def.kind === "twin" && <TwinSlide key={key} {...props} />}
          {def.kind === "act" && <ActSlide key={key} {...props} />}
        </section>
      </main>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Diapo ${pos.slide + 1} sur ${deck.length} : ${TITLES[def.kind]}${pos.step > 0 ? ` (révélation ${pos.step} sur ${def.steps - 1})` : ""}`}
      </p>

      <nav aria-label="Navigation du diaporama" className="flex items-center justify-between gap-4 px-[clamp(1rem,3vw,3rem)] pb-5">
        <button type="button" onClick={prev} disabled={atStart} className="inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border-[3px] border-current px-5 font-display text-[22px] font-extrabold disabled:opacity-30">
          <span aria-hidden="true">←</span><span className="max-sm:sr-only">Précédent</span>
        </button>
        <div className="flex flex-1 justify-center gap-1.5" aria-hidden="true">
          {deck.map((_, i) => <span key={i} className={cn("h-2 max-w-12 flex-1 rounded-full bg-current", i === pos.slide ? "opacity-100" : i < pos.slide ? "opacity-50" : "opacity-20")} />)}
        </div>
        <button type="button" onClick={next} disabled={atEnd} className={cn("inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full px-6 font-display text-[22px] font-extrabold disabled:opacity-30", def.kind === "myth" ? "bg-ink text-signal" : "bg-signal text-ink")}>
          <span className="max-sm:sr-only">{willReveal ? "Révéler" : "Suivant"}</span><span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  )
}
