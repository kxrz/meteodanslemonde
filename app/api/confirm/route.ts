import { NextRequest, NextResponse } from "next/server"
import { BASE_URL } from "@/lib/resend"
import { isToken } from "@/lib/subscription"

// Ancien lien de confirmation (emails déjà envoyés). Un GET ne confirme plus rien :
// il mène à la page qui demande un clic, pour que les scanners d'emails ne confirment pas à la place de la personne.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!isToken(token)) return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  return NextResponse.redirect(`${BASE_URL}/profil/confirmer?token=${token}`)
}
