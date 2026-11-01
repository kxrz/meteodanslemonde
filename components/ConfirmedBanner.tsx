"use client"

import { useSearchParams } from "next/navigation"

/** Message de retour après une suppression de compte ou un lien invalide (paramètre ?action=). */
export default function ConfirmedBanner() {
  const action = useSearchParams().get("action")

  const msg =
    action === "deleted"
      ? { title: "Compte supprimé.", text: "Vos données ont été effacées de notre base et de notre outil d'envoi. Vous pouvez vous réabonner quand vous voulez." }
      : action === "invalid-token"
        ? { title: "Lien invalide ou expiré.", text: "Ce lien ne correspond à aucun abonnement. Utilisez le lien de votre dernier email, ou réabonnez-vous ci-dessous." }
        : null

  if (!msg) return null
  return (
    <div role="status" className="mb-6 rounded-[var(--radius-card)] border-2 border-ink bg-signal p-4 sm:p-5">
      <p className="font-display text-lg font-extrabold">{msg.title}</p>
      <p className="text-[15px] text-ink-soft">{msg.text}</p>
    </div>
  )
}
