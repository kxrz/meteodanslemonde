import { Resend } from "resend"

// Lazy — Resend("") ne lève pas d'erreur à l'init, seulement à l'envoi
export const resend = new Resend(process.env.RESEND_API_KEY ?? "")

export const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ""
export const RESEND_GENERAL_AUDIENCE_ID = process.env.RESEND_GENERAL_AUDIENCE_ID ?? "c975fbb5-2253-447a-b371-e54aab62febd"
export const FROM_EMAIL = "cestchaud.fr <florent@updates.leswww.com>"
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.cestchaud.fr"

export function welcomeEmailHtml({
  firstName,
  cityName,
  profilUrl,
}: {
  firstName: string
  cityName: string
  profilUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',system-ui,sans-serif;color:#111111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden">
        <tr>
          <td style="background:#f97316;padding:28px 36px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffffff">cestchaud.fr</p>
            <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.2">Bienvenue, ${firstName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
              Votre abonnement pour <strong>${cityName}</strong> est actif. Votre premier briefing arrivera demain matin.
            </p>
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111111">Chaque matin vous recevrez :</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:13px;color:#374151;line-height:2">
              <li>Le ressenti max du jour (indice UTCI)</li>
              <li>L'anomalie vs la normale ERA5 1981-2010</li>
              <li>Une alerte si seuil canicule atteint</li>
              <li>Le jumeau climatique du jour dans le monde</li>
              <li>Les projections GIEC 2050 pour votre ville</li>
            </ul>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr>
                <td style="background:#111111;border-radius:12px;padding:14px 28px">
                  <a href="${profilUrl}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Acceder a mon profil &rarr;</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
              Votre profil vous permet de gerer vos villes, modifier vos preferences et vous desabonner a tout moment.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
              cestchaud.fr &middot; donnees ERA5 &amp; GIEC CMIP6
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function confirmationEmailHtml({
  firstName,
  cityName,
  confirmUrl,
}: {
  firstName: string
  cityName: string
  confirmUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',system-ui,sans-serif;color:#111111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden">
        <tr>
          <td style="background:#111111;padding:28px 36px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#f97316">cestchaud.fr</p>
            <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.2">Confirmez votre inscription</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
              Bonjour ${firstName},
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
              Vous avez demandé à recevoir le briefing matinal pour <strong>${cityName}</strong>. Cliquez sur le bouton ci-dessous pour confirmer votre inscription.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr>
                <td style="background:#f97316;border-radius:12px;padding:14px 28px">
                  <a href="${confirmUrl}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Confirmer mon inscription &rarr;</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
              Si vous n'avez pas fait cette demande, ignorez cet email. Le lien expire dans 24h.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
              cestchaud.fr &middot; données ERA5 &amp; GIEC CMIP6
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
