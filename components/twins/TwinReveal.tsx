"use client"

import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import Button from "@/components/ui/Button"

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin, ScrambleTextPlugin)

interface Props {
  cityId: string
  cityName: string
  /** nom du jumeau, ou null s'il n'y a pas de jumeau assez proche */
  twinName: string | null
  /** le planisphère (TwinMap, rendu serveur) */
  map: React.ReactNode
  caption: React.ReactNode
  actions: React.ReactNode
}

/**
 * La révélation, pensée pour l'écran vertical : une phrase géante (« Paris en 2050 = Séville aujourd'hui »)
 * et un point qui s'envole de votre ville vers son jumeau, puis le nom qui se « cherche » avant de se fixer.
 * L'état final est dans le HTML ; sans animation (reduced-motion, sans JS), on le voit d'emblée.
 */
export default function TwinReveal({ cityId, cityName, twinName, map, caption, actions }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [canPlay, setCanPlay] = useState(false)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root)
      const path = q("[data-arc]")[0] as unknown as SVGPathElement | undefined
      const name = q("[data-twin-name]")[0] as HTMLElement | undefined
      if (!path || !name || !twinName) return
      setCanPlay(true)
      const len = path.getTotalLength()

      const t = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } })
      t.set(q("[data-label], [data-ring], [data-after]"), { autoAlpha: 0 })
        .set(path, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len })
        .call(() => { name.textContent = "?" })
        .to(q("[data-label=origin]"), { autoAlpha: 1, duration: 0.3 })
        .to(path, { strokeDashoffset: 0, duration: 1.5 })
        .fromTo(q("[data-plane]"), { autoAlpha: 1 }, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.5 }, "<")
        // le trajet redevient pointillé (style Liner) une fois tracé
        .set(path, { strokeDasharray: "6 7", strokeDashoffset: 0 })
        .to(q("[data-ring]"), { autoAlpha: 1, duration: 0.25, stagger: 0.08 })
        .to(q("[data-label=twin]"), { autoAlpha: 1, duration: 0.2 }, "<")
        .to(name, { duration: 0.9, ease: "none", scrambleText: { text: twinName, chars: "ABCDEFGHIJKLMNOPRSTUVÉ", speed: 0.6 } }, "<")
        .to(q("[data-label=other], [data-after]"), { autoAlpha: 1, duration: 0.35, stagger: 0.1 })
      tl.current = t

      ScrollTrigger.create({ trigger: root.current, start: "top 85%", once: true, onEnter: () => t.play(0) })
      return () => { tl.current = null; setCanPlay(false) }
    })
  }, { scope: root, dependencies: [cityId, twinName], revertOnUpdate: true })

  return (
    <div ref={root} className="-mx-4 flex min-h-[calc(100svh-4rem)] flex-col gap-5 bg-ink px-4 py-6 text-paper sm:mx-0 sm:min-h-0 sm:rounded-[var(--radius-card)] sm:p-8 md:grid md:grid-cols-[1fr_minmax(0,1fr)] md:items-center md:gap-10">
      <div className="flex flex-col gap-4">
        <p className="font-display text-[clamp(2.3rem,10vw,4.6rem)] font-extrabold leading-[0.95] tracking-tight" aria-live="polite">
          {twinName ? (
            <>
              {cityName} en 2050 <span className="text-paper/60">=</span>{" "}
              <span className="text-signal" data-twin-name>{twinName}</span>{" "}aujourd&apos;hui.
            </>
          ) : (
            <>{cityName} en 2050 n&apos;a <span className="text-signal">pas de jumeau proche</span> dans notre liste de 67 villes.</>
          )}
        </p>
        <div data-after className="text-[15px] leading-snug text-paper/85">{caption}</div>
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          {actions}
          {canPlay && <Button variant="paper" onClick={() => tl.current?.play(0)}>Rejouer</Button>}
        </div>
      </div>
      {map}
      <div className="mt-auto flex flex-wrap items-center gap-2 md:hidden">
        {actions}
        {canPlay && <Button variant="paper" onClick={() => tl.current?.play(0)}>Rejouer</Button>}
      </div>
    </div>
  )
}
