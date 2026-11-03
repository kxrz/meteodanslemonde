"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { fmt, fmtDelta } from "@/lib/format"

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin)

/**
 * Moteur d'animation unique du site. Les composants serveur posent des attributs :
 *   data-anim="split"     titre découpé en mots qui montent
 *   data-anim="hl"        surligneur qui se trace sous les mots en gras
 *   data-anim="count"     nombre qui compte de data-from à data-to (format français)
 *   data-anim="scramble"  texte qui se « cherche » avant de se fixer (noms révélés)
 *   data-anim="stagger"   enfants directs qui arrivent l'un après l'autre
 * Le texte final est toujours dans le HTML : sans JS ou avec prefers-reduced-motion, rien ne bouge.
 */
export default function MotionEngine() {
  const pathname = usePathname()

  useEffect(() => {
    const mm = gsap.matchMedia()

    // Laisse React finir de peindre la nouvelle route
    const raf = requestAnimationFrame(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const once = (el: Element) => ({ trigger: el, start: "top 88%", once: true })

        gsap.utils.toArray<HTMLElement>('[data-anim="split"]').forEach((el) => {
          if (el.dataset.animDone) return
          const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" })
          // Une ponctuation collée à un élément (« <Hl>non</Hl>. ») devient un « mot » à part, que le
          // navigateur peut renvoyer seul à la ligne : on la recolle au mot qui la précède.
          const words: HTMLElement[] = []
          for (const w of split.words as HTMLElement[]) {
            const t = (w.textContent ?? "").trim()
            const last = words[words.length - 1]
            if (last && /^[.,;:!?…»)]+$/.test(t)) {
              last.textContent = (last.textContent ?? "") + t
              const unit = w.parentElement?.classList.contains("split-word-mask") ? w.parentElement : w
              unit.remove()
            } else {
              words.push(w)
            }
          }
          gsap.from(words, {
            yPercent: 110,
            duration: 0.7,
            ease: "power4.out",
            stagger: 0.045,
            scrollTrigger: once(el),
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-anim="hl"]').forEach((el) => {
          const full = el.classList.contains("hl-ink") ? "100% 100%" : "100% 0.42em"
          const zero = el.classList.contains("hl-ink") ? "0% 100%" : "0% 0.42em"
          gsap.fromTo(el, { backgroundSize: zero }, {
            backgroundSize: full,
            duration: 0.75,
            ease: "power3.inOut",
            delay: 0.25,
            scrollTrigger: once(el),
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-anim="count"]').forEach((el) => {
          const to = Number(el.dataset.to)
          if (!Number.isFinite(to)) return
          const from = el.dataset.from != null && el.dataset.from !== "" ? Number(el.dataset.from) : 0
          const decimals = Number(el.dataset.decimals ?? 0)
          const signed = el.dataset.signed === "1"
          const unit = el.dataset.unit ?? ""
          const final = el.textContent
          const state = { v: from }
          const render = () => {
            el.textContent = (signed ? fmtDelta(state.v, decimals) : fmt(state.v, decimals)) + unit
          }
          gsap.to(state, {
            v: to,
            duration: Math.min(1.6, 0.6 + Math.abs(to - from) * 0.06),
            ease: "power2.out",
            onStart: render,
            onUpdate: render,
            onComplete: () => { el.textContent = final },
            scrollTrigger: once(el),
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-anim="scramble"]').forEach((el) => {
          const text = el.textContent ?? ""
          gsap.to(el, {
            duration: 1.1,
            scrambleText: { text, chars: "°+−0123456789", speed: 0.6, revealDelay: 0.3 },
            scrollTrigger: once(el),
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-anim="stagger"]').forEach((el) => {
          gsap.from(el.children, {
            y: 18,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.06,
            scrollTrigger: once(el),
          })
        })
      })
      ScrollTrigger.refresh()
    })

    return () => {
      cancelAnimationFrame(raf)
      mm.revert()
    }
  }, [pathname])

  return null
}
