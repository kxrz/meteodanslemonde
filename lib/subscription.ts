// Logique pure du briefing par email : validations, correspondance ville ↔ données,
// messages d'erreur lisibles et textes de confidentialité partagés.
// Aucune dépendance serveur ici : testable et importable côté client.

import { slugify } from "@/lib/slugify"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidEmail(email: string | null | undefined): boolean {
  return !!email && EMAIL_RE.test(email.trim())
}

export function normalizeFirstName(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/\s+/g, " ").slice(0, 80)
}

/** Les liens d'email portent un jeton UUID : tout le reste est refusé avant d'interroger la base. */
export function isToken(token: string | null | undefined): token is string {
  return !!token && UUID_RE.test(token)
}

export interface BriefingCity {
  id: string
  name: string
  lat: number
  lon: number
}

/**
 * Retrouve une des villes suivies à partir du slug enregistré à l'inscription.
 * Le slug vient de slugify(nom) (ex. « clermont-ferrand ») alors que les données
 * climatiques sont indexées par identifiant (ex. « clermont ») : on accepte les deux.
 * Retourne null pour une ville hors liste (le briefing ne couvre que les villes suivies).
 */
export function resolveBriefingCity<T extends BriefingCity>(slug: string, cities: T[]): T | null {
  return cities.find((c) => c.id === slug || slugify(c.name) === slug) ?? null
}

/** Message lisible pour une réponse en erreur de /api/subscribe. */
export function subscribeErrorMessage(status: number, code?: string): string {
  if (status === 429) return "Trop de tentatives en peu de temps. Réessayez dans une minute."
  if (code === "invalid-email") return "Cette adresse email ne semble pas valide. Vérifiez-la."
  if (code === "missing-fields") return "Il manque votre email ou votre ville."
  if (code === "unknown-city") return "Cette ville ne fait pas partie des villes suivies. Choisissez-en une autre."
  if (code === "email-failed") return "Votre inscription est enregistrée, mais l'email de confirmation n'est pas parti. Réessayez dans quelques minutes : vous ne serez pas inscrit deux fois."
  if (status >= 500) return "Le service d'inscription ne répond pas pour le moment. Réessayez dans quelques minutes."
  return "L'inscription n'a pas abouti. Vérifiez vos informations et réessayez."
}

/**
 * Ce que fait réellement le code (app/profil/actions.ts, app/api/unsubscribe) :
 * - désabonnement : l'adresse est marquée « désabonnée » (plus aucun envoi), elle reste en base
 *   avec le prénom et les villes, pour permettre un réabonnement ;
 * - suppression du compte (depuis le profil) : effacement immédiat de la base et des listes Resend.
 * Aucun effacement automatique n'est programmé. Ce texte est repris partout (notifications, profil, confidentialité).
 */
export const RETENTION = {
  short: "Données gardées tant que vous ne supprimez pas votre compte. Suppression immédiate et définitive en un clic depuis votre profil.",
  long:
    "Tant que vous êtes abonné, nous gardons votre prénom, votre email et vos villes. Si vous vous désabonnez, plus aucun email ne part, mais ces données restent dans notre base, marquées comme désabonnées, pour que vous puissiez vous réabonner sans tout ressaisir. Elles y restent jusqu'à ce que vous supprimiez votre compte : la suppression, depuis votre profil, efface immédiatement vos données de notre base et des listes de notre prestataire d'envoi. Une inscription jamais confirmée suit la même règle.",
}

export const PROCESSORS = {
  resend: "Resend (Resend Inc., États-Unis) envoie les emails. Le transfert vers les États-Unis est encadré par le Data Privacy Framework UE–États-Unis.",
  neon: "Neon (Neon Inc.) héberge la base de données des abonnements.",
  vercel: "Vercel (Vercel Inc., États-Unis) héberge le site et fournit la mesure d'audience Vercel Analytics, sans cookie.",
}
