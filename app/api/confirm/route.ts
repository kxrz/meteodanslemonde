import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, welcomeEmailHtml } from "@/lib/resend"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers
    SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE confirm_token = ${token}
    RETURNING id, first_name, email, confirm_token,
              (confirmed_at IS NULL) AS was_pending
  ` as { id: string; first_name: string; email: string; confirm_token: string; was_pending: boolean }[]

  if (!rows.length) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const sub = rows[0]

  // Email de bienvenue uniquement au premier passage (was_pending = true)
  if (sub.was_pending) {
    const profilUrl = `${BASE_URL}/profil?token=${sub.confirm_token}`
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: "Bienvenue sur cestchaud.fr",
        html: welcomeEmailHtml({ firstName: sub.first_name, cityName: "", profilUrl }),
      })
    } catch {
      // Non-bloquant
    }
  }

  return NextResponse.redirect(`${BASE_URL}/profil?token=${sub.confirm_token}&action=confirmed`)
}
