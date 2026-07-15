"use client"
import { useSearchParams } from "next/navigation"

export default function ConfirmedBanner() {
  const params = useSearchParams()
  if (params.get("confirmed") !== "ok") return null

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
