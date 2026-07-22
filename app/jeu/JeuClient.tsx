"use client"

import { useState } from "react"
import type { QuizQuestion } from "./page"
import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

type Props = { questions: QuizQuestion[] }

type Answer = { chosen: string; correct: boolean }

export default function JeuClient({ questions }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [chosen, setChosen] = useState<string | null>(null)

  const q = questions[step]
  const isDone = step >= questions.length
  const score = answers.filter((a) => a.correct).length

  function handleChoice(country: string) {
    if (chosen) return
    setChosen(country)
  }

  function handleNext() {
    if (!chosen) return
    const correct = chosen === q.correctCountry
    setAnswers((prev) => [...prev, { chosen, correct }])
    setChosen(null)
    setStep((s) => s + 1)
  }

  const fmtAnomaly = (a: number | null) => {
    if (a === null) return null
    const sign = a > 0 ? "+" : ""
    return `${sign}${a}°C vs normale`
  }

  const anomalyColor = (a: number | null) => {
    if (a === null) return "text-neutral-400"
    if (a >= 5) return "text-red-600 font-bold"
    if (a >= 2) return "text-orange-500 font-semibold"
    if (a <= -2) return "text-blue-500 font-semibold"
    return "text-neutral-500"
  }

  if (isDone) {
    const emoji = ["❌", "❌", "🟠", "🟠", "🟢", "🟢"][score]
    const scoreBlocks = answers.map((a) => a.correct ? "🟩" : "🟥").join("")
    const shareText = score === 5
      ? `${scoreBlocks} 5/5 au jeu du jumeau climatique. Aujourd'hui la France ressemble a l'Afrique du Nord, tu savais ? cestchaud.fr/jeu`
      : `${scoreBlocks} ${score}/5 au jeu du jumeau climatique. Peux-tu faire mieux ? cestchaud.fr/jeu`

    const resultLabel = score === 5
      ? "Sans faute. Tu connais vraiment tes jumeaux climatiques."
      : score >= 3
      ? "Bien joue. Quelques jumeaux t'ont echappe."
      : "Ces resultats montrent a quel point les equivalences climatiques sont surprenantes."

    const learnNote = score < 5
      ? "Un mauvais score n'est pas une honte : personne ne sait intuitivement qu'en juillet, Strasbourg ressemble a Istanbul ou que Bordeaux rejoint Tunis. C'est justement pour ca que ces donnees existent."
      : null

    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
        <SiteHeader asLink subtitle="Le jeu du jumeau climatique" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">

          {/* Score */}
          <div className="bg-white rounded-3xl p-8 text-center">
            <p className="text-5xl mb-2">{emoji}</p>
            <p className="text-6xl font-black text-neutral-900 mb-1">{score}<span className="text-3xl text-neutral-300">/5</span></p>
            <p className="text-sm text-neutral-500 mt-2">{resultLabel}</p>
          </div>

          {/* Recap educatif */}
          <div className="bg-white rounded-3xl p-6 space-y-3">
            {questions.map((q, i) => {
              const correct = answers[i]?.correct
              return (
                <div key={i} className={`rounded-2xl p-4 ${correct ? "bg-green-50" : "bg-orange-50"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-neutral-800">{q.cityFR.name}</span>
                    <span className={`text-xs font-bold ${correct ? "text-green-600" : "text-orange-600"}`}>
                      {correct ? "Trouve" : "Rate"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">
                    Ressemble aujourd&apos;hui a <strong>{q.correctCity}</strong>, {q.correctCountry}
                    {q.cityFR.apparentTempMax ? ` (${q.cityFR.apparentTempMax}°C)` : ""}
                    {!correct && (
                      <span className="block mt-1 text-neutral-400">Tu avais choisi : {answers[i]?.chosen}</span>
                    )}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Note pedagogique si score faible */}
          {learnNote && (
            <div className="bg-neutral-900 rounded-3xl p-6">
              <p className="text-xs text-white/70 leading-relaxed">{learnNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ text: shareText, url: "https://www.cestchaud.fr/jeu" }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(shareText)
                }
              }}
              className="w-full bg-neutral-900 text-white rounded-2xl py-3.5 text-sm font-bold hover:bg-neutral-700 transition-colors"
            >
              Partager mon score
            </button>
            <button onClick={() => { window.location.href = "/jeu" }} className="w-full text-center text-sm text-neutral-400 hover:text-neutral-700 transition-colors py-2 block">
              Rejouer avec de nouvelles villes
            </button>
          </div>

        </div>
        </div>
        <PageFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <SiteHeader asLink subtitle="Le jeu du jumeau climatique" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progression */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i < step ? "w-6 bg-neutral-900" : i === step ? "w-6 bg-orange-400" : "w-4 bg-neutral-200"}`} />
            ))}
          </div>
          <span className="text-[10px] text-neutral-400">{step + 1}/5</span>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl p-6 mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">{q.cityFR.region}</p>
          <p className="text-2xl font-black text-neutral-900 mb-4">{q.cityFR.name}</p>

          <div className="flex items-end gap-4 mb-1">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-400 mb-0.5">Ressenti max aujourd'hui</p>
              <p className="text-4xl font-black text-neutral-900 leading-none">{q.cityFR.apparentTempMax}°C</p>
            </div>
            {q.cityFR.anomaly !== null && (
              <div className="pb-1">
                <p className={`text-sm ${anomalyColor(q.cityFR.anomaly)}`}>{fmtAnomaly(q.cityFR.anomaly)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="bg-neutral-900 rounded-3xl px-6 py-4 mb-3">
          <p className="text-white text-sm font-semibold leading-snug">
            Cette ville ressemble aujourd&apos;hui a une ville de quel pays ?
          </p>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {q.choices.map((country) => {
            const isChosen = chosen === country
            const isCorrect = chosen !== null && country === q.correctCountry
            const isWrong = isChosen && !isCorrect

            let cls = "rounded-2xl p-4 text-left transition-all border-2 "
            if (!chosen) {
              cls += "bg-white border-transparent hover:border-orange-300 hover:shadow-sm cursor-pointer"
            } else if (isCorrect) {
              cls += "bg-green-50 border-green-400"
            } else if (isWrong) {
              cls += "bg-red-50 border-red-300"
            } else {
              cls += "bg-white border-transparent opacity-40"
            }

            return (
              <button key={country} className={cls} onClick={() => handleChoice(country)} disabled={!!chosen}>
                <p className="text-sm font-bold text-neutral-900">{country}</p>
                {isCorrect && chosen && (
                  <p className="text-xs text-green-600 mt-0.5">{q.correctCity}</p>
                )}
              </button>
            )
          })}
        </div>

        {/* Reveal + next */}
        {chosen && (
          <button
            onClick={handleNext}
            className="w-full bg-neutral-900 text-white rounded-2xl py-3.5 text-sm font-bold hover:bg-neutral-700 transition-colors"
          >
            {step < questions.length - 1 ? "Ville suivante →" : "Voir mon score →"}
          </button>
        )}
      </div>
      </div>
      <PageFooter />
    </div>
  )
}
