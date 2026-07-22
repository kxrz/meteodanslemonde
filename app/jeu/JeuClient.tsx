"use client"

import { useState } from "react"
import type { QuizQuestion } from "./page"
import Link from "next/link"

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
    const shareText = `J'ai trouvé ${score}/5 au quiz Jumeau climatique sur cestchaud.fr — et toi ?`
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-6 text-center">cestchaud.fr · Jumeau climatique</p>
          <div className="bg-white rounded-3xl p-8 mb-4 text-center">
            <p className="text-6xl font-black text-neutral-900 mb-1">{score}<span className="text-3xl text-neutral-300">/5</span></p>
            <p className="text-sm text-neutral-500 mb-6">
              {score === 5 ? "Parfait. La France n'a plus de secrets pour toi." :
               score >= 3 ? "Pas mal. Les jumeaux climatiques sont traitres." :
               "Le climat mondial, ca s'apprend."}
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {answers.map((a, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${a.correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                  {a.correct ? "✓" : "✗"}
                </div>
              ))}
            </div>
            <div className="space-y-2 text-left mb-6">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700 font-medium">{q.cityFR.name}</span>
                  <span className={answers[i]?.correct ? "text-green-600" : "text-red-500"}>{q.correctCity}, {q.correctCountry}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ text: shareText, url: "https://www.cestchaud.fr/jeu" }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(shareText + " https://www.cestchaud.fr/jeu")
                }
              }}
              className="w-full bg-neutral-900 text-white rounded-2xl py-3 text-sm font-bold hover:bg-neutral-700 transition-colors mb-3"
            >
              Partager mon score
            </button>
            <Link href="/jeu" className="block text-center text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
              Rejouer (nouvelles villes)
            </Link>
          </div>
          <Link href="/" className="block text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors">
            cestchaud.fr
          </Link>
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
  )
}
