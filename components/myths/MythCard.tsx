"use client"

import { useEffect, useId, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import ShareButton from "@/components/ShareButton"
import { splitHighlight } from "@/lib/pedago"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP)

export type MythTone = "signal" | "ink" | "white" | "chaud"

const TONES: Record<MythTone, { card: string; dark: boolean }> = {
  signal: { card: "bg-signal text-ink", dark: false },
  ink: { card: "bg-ink text-paper", dark: true },
  white: { card: "bg-white text-ink", dark: false },
  chaud: { card: "bg-chaud text-white", dark: true },
}

interface Props {
  slug: string
  claim: string
  answer: string
  highlight: string
  inSeason: boolean
  tone: MythTone
  shareText: string
  shareUrl: string
  storyHref: string
  /** explication, module de données, sources : rendus par le serveur */
  children: React.ReactNode
}

/**
 * Une idée reçue = une carte. Le bouton « Vrai ou faux ? » barre l'affirmation et révèle la réponse mot par mot.
 * L'explication, les données et les sources s'affichent avec la réponse (jamais avant, pour ne pas la donner).
 * Sans JavaScript, tout est affiché ; en mouvement réduit, la réponse apparaît sans animation.
 */
export default function MythCard({ slug, claim, answer, highlight, inSeason, tone, shareText, shareUrl, storyHref, children }: Props) {
  const root = useRef<HTMLElement>(null)
  const [armed, setArmed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const animate = useRef(false)
  const answerId = useId()
  const { card, dark } = TONES[tone]

  useEffect(() => setArmed(true), [])

  const reveal = () => {
    if (revealed) return
    animate.current = true
    setRevealed(true)
  }

  useGSAP(() => {
    if (!revealed || !animate.current) return
    animate.current = false
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root)
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(q("[data-strike]"), { backgroundSize: "0% 0.1em" }, { backgroundSize: "100% 0.1em", duration: 0.55, ease: "power2.inOut" })
        .from(q("[data-verdict]"), { y: 16, autoAlpha: 0, duration: 0.3 }, "-=0.1")
        .from(q("[data-word]"), { yPercent: 105, duration: 0.45, stagger: 0.05 }, "-=0.1")
        .fromTo(q("[data-answer-hl]"), { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", duration: 0.45, ease: "power2.inOut" })
        .from(q("[data-after]"), { autoAlpha: 0, y: 12, duration: 0.35 }, "<")
    })
    return () => mm.revert()
  }, { scope: root, dependencies: [revealed] })

  const hidden = armed && !revealed
  const hlClass = dark ? "hl hl-signal text-ink" : "hl hl-ink"
  const hlStyle = { backgroundSize: "100% 100%", backgroundPosition: "0 0" }
  const tokens = splitHighlight(answer, highlight).flatMap((part, p) =>
    part.text.split(/(\s+)/).filter(Boolean).map((w, i) => ({ w, hl: part.hl, key: `${p}-${i}` })),
  )

  return (
    <article
      ref={root}
      id={slug}
      aria-labelledby={`${slug}-titre`}
      className="scroll-mt-20 sm:scroll-mt-24"
    >
      <div
        className={cn(
          "relative flex flex-col gap-6 rounded-[var(--radius-card)] px-5 pb-6 pt-5 sm:px-10 sm:pb-10 sm:pt-8",
          card,
        )}
      >
        {inSeason && (
          <p className={cn("w-fit rounded-full px-2.5 py-0.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]", dark ? "bg-paper text-ink" : "bg-ink text-paper")}>
            De saison
          </p>
        )}

        {/* L'affirmation, puis la réponse au toucher du bouton */}
        <div className="flex flex-col gap-6">
          <h2 id={`${slug}-titre`} className={cn("font-display text-[clamp(2rem,8vw,4.2rem)] font-extrabold leading-[1] tracking-tight transition-opacity duration-500", revealed && "opacity-60")}>
            <span aria-hidden="true">«&#8239;</span>
            <span
              data-strike
              style={{
                backgroundImage: `linear-gradient(${dark ? "var(--color-signal)" : "var(--color-chaud)"}, ${dark ? "var(--color-signal)" : "var(--color-chaud)"})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "0 58%",
                backgroundSize: revealed || !armed ? "100% 0.1em" : "0% 0.1em",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {claim}
            </span>
            <span aria-hidden="true">&#8239;»</span>
          </h2>

          <div className="relative">
            <button
              type="button"
              aria-expanded={!hidden}
              aria-controls={answerId}
              onClick={(e) => { e.stopPropagation(); reveal() }}
              className={cn(
                "absolute left-0 top-0 z-10 inline-flex min-h-14 items-center gap-3 rounded-full px-6 font-display text-[clamp(1.1rem,4.5vw,1.4rem)] font-extrabold",
                "transition-transform hover:-translate-y-0.5",
                dark ? "bg-paper text-ink" : "bg-ink text-paper",
                !hidden && "sr-only",
              )}
            >
              Vrai ou faux&#8239;?
              <span className={cn("rounded-full px-3 py-1 text-[15px]", dark ? "bg-signal text-ink" : "bg-signal text-ink")}>Voir la réponse</span>
            </button>
            <div id={answerId} className={cn("flex flex-col gap-2", hidden && "invisible")}>
              <p data-verdict className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] opacity-85">En vrai</p>
              <p className="font-display text-[clamp(1.6rem,5.6vw,3.2rem)] font-extrabold leading-[1.06] tracking-tight">
                {tokens.map(({ w, hl, key }) =>
                  /^\s+$/.test(w) ? (
                    <span key={key} data-answer-hl={hl ? "" : undefined} className={hl ? hlClass : undefined} style={hl ? hlStyle : undefined}>{w}</span>
                  ) : (
                    <span key={key} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                      <span data-word data-answer-hl={hl ? "" : undefined} className={cn("inline-block", hl && hlClass)} style={hl ? hlStyle : undefined}>{w}</span>
                    </span>
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div data-after className={cn("flex flex-wrap items-center gap-2", hidden && "invisible")}>
          <div className={cn("rounded-full", dark && "bg-paper text-ink")}>
            <ShareButton text={shareText} url={shareUrl} label="Partager" />
          </div>
          <a
            href={storyHref}
            download={`cestchaud-${slug}.png`}
            className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-display text-[15px] font-bold underline-offset-4 hover:underline")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            Image story
            <span className="sr-only">(télécharger l&apos;image verticale 1080 × 1920)</span>
          </a>
        </div>

      </div>

      {/* L'explication : affichée avec la réponse (toujours visible sans JavaScript) */}
      <div data-after className={cn("flex flex-col gap-6 pb-10 pt-6", hidden && "hidden")}>
        {children}
      </div>
    </article>
  )
}
