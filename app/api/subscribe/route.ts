import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, RESEND_AUDIENCE_ID, confirmationEmailHtml } from "@/lib/resend"

let dbReady = false

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const { firstName, email, citySlug, cityName } = body as Record<string, string>

  if (!firstName?.trim() || !email?.trim() || !citySlug?.trim() || !cityName?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 })
  }

  // Créer les tables au premier appel (idempotent, CREATE TABLE IF NOT EXISTS)
  if (!dbReady) {
    await initDb()
    dbReady = true
  }

  const sql = getSql()
  const emailLower = email.trim().toLowerCase()

  const rows = await sql`
    INSERT INTO subscribers (email, first_name)
    VALUES (${emailLower}, ${firstName.trim()})
    ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
    RETURNING id, confirm_token, confirmed_at
  ` as { id: string; confirm_token: string; confirmed_at: Date | null }[]
  const subscriber = rows[0]

  await sql`
    INSERT INTO subscriptions (subscriber_id, city_slug, city_name)
    VALUES (${subscriber.id}, ${citySlug}, ${cityName})
    ON CONFLICT (subscriber_id, city_slug) DO NOTHING
  `

  if (RESEND_AUDIENCE_ID && !subscriber.confirmed_at) {
    try {
      const contact = await resend.contacts.create({
        audienceId: RESEND_AUDIENCE_ID,
        email: emailLower,
        firstName: firstName.trim(),
        unsubscribed: false,
      })
      if (contact.data?.id) {
        await sql`UPDATE subscribers SET resend_id = ${contact.data.id} WHERE id = ${subscriber.id}`
      }
    } catch {
      // Non-bloquant
    }
  }

  if (!subscriber.confirmed_at) {
    const confirmUrl = `${BASE_URL}/api/confirm?token=${subscriber.confirm_token}`
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: emailLower,
        subject: `Confirmez votre briefing matinal · ${cityName}`,
        html: confirmationEmailHtml({ firstName: firstName.trim(), cityName, confirmUrl }),
      })
      if (result.error) {
        console.error("[subscribe] Resend error:", result.error)
        return NextResponse.json(
          { error: "Inscription enregistrée mais l'envoi de l'email a échoué. Vérifiez la configuration Resend." },
          { status: 500 }
        )
      }
    } catch (err) {
      console.error("[subscribe] Resend exception:", err)
      return NextResponse.json(
        { error: "Inscription enregistrée mais l'envoi de l'email a échoué." },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
