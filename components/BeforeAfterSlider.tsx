"use client"

import { useCallback, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Props {
  before: string
  after: string
  labelBefore: string
  labelAfter: string
  alt: string
}

const clamp = (v: number) => Math.max(0, Math.min(100, v))

/**
 * Comparateur avant/après. L'image « avant » est à gauche du volet, « après » à droite.
 * Accessible : role="slider", flèches (±5), Page préc./suiv. (±20), Début/Fin.
 * Pointeur : glisser n'importe où (souris, doigt, stylet) ; le défilement vertical reste libre (touch-action: pan-y).
 * À l'apparition, le volet fait un aller-retour pour montrer qu'il se déplace (sauf mouvement réduit).
 */
export default function BeforeAfterSlider({ before, after, labelBefore, labelAfter, alt }: Props) {
  const [pos, setPos] = useState(50)
  const root = useRef<HTMLDivElement>(null)
  const invite = useRef<gsap.core.Tween | null>(null)
  const dragging = useRef(false)

  const stopInvite = () => {
    invite.current?.kill()
    invite.current = null
  }

  const moveTo = useCallback((clientX: number) => {
    const rect = root.current?.getBoundingClientRect()
    if (!rect) return
    setPos(clamp(((clientX - rect.left) / rect.width) * 100))
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const proxy = { v: 50 }
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 70%",
        once: true,
        onEnter: () => {
          invite.current = gsap.to(proxy, {
            keyframes: [{ v: 30, duration: 0.6 }, { v: 70, duration: 0.9 }, { v: 50, duration: 0.6 }],
            ease: "power2.inOut",
            onUpdate: () => setPos(proxy.v),
          })
        },
      })
      return stopInvite
    })
  }, { scope: root })

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[e.key]
    if (step != null) {
      e.preventDefault()
      stopInvite()
      setPos((p) => clamp(p + step))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      stopInvite()
      setPos(e.key === "Home" ? 0 : 100)
    }
  }

  const rounded = Math.round(pos)

  return (
    <div
      ref={root}
      className="relative cursor-col-resize select-none overflow-hidden rounded-[var(--radius-card)] border-2 border-ink"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        stopInvite()
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        moveTo(e.clientX)
      }}
      onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX) }}
      onPointerUp={() => { dragging.current = false }}
      onPointerCancel={() => { dragging.current = false }}
    >
      {/* Après : image de fond, visible à droite du volet */}
      <img src={after} alt={`${alt} : après`} className="block w-full" draggable={false} />

      {/* Avant : par-dessus, visible à gauche du volet */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={`${alt} : avant`} className="block h-full w-full object-cover" draggable={false} />
      </div>

      {/* Volet et poignée */}
      <div className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-paper shadow-[0_0_0_1px_var(--color-ink)]" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Comparer avant et après : ${alt}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={`${rounded} % de l'image avant visible`}
        onKeyDown={onKey}
        className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-signal shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-froid/50"
        style={{ left: `${pos}%` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </div>

      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 font-mono text-[12px] font-semibold text-paper">{labelBefore}</span>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink px-3 py-1 font-mono text-[12px] font-semibold text-paper">{labelAfter}</span>
    </div>
  )
}
