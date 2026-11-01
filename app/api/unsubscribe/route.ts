import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { BASE_URL, updateResendContact } from "@/lib/resend"
import { isToken } from "@/lib/subscription"

// GET : lien de désabonnement cliqué par une personne → page de confirmation (bouton = POST).
// Un GET ne désabonne jamais : les scanners d'emails et le préchargement suivent les liens.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!isToken(token)) return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  return NextResponse.redirect(`${BASE_URL}/profil/desabonnement?token=${token}`)
}

// POST : désabonnement en un clic des messageries (RFC 8058).
// L'email porte « List-Unsubscribe: <…/api/unsubscribe?token=…> » et
// « List-Unsubscribe-Post: List-Unsubscribe=One-Click » ; Gmail, Yahoo, etc. envoient alors
// ce POST (corps « List-Unsubscribe=One-Click ») sans ouvrir de page.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!isToken(token)) return NextResponse.json({ error: "Lien invalide" }, { status: 400 })

  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers SET confirmed_at = NULL
    WHERE confirm_token = ${token}
    RETURNING email
  ` as { email: string }[]

  // Réponse identique que le jeton existe ou non : on ne révèle rien.
  if (rows.length) await updateResendContact(rows[0].email, "unsubscribe")
  return NextResponse.json({ ok: true })
}
