"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP)

/**
 * « Vrai ou faux ? » : l'idée reçue du jour en mini-jeu.
 * On lit l'affirmation, on répond, la réponse se révèle (affirmation barrée, réponse surlignée).
 * La réponse est dans le HTML dès le départ (repliée) ; sans animation si reduced-motion.
 */
export default function MythQuiz({ claim, answer, highlight, slug }: { claim: string; answer: string; highlight: string; slug: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [choice, setChoice] = useState<"vrai" | "faux" | null>(null)
  const { contextSafe } = useGSAP({ scope: root })

  const pick = contextSafe((c: "vrai" | "faux") => {
    if (choice) return
    setChoice(c)
    requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root)
      gsap.from(q("[data-reveal] > *"), { y: 20, autoAlpha: 0, duration: 0.5, ease: "power3.out", stagger: 0.08 })
    })
  })

  const parts = answer.split(highlight)

  return (
    <div ref={root} className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-signal p-6 sm:p-10">
      <p className={cn(
        "font-display text-[clamp(1.5rem,3.6vw,2.6rem)] font-extrabold leading-tight transition-colors duration-300",
        choice ? "text-ink/60 line-through decoration-chaud decoration-[0.09em]" : "text-ink",
      )}>
        « {claim} »
      </p>

      {!choice ? (
        <div className="flex flex-wrap gap-3" role="group" aria-label="Votre réponse">
          {(["vrai", "faux"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="min-h-14 min-w-32 rounded-full border-[3px] border-ink bg-paper px-8 font-display text-2xl font-extrabold capitalize text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div data-reveal className="flex flex-col gap-4" aria-live="polite">
          <p className="font-display text-xl font-extrabold">
            {choice === "faux" ? "Bien vu : c'est faux." : "Raté : c'est une idée reçue."}
          </p>
          <p className="max-w-4xl font-display text-[clamp(1.7rem,4.2vw,3.1rem)] font-extrabold leading-[1.04] tracking-tight">
            {parts.flatMap((part, i) =>
              i < parts.length - 1
                ? [part, <strong key={i} className="hl hl-ink font-extrabold">{highlight}</strong>]
                : [part],
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/idees-recues#${slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-display text-[15px] font-bold text-paper hover:bg-ink-soft">
              Comprendre en 1 minute →
            </Link>
            <Link href="/idees-recues" className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-5 font-display text-[15px] font-bold hover:bg-ink hover:text-paper">
              Toutes les idées reçues
            </Link>
          </div>
        </div>
      )}

      {/* Réponse disponible sans interaction pour les moteurs et lecteurs d'écran */}
      {!choice && (
        <p className="sr-only">Réponse : c&apos;est une idée reçue. {answer}</p>
      )}
    </div>
  )
}
