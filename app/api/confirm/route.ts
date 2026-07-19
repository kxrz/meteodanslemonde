import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, welcomeEmailHtml } from "@/lib/resend"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const sql = getSql()

  // Lire l'état AVANT la mise à jour pour savoir si c'est une première confirmation
  const beforeRows = await sql`
    SELECT id, first_name, email, confirm_token, confirmed_at
    FROM subscribers WHERE confirm_token = ${token}
  ` as { id: string; first_name: string; email: string; confirm_token: string; confirmed_at: Date | null }[]

  if (!beforeRows.length) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const sub = beforeRows[0]
  const wasPending = !sub.confirmed_at

  await sql`
    UPDATE subscribers SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id = ${sub.id}
  `

  // Email de bienvenue uniquement au premier passage
  if (wasPending) {
    const cityRows = await sql`
      SELECT city_name FROM subscriptions WHERE subscriber_id = ${sub.id} ORDER BY created_at LIMIT 1
    ` as { city_name: string }[]
    const cityName = cityRows[0]?.city_name ?? ""
    const profilUrl = `${BASE_URL}/profil?token=${sub.confirm_token}`
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: "Bienvenue sur cestchaud.fr",
        html: welcomeEmailHtml({ firstName: sub.first_name, cityName, profilUrl }),
      })
    } catch {
      // Non-bloquant
    }
  }

  return NextResponse.redirect(`${BASE_URL}/profil?token=${sub.confirm_token}&action=confirmed`)
}
