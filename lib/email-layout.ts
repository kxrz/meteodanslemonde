// Gabarit commun des emails : tables uniquement (Outlook), styles en ligne,
// couleurs de la marque, pied de page lisible (contraste ≥ 4,5:1 sur le papier).

export const EMAIL_COLORS = {
  ink: "#111111",
  inkSoft: "#3d3d3a",
  mute: "#5f5e58",
  paper: "#f5f4f0",
  paperDeep: "#ebe9e2",
  line: "#dcdad2",
  chaud: "#e3261b",
  froid: "#1d4ed8",
  signal: "#ffe14d",
}

const FONT = "Arial,Helvetica,sans-serif"

/** Échappe une valeur saisie par l'utilisateur (prénom…) avant de l'insérer dans le HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/** Bouton « bulletproof » en table. */
export function emailButton(href: string, label: string, bg = EMAIL_COLORS.ink, color = "#ffffff"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0">
  <tr><td bgcolor="${bg}" style="background:${bg};border-radius:999px;padding:13px 26px">
    <a href="${href}" style="color:${color};font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;display:inline-block">${label}</a>
  </td></tr>
</table>`
}

export function emailShell({ preheader, header, body, footer }: { preheader?: string; header: string; body: string; footer: string }): string {
  const c = EMAIL_COLORS
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>cestchaud.fr</title></head>
<body style="margin:0;padding:0;background:${c.paper};font-family:${FONT};color:${c.ink}">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.paper}">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:2px solid ${c.ink};border-radius:20px">
        <tr><td style="background:${c.ink};border-radius:18px 18px 0 0;padding:24px 32px">${header}</td></tr>
        <tr><td style="padding:28px 32px 8px">${body}</td></tr>
        <tr><td style="padding:20px 32px 26px;border-top:1px solid ${c.line}">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function emailHeader(eyebrow: string, title: string): string {
  return `<p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLORS.signal}">${eyebrow}</p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:24px;font-weight:800;line-height:1.2;color:#ffffff">${title}</p>`
}

export function emailFooterText(html: string): string {
  return `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${EMAIL_COLORS.mute};text-align:center">${html}</p>`
}

export const P = (html: string, extra = "") =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${EMAIL_COLORS.inkSoft};${extra}">${html}</p>`
