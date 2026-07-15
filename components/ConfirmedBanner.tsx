"use client"
import { useSearchParams } from "next/navigation"

export default function ConfirmedBanner() {
  const params = useSearchParams()
  const confirmed = params.get("confirmed")
  const unsub = params.get("unsub")
  const city = params.get("city")

  if (confirmed === "ok") {
    return (
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-start gap-3">
          <span className="text-green-500 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Adresse email confirmée</p>
            <p className="text-green-700 text-sm mt-0.5">
              Votre inscription est active. Votre premier briefing climatique arrivera demain matin.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (unsub === "ok" && city) {
    return (
      <div className="bg-neutral-100 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-start gap-3">
          <span className="text-neutral-400 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-neutral-700 text-sm">{city} retiré de votre briefing</p>
            <p className="text-neutral-500 text-sm mt-0.5">
              Vous ne recevrez plus les données de cette ville. Vous pouvez vous réinscrire à tout moment depuis sa page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
