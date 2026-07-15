"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  cityName: string
  citySlug: string
  onClose: () => void
}

export default function SubscribeModal({ cityName, citySlug, onClose }: Props) {
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) return
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email, citySlug, cityName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erreur serveur")
      }
      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Erreur inattendue")
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(17,17,17,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p className="font-black text-neutral-900 text-lg mb-2">Vérifiez vos emails</p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer votre briefing matinal pour{" "}
              <strong className="text-neutral-700">{cityName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Briefing matinal
              </p>
              <p className="font-black text-neutral-900 text-xl leading-snug">
                Le ressenti de {cityName} chaque matin
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Ville suivie</span>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {cityName}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-neutral-500 block mb-1.5">Prénom</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                  required
                  autoComplete="given-name"
                  className="w-full bg-neutral-100 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  required
                  autoComplete="email"
                  className="w-full bg-neutral-100 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <label className="flex gap-3 cursor-pointer group">
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${consent ? "bg-orange-500 border-orange-500" : "bg-white border-neutral-300 group-hover:border-orange-300"}`}>
                  {consent && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                J&apos;accepte de recevoir un email chaque matin avec les données météo de {cityName}.{" "}
                <a href="/confidentialite" className="underline hover:text-neutral-700 transition-colors">Politique de confidentialité</a>.
              </p>
            </label>

            {errorMsg && (
              <p className="text-xs text-red-500">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={!consent || status === "loading"}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {status === "loading" ? "Inscription…" : "S'inscrire gratuitement"}
            </button>

            <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
              Gratuit. Désabonnement en un clic. Aucune publicité.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
