"use client"
import { useSearchParams } from "next/navigation"

export default function ConfirmedBanner() {
  const params = useSearchParams()
  const action = params.get("action")

  if (action === "deleted") {
    return (
      <div className="bg-neutral-100 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-start gap-3">
          <span className="text-neutral-400 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-neutral-700 text-sm">Compte supprime</p>
            <p className="text-neutral-500 text-sm mt-0.5">
              Vos donnees ont ete supprimees. Vous pouvez vous reabonner a tout moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (action === "invalid-token") {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">ℹ</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Lien invalide ou expire</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Ce lien ne correspond a aucun abonnement actif. Retrouvez votre lien dans un email recapitulatif, ou reabonnez-vous depuis la page de votre ville.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
