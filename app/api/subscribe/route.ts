import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, RESEND_AUDIENCE_ID, RESEND_GENERAL_AUDIENCE_ID, confirmationEmailHtml } from "@/lib/resend"

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
    RETURNING id, confirm_token, confirmed_at, resend_id
  ` as { id: string; confirm_token: string; confirmed_at: Date | null; resend_id: string | null }[]
  const subscriber = rows[0]

  await sql`
    INSERT INTO subscriptions (subscriber_id, city_slug, city_name)
    VALUES (${subscriber.id}, ${citySlug}, ${cityName})
    ON CONFLICT (subscriber_id, city_slug) DO NOTHING
  `

  // Upsert dans Resend — liste segmentée + liste générale
  // Si le contact existe déjà, on tente un update pour réactiver et syncer le prénom
  async function upsertResendContact(audienceId: string): Promise<string | null> {
    try {
      const result = await resend.contacts.create({
        audienceId,
        email: emailLower,
        firstName: firstName.trim(),
        unsubscribed: false,
      })
      return result.data?.id ?? null
    } catch {
      // Contact probablement déjà existant — tenter un update via l'email
      try {
        const list = await resend.contacts.list({ audienceId })
        const existing = list.data?.data?.find((c: { email: string }) => c.email === emailLower)
        if (existing?.id) {
          await resend.contacts.update({
            audienceId,
            id: existing.id,
            firstName: firstName.trim(),
            unsubscribed: false,
          })
          return existing.id
        }
      } catch {
        // Non-bloquant
      }
      return null
    }
  }

  if (RESEND_AUDIENCE_ID) {
    const resendId = await upsertResendContact(RESEND_AUDIENCE_ID)
    if (resendId && !subscriber.resend_id) {
      await sql`UPDATE subscribers SET resend_id = ${resendId} WHERE id = ${subscriber.id}`
    }
  }
  if (RESEND_GENERAL_AUDIENCE_ID && RESEND_GENERAL_AUDIENCE_ID !== RESEND_AUDIENCE_ID) {
    await upsertResendContact(RESEND_GENERAL_AUDIENCE_ID)
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
