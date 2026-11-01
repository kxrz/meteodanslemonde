"use client"

import { useEffect, useRef, type RefObject } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

/**
 * Révélations d'une diapo, pilotées par l'étape courante (clavier, télécommande, boutons).
 * Attributs posés dans le JSX, k = numéro d'étape (1, 2…) :
 *   data-step="k"         l'élément apparaît à l'étape k
 *   data-step-strike="k"  un trait barre le texte à l'étape k (fond en dégradé)
 *   data-step-draw="k"    un tracé SVG se dessine à l'étape k
 *   data-step-grow="k"    une barre pousse depuis la gauche à l'étape k
 * Une timeline GSAP porte des labels s0, s1… ; changer d'étape fait `tl.tweenTo("sK")` (avant comme arrière).
 * En mouvement réduit, pas de timeline : l'état de chaque étape est appliqué instantanément.
 */
export function useStepTimeline(root: RefObject<HTMLElement | null>, step: number) {
  const tl = useRef<gsap.core.Timeline | null>(null)
  const stepRef = useRef(step)
  stepRef.current = step

  const apply = (s: number) => {
    const q = gsap.utils.selector(root)
    q("[data-step]").forEach((el) => gsap.set(el, { autoAlpha: Number((el as HTMLElement).dataset.step) <= s ? 1 : 0 }))
    q("[data-step-strike]").forEach((el) => gsap.set(el, { backgroundSize: Number((el as HTMLElement).dataset.stepStrike) <= s ? "100% 0.1em" : "0% 0.1em" }))
    q("[data-step-draw],[data-step-grow]").forEach((el) => {
      const d = el as HTMLElement
      const k = Number(d.dataset.stepDraw ?? d.dataset.stepGrow)
      gsap.set(el, { autoAlpha: k <= s ? 1 : 0, strokeDashoffset: 0, scaleX: 1 })
    })
  }

  useGSAP(() => {
    const q = gsap.utils.selector(root)
    const mm = gsap.matchMedia()
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      if (ctx.conditions?.reduce) {
        tl.current = null
        apply(stepRef.current)
        return
      }
      const of = (attr: string, k: number) => q(`[${attr}="${k}"]`)
      const all = q("[data-step],[data-step-strike],[data-step-draw],[data-step-grow]") as HTMLElement[]
      const max = Math.max(0, ...all.map((el) => Number(el.dataset.step ?? el.dataset.stepStrike ?? el.dataset.stepDraw ?? el.dataset.stepGrow)))
      const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      t.addLabel("s0")
      for (let k = 1; k <= max; k++) {
        const strike = of("data-step-strike", k)
        if (strike.length) t.fromTo(strike, { backgroundSize: "0% 0.1em" }, { backgroundSize: "100% 0.1em", duration: 0.6, ease: "power2.inOut" })
        const draw = of("data-step-draw", k) as unknown as SVGPathElement[]
        draw.forEach((p) => {
          const len = p.getTotalLength?.() ?? 0
          t.fromTo(p, { autoAlpha: 1, strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "<")
        })
        const grow = of("data-step-grow", k)
        if (grow.length) t.fromTo(grow, { autoAlpha: 1, scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.7, stagger: 0.12 }, draw.length ? "<0.3" : ">")
        const show = of("data-step", k)
        if (show.length) t.fromTo(show, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1 }, strike.length || draw.length || grow.length ? "-=0.2" : ">")
        t.addLabel(`s${k}`)
      }
      // éléments des étapes ultérieures cachés d'emblée, puis position de départ
      t.seek(`s${Math.min(stepRef.current, max)}`)
      gsap.from(root.current, { autoAlpha: 0, y: 24, duration: 0.45, ease: "power2.out" })
      tl.current = t
      return () => { tl.current = null }
    })
    return () => mm.revert()
  }, { scope: root })

  useEffect(() => {
    const t = tl.current
    if (t) {
      const label = `s${step}`
      if (t.labels[label] != null) t.tweenTo(label)
    } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(step)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])
}
