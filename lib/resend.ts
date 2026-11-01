import { Resend } from "resend"
import { emailButton, emailFooterText, emailHeader, emailShell, escapeHtml, P } from "@/lib/email-layout"

// Resend v6 lève une erreur dès la construction si la clé est vide : sans clé (dev, aperçu),
// on passe une valeur factice pour que l'import ne casse pas la page ; seul l'envoi échouera.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_non_configure")

export const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ""
export const RESEND_GENERAL_AUDIENCE_ID = process.env.RESEND_GENERAL_AUDIENCE_ID ?? "c975fbb5-2253-447a-b371-e54aab62febd"
export const FROM_EMAIL = "cestchaud.fr <florent@updates.leswww.com>"
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.cestchaud.fr"

/** Toutes les listes Resend où un abonné peut figurer (sans doublon). */
export function resendAudiences(): string[] {
  return [...new Set([RESEND_AUDIENCE_ID, RESEND_GENERAL_AUDIENCE_ID].filter(Boolean))]
}

/**
 * Marque un contact comme désabonné (ou le supprime) dans toutes les listes Resend.
 * Non bloquant : une erreur Resend n'empêche pas le désabonnement côté base.
 */
export async function updateResendContact(email: string, mode: "unsubscribe" | "remove"): Promise<void> {
  for (const audienceId of resendAudiences()) {
    try {
      if (mode === "remove") await resend.contacts.remove({ audienceId, email })
      else await resend.contacts.update({ audienceId, email, unsubscribed: true })
    } catch {
      /* non bloquant */
    }
  }
}

export function welcomeEmailHtml({ firstName, cityName, profilUrl }: { firstName: string; cityName: string; profilUrl: string }) {
  const name = escapeHtml(firstName.trim())
  const city = escapeHtml(cityName)
  return emailShell({
    preheader: `Votre briefing pour ${city} est actif.`,
    header: emailHeader("cestchaud.fr", name ? `Bienvenue, ${name}` : "Bienvenue"),
    body: `
      ${P(`Votre briefing pour <strong>${city}</strong> est actif. Le premier arrive demain matin.`)}
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111111">Chaque matin, vous recevrez :</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3d3d3a;line-height:1.8">
        <li>le ressenti maximal du jour et son écart à la normale du mois (1991-2020) ;</li>
        <li>ce que le climat a déjà ajouté à cette normale en 30 ans ;</li>
        <li>la saison en cours projetée en 2050, avec la fourchette entre scénarios du GIEC ;</li>
        <li>selon la saison : nuit de gel ou chaleur qui dure ;</li>
        <li>l'idée reçue du jour, démontée en une phrase, et le jumeau climatique du jour.</li>
      </ul>
      ${emailButton(profilUrl, "Accéder à mon profil &rarr;")}
      <p style="margin:20px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5f5e58;line-height:1.6">
        Depuis votre profil : ajoutez ou retirez des villes, désabonnez-vous ou supprimez votre compte quand vous voulez.
      </p>`,
    footer: emailFooterText("cestchaud.fr &middot; Open-Meteo, Copernicus ERA5 &amp; GIEC CMIP6"),
  })
}

export function confirmationEmailHtml({ firstName, cityName, confirmUrl }: { firstName: string; cityName: string; confirmUrl: string }) {
  const name = escapeHtml(firstName.trim())
  const city = escapeHtml(cityName)
  return emailShell({
    preheader: `Un clic pour recevoir le briefing de ${city}.`,
    header: emailHeader("cestchaud.fr", "Confirmez votre inscription"),
    body: `
      ${P(name ? `Bonjour ${name},` : "Bonjour,")}
      ${P(`Vous avez demandé à recevoir le briefing matinal pour <strong>${city}</strong>. Ouvrez le lien ci-dessous, puis cliquez sur « Confirmer » pour l'activer.`)}
      ${emailButton(confirmUrl, "Confirmer mon inscription &rarr;", "#e3261b")}
      <p style="margin:20px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5f5e58;line-height:1.6">
        Vous n'avez rien demandé ? Ignorez cet email : sans confirmation, vous ne recevrez aucun briefing.
      </p>`,
    footer: emailFooterText("cestchaud.fr &middot; Open-Meteo, Copernicus ERA5 &amp; GIEC CMIP6"),
  })
}
