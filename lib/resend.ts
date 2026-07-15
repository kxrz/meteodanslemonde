import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ""
export const FROM_EMAIL = "cestchaud.fr <matin@cestchaud.fr>"
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.cestchaud.fr"

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
