"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import Button from "@/components/ui/Button"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import ShareButton from "@/components/ShareButton"
import { buildQuiz, type GameCity, type GameWorldCity, type Question } from "@/lib/twins-game"
import { fmt, fmtDelta } from "@/lib/format"
import { deMonth, MONTHS } from "@/lib/season"
import { cn } from "@/lib/cn"

gsap.registerPlugin(useGSAP, ScrambleTextPlugin)

const LETTERS = ["A", "B", "C", "D"]

interface Props {
  cities: GameCity[]
  world: GameWorldCity[]
  /** graine du jour : même série pour tout le monde ce jour-là */
  seed: number
  month: number
  /** mode atelier : très gros caractères, lisibles de loin */
  atelier: boolean
}

export default function JeuClient({ cities, world, seed, month, atelier }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [round, setRound] = useState(0)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [chosen, setChosen] = useState<number | null>(null)

  // Série 0 = la série du jour ; « Rejouer » passe à une autre série sans recharger la page
  const questions = useMemo(() => buildQuiz(cities, world, seed + round * 7919, month), [cities, world, seed, round, month])
  const total = questions.length
  const done = step >= total
  const q = questions[step] as Question | undefined
  const score = answers.filter(Boolean).length

  const choose = useCallback((i: number) => {
    if (chosen != null || !q) return
    setChosen(i)
    setAnswers((a) => [...a, i === q.answer])
  }, [chosen, q])

  const next = useCallback(() => {
    if (chosen == null) return
    setChosen(null)
    setStep((s) => s + 1)
  }, [chosen])

  const replay = () => {
    setRound((r) => r + 1)
    setStep(0)
    setAnswers([])
    setChosen(null)
  }

  // Clavier : A-D ou 1-4 pour répondre, Entrée pour continuer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return
      const k = e.key.toUpperCase()
      const i = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : ["1", "2", "3", "4"].indexOf(k)
      if (i >= 0 && chosen == null) choose(i)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [choose, chosen])

  // Focus : la réponse donnée → bouton « Suivante » ; nouvelle question → son intitulé
  useEffect(() => {
    if (chosen != null) root.current?.querySelector<HTMLButtonElement>("[data-next]")?.focus({ preventScroll: true })
  }, [chosen])
  useEffect(() => {
    if (step === 0 && round === 0) return
    root.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
    heading.current?.focus({ preventScroll: true })
  }, [step, round])

  // Révélation animée après chaque réponse
  useGSAP(() => {
    if (chosen == null) return
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const r = gsap.utils.selector(root)
      gsap.from(r("[data-reveal]"), { y: 24, autoAlpha: 0, duration: 0.45, ease: "power3.out" })
      gsap.from(r("[data-choice-right]"), { scale: 0.94, duration: 0.5, ease: "back.out(3)" })
      const name = r("[data-reveal-name]")[0] as HTMLElement | undefined
      if (name) gsap.to(name, { duration: 0.8, scrambleText: { text: name.textContent ?? "", chars: "ABCDEFGHIJKLMNOPRSTUVÉ", speed: 0.6 } })
      const count = r("[data-reveal-count]")[0] as HTMLElement | undefined
      if (count) {
        const from = Number(count.dataset.from), to = Number(count.dataset.to)
        const s = { v: from }
        gsap.to(s, { v: to, duration: 0.9, ease: "power2.out", onUpdate: () => { count.textContent = `${fmtDelta(s.v - from)} °C` } })
      }
    })
  }, { scope: root, dependencies: [chosen, step, round] })

  const big = atelier
  const title = (
    <h1 className={cn("font-display font-extrabold leading-[0.95] tracking-tight", big ? "text-[clamp(2.4rem,5vw,4rem)]" : "text-[clamp(1.9rem,8vw,3rem)]")}>
      Le jeu des <Hl>jumeaux 2050</Hl>.
    </h1>
  )

  if (total === 0) {
    return (
      <div className="flex flex-col gap-4 pt-4">
        {title}
        <p className="rounded-2xl bg-signal p-4 font-display text-xl font-bold">Les données climatiques sont indisponibles : le jeu ne peut pas être généré pour le moment.</p>
      </div>
    )
  }

  if (done) {
    const blocks = answers.map((a) => (a ? "🟩" : "🟥")).join("")
    const ratio = score / total
    const verdict = ratio === 1 ? "Sans faute." : ratio >= 0.6 ? "Bien vu." : "Surprenant, non ?"
    const learn = ratio === 1
      ? "Vous savez lire un climat. Partagez-le pour voir qui fait mieux."
      : "Personne ne devine spontanément que le climat d'une ville française en 2050 existe déjà ailleurs, parfois à des milliers de kilomètres. C'est justement ce que ces données montrent."
    const shareText = `${blocks} ${score}/${total} au jeu des jumeaux 2050. Et vous ?`
    const r = answers.map((a) => (a ? "1" : "0")).join("")
    return (
      <div ref={root} className="flex scroll-mt-20 flex-col gap-5 pt-2">
        {title}
        <div className="-mx-4 flex min-h-[60svh] flex-col justify-center gap-4 bg-ink px-4 py-8 text-paper sm:mx-0 sm:rounded-[var(--radius-card)] sm:p-10" aria-live="polite">
          <Eyebrow className="text-paper/70">Votre score</Eyebrow>
          <p className="font-display text-[clamp(5rem,30vw,10rem)] font-extrabold leading-none tracking-tight">
            {score}<span className="text-paper/50">/{total}</span>
          </p>
          <p className="text-[2rem] leading-none" aria-hidden="true">{blocks}</p>
          <p className="font-display text-[clamp(1.6rem,6vw,2.4rem)] font-extrabold leading-tight text-signal">{verdict}</p>
          <p className="max-w-[52ch] text-[16px] leading-relaxed text-paper/85">{learn}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a href={`/jumeaux/jeu/story?r=${r}`} download={`cestchaud-jeu-${score}-sur-${total}.png`} className="inline-flex min-h-11 items-center rounded-full bg-signal px-5 font-display text-[15px] font-bold text-ink transition-colors hover:bg-paper">
              Télécharger l&apos;image story
            </a>
            <span className="rounded-full bg-paper"><ShareButton text={shareText} url="https://www.cestchaud.fr/jumeaux/jeu" label="Partager mon score" /></span>
          </div>
        </div>
        <ol className="flex flex-col gap-2">
          {questions.map((x, i) => (
            <li key={i} className={cn("flex items-start gap-3 rounded-2xl p-4 text-[15px]", answers[i] ? "bg-white" : "bg-paper-deep")}>
              <span className="font-display font-extrabold">{answers[i] ? "Trouvé" : "Raté"}</span>
              <span>
                {x.kind === "twin"
                  ? <>Le jumeau 2050 de {x.city.name} : <strong>{x.choices[x.answer].name}</strong> ({x.choices[x.answer].country}).</>
                  : <>{x.city.name} aujourd&apos;hui : {fmt(x.temp, 0)}&#8239;°C pour une normale de {fmt(x.normal, 0)}&#8239;°C, soit <strong>{fmtDelta(x.anomaly)}&#8239;°C</strong>.</>}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button onClick={replay}>Rejouer une autre série</Button>
          <Link href="/jumeaux" className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-5 font-display text-[15px] font-bold hover:bg-ink hover:text-paper">Trouver le jumeau de ma ville</Link>
        </div>
      </div>
    )
  }

  if (!q) return null
  const answered = chosen != null
  const right = answered && chosen === q.answer

  return (
    <div ref={root} className={cn("flex scroll-mt-20 flex-col gap-4 pt-2", big && "gap-8")}>
      {step === 0 && round === 0 && !answered ? title : <p className="sr-only">Le jeu des jumeaux 2050</p>}

      <div className={cn("-mx-4 flex min-h-[calc(100svh-9rem)] flex-col gap-5 bg-ink px-4 py-6 text-paper sm:mx-0 sm:min-h-0 sm:rounded-[var(--radius-card)] sm:p-8", big && "gap-8 sm:p-12")}>
        {/* progression */}
        <div className="flex items-center justify-between gap-3">
          <ol className="flex gap-1.5" aria-label="Progression">
            {questions.map((_, i) => (
              <li key={i} className={cn("h-2 rounded-full transition-all", i < answers.length ? (answers[i] ? "w-8 bg-signal" : "w-8 bg-chaud") : i === step ? "w-8 bg-paper" : "w-5 bg-paper/25")}>
                <span className="sr-only">{i < answers.length ? (answers[i] ? "trouvée" : "ratée") : i === step ? "en cours" : "à venir"}</span>
              </li>
            ))}
          </ol>
          <span className={cn("font-mono font-semibold text-paper/75", big ? "text-[20px]" : "text-[13px]")}>Question {step + 1} sur {total}</span>
        </div>

        <Eyebrow className={cn("text-signal", big && "text-[20px]")}>{q.kind === "twin" ? "Jumeau 2050" : `Météo du jour · ${MONTHS[q.month]}`}</Eyebrow>
        <h2 ref={heading} tabIndex={-1} className={cn("font-display font-extrabold leading-[1.02] tracking-tight outline-none", big ? "text-[clamp(2.6rem,6vw,5rem)]" : "text-[clamp(1.9rem,8vw,3rem)]")}>
          {q.kind === "twin" ? (
            <>En 2050, {q.city.name} aura le climat actuel de…</>
          ) : (
            <>Aujourd&apos;hui à {q.city.name}, il fait <span className="text-signal">{fmt(q.temp, 0)}&#8239;°C</span> ressentis. Par rapport à la normale {deMonth(q.month)}, c&apos;est…</>
          )}
        </h2>

        <ul className={cn("grid gap-2.5", q.kind === "twin" && !big && "sm:grid-cols-2", big && "grid-cols-1 gap-4 lg:grid-cols-2")}>
          {q.choices.map((c, i) => {
            const isRight = i === q.answer
            const isChosen = i === chosen
            const label = typeof c === "string" ? c : c.name
            const sub = typeof c === "string" ? null : c.country
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={answered}
                  aria-pressed={isChosen}
                  data-choice-right={answered && isRight ? "" : undefined}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border-[3px] text-left transition-colors",
                    big ? "min-h-24 p-5" : "min-h-16 p-3",
                    !answered && "border-paper/30 bg-paper/5 hover:border-signal hover:bg-paper/10",
                    answered && isRight && "border-signal bg-signal text-ink",
                    answered && isChosen && !isRight && "border-chaud bg-chaud text-white",
                    answered && !isRight && !isChosen && "border-paper/15 opacity-60",
                  )}
                >
                  <span className={cn("flex shrink-0 items-center justify-center rounded-full font-display font-extrabold", big ? "h-16 w-16 text-[2.2rem]" : "h-10 w-10 text-[1.25rem]", answered && (isRight || isChosen) ? "bg-ink text-paper" : "bg-paper text-ink")} aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className={cn("font-display font-extrabold leading-tight", big ? "text-[clamp(1.8rem,3.4vw,2.8rem)]" : "text-[1.25rem]")}>{label}</span>
                    {sub && <span className={cn(big ? "text-[1.3rem]" : "text-[14px]", answered && (isRight || isChosen) ? "opacity-80" : "text-paper/70")}>{sub}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {answered && (
          <div data-reveal className={cn("flex flex-col gap-3 rounded-2xl bg-paper p-4 text-ink", big && "p-8")} aria-live="polite">
            <p className={cn("font-display font-extrabold", big ? "text-[2.4rem]" : "text-[1.5rem]")}>{right ? "Bien vu !" : "Raté."}</p>
            {q.kind === "twin" ? (
              <p className={cn("leading-snug", big ? "text-[1.6rem]" : "text-[16px]")}>
                Le jumeau 2050 de {q.city.name}, c&apos;est <strong data-reveal-name>{q.choices[q.answer].name}</strong> : même climat à {fmt(q.choices[q.answer].rmse)}&#8239;°C près, mois par mois.
                {" "}Les autres propositions sont à plus de {fmt(Math.floor(Math.min(...q.choices.filter((_, i) => i !== q.answer).map((c) => c.rmse))), 0)}&#8239;°C d&apos;écart.
              </p>
            ) : (
              <p className={cn("leading-snug", big ? "text-[1.6rem]" : "text-[16px]")}>
                Normale {deMonth(q.month)} à {q.city.name} : {fmt(q.normal, 0)}&#8239;°C. Aujourd&apos;hui : {fmt(q.temp, 0)}&#8239;°C, soit{" "}
                <strong data-reveal-count data-from={q.normal} data-to={q.temp}>{fmtDelta(q.anomaly)}&#8239;°C</strong>.
                {" "}Un jour, c&apos;est de la météo ; c&apos;est l&apos;accumulation des écarts sur des années qui fait le climat.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button data-next onClick={next} className={cn(big && "min-h-16 px-8 text-[1.4rem]")}>
                {step < total - 1 ? "Question suivante" : "Voir mon score"}
              </Button>
              {q.kind === "twin" && (
                <Link href={`/jumeaux?ville=${q.city.slug}`} className="text-[15px] font-semibold underline underline-offset-2">Voir la comparaison</Link>
              )}
            </div>
          </div>
        )}
        {!answered && <p className={cn("mt-auto text-paper/60", big ? "text-[18px]" : "text-[13px]")}>Touchez une réponse, ou tapez A, B, C ou D.</p>}
      </div>
    </div>
  )
}
