import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, BASE_URL, RESEND_AUDIENCE_ID } from "@/lib/resend"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers
    SET confirmed_at = NULL
    WHERE confirm_token = ${token}
    RETURNING id, email, resend_id
  ` as { id: string; email: string; resend_id: string | null }[]

  if (!rows.length) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  if (RESEND_AUDIENCE_ID && rows[0].resend_id) {
    try {
      await resend.contacts.update({
        audienceId: RESEND_AUDIENCE_ID,
        id: rows[0].resend_id,
        unsubscribed: true,
      })
    } catch {
      // Non-bloquant
    }
  }

  return NextResponse.redirect(`${BASE_URL}/profil?token=${token}&action=unsubscribed`)
}
