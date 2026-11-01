import { NextRequest, NextResponse } from "next/server"
import { BASE_URL } from "@/lib/resend"
import { isToken } from "@/lib/subscription"

// GET /api/unsubscribe-city?token=<jeton>&city=<slug>
// Ancien lien « Retirer cette ville » des emails. Un GET ne modifie plus rien (les scanners
// d'emails et le préchargement suivent les liens) : il mène à une page de confirmation
// dont le bouton envoie un POST (action serveur removeCity).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const city = req.nextUrl.searchParams.get("city")
  if (!isToken(token) || !city) return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  return NextResponse.redirect(`${BASE_URL}/profil/desabonnement?token=${token}&city=${encodeURIComponent(city)}`)
}
