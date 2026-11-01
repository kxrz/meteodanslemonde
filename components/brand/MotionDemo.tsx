"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { SplitText } from "gsap/SplitText"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { fmtDelta } from "@/lib/format"

gsap.registerPlugin(useGSAP, SplitText, ScrambleTextPlugin)

/** Démonstration rejouable des quatre gestes de la marque. */
export default function MotionDemo() {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root)
      const split = SplitText.create(q("[data-demo=split]"), { type: "words", mask: "words" })
      const num = q("[data-demo=count]")[0] as HTMLElement
      const state = { v: 0 }
      const t = gsap.timeline({ paused: true })
      t.from(split.words, { yPercent: 110, duration: 0.6, ease: "power4.out", stagger: 0.06 })
        .fromTo(q("[data-demo=hl]"), { backgroundSize: "0% 0.42em" }, { backgroundSize: "100% 0.42em", duration: 0.6, ease: "power3.inOut" }, "-=0.2")
        .to(state, { v: 4.1, duration: 1.1, ease: "power2.out", onUpdate: () => { num.textContent = `${fmtDelta(state.v)} °C` } }, "<")
        .to(q("[data-demo=scramble]"), { duration: 1, scrambleText: { text: "Séville", chars: "°+−0123456789", revealDelay: 0.3 } }, "<0.2")
      tl.current = t
      t.play()
    })
  }, { scope: root })

  const replay = contextSafe(() => tl.current?.restart())

  return (
    <div ref={root} className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
      <p data-demo="split" className="font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-tight">
        Aujourd&apos;hui, Lyon est à{" "}
        <strong data-demo="hl" className="hl hl-chaud font-extrabold"><span data-demo="count">+4,1&#8239;°C</span></strong>{" "}
        de sa normale.
      </p>
      <p className="font-display text-2xl font-bold">
        Son jumeau 2050 : <span data-demo="scramble" className="text-froid">Séville</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={replay} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-display font-bold text-paper hover:bg-ink-soft">
          Rejouer
        </button>
        <p className="text-[14px] text-mute">Mots qui montent · surligneur · compteur depuis zéro · nom qui se cherche.</p>
      </div>
    </div>
  )
}
