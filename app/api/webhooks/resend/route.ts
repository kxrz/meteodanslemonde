import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Resend envoie un webhook quand un contact se désabonne depuis le lien Resend
// On marque le subscriber en base pour ne plus lui envoyer d'emails
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const event = body as { type?: string; data?: { contact?: { email?: string } } }

  if (event.type === "contact.unsubscribed" && event.data?.contact?.email) {
    const email = event.data.contact.email.toLowerCase()
    await sql`
      UPDATE subscribers
      SET confirmed_at = NULL
      WHERE email = ${email}
    `
  }

  return NextResponse.json({ ok: true })
}
