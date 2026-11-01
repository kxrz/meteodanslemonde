import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, RESEND_AUDIENCE_ID, RESEND_GENERAL_AUDIENCE_ID, confirmationEmailHtml } from "@/lib/resend"
import { isValidEmail, normalizeFirstName, resolveBriefingCity } from "@/lib/subscription"
import citiesFR from "@/data/cities-fr.json"

let dbReady = false

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide", code: "invalid-body" }, { status: 400 })
  }

  const raw = (body ?? {}) as Record<string, unknown>
  const firstName = normalizeFirstName(typeof raw.firstName === "string" ? raw.firstName : "")
  const email = typeof raw.email === "string" ? raw.email.trim() : ""
  const citySlug = typeof raw.citySlug === "string" ? raw.citySlug.trim() : ""

  // Le prénom est facultatif : le formulaire ne montre au départ que l'email et la ville.
  if (!email || !citySlug) {
    return NextResponse.json({ error: "Champs manquants", code: "missing-fields" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide", code: "invalid-email" }, { status: 400 })
  }
  // Le briefing ne couvre que les villes suivies : une ville hors liste est refusée
  // au lieu de recevoir chaque matin un email « données indisponibles ».
  const city = resolveBriefingCity(citySlug, citiesFR)
  if (!city) {
    return NextResponse.json({ error: "Ville inconnue", code: "unknown-city" }, { status: 400 })
  }
  const cityName = city.name

  // Créer les tables au premier appel (idempotent, CREATE TABLE IF NOT EXISTS)
  if (!dbReady) {
    await initDb()
    dbReady = true
  }

  const sql = getSql()
  const emailLower = email.toLowerCase()

  const rows = await sql`
    INSERT INTO subscribers (email, first_name)
    VALUES (${emailLower}, ${firstName})
    ON CONFLICT (email) DO UPDATE SET first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), subscribers.first_name)
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
        firstName: firstName || undefined,
        unsubscribed: false,
      })
      return result.data?.id ?? null
    } catch {
      // Contact probablement déjà existant — paginer pour le retrouver par email
      try {
        let cursor: string | undefined
        outer: do {
          const list = await resend.contacts.list({ audienceId, limit: 100, ...(cursor ? { after: cursor } : {}) } as Parameters<typeof resend.contacts.list>[0])
          const existing = list.data?.data?.find((c: { email: string }) => c.email === emailLower)
          if (existing?.id) {
            await resend.contacts.update({ audienceId, id: existing.id, ...(firstName ? { firstName } : {}), unsubscribed: false })
            return existing.id
          }
          cursor = list.data?.has_more ? list.data?.data?.at(-1)?.id : undefined
          if (!list.data?.has_more) break outer
        } while (cursor)
      } catch {
        // Non-bloquant
      }
      return null
    }
  }

  let resendId: string | null = null
  if (RESEND_AUDIENCE_ID) {
    resendId = await upsertResendContact(RESEND_AUDIENCE_ID)
  }
  if (RESEND_GENERAL_AUDIENCE_ID && RESEND_GENERAL_AUDIENCE_ID !== RESEND_AUDIENCE_ID) {
    const gId = await upsertResendContact(RESEND_GENERAL_AUDIENCE_ID)
    if (!resendId) resendId = gId
  }
  if (resendId && !subscriber.resend_id) {
    await sql`UPDATE subscribers SET resend_id = ${resendId} WHERE id = ${subscriber.id}`
  }

  if (!subscriber.confirmed_at) {
    // Le lien mène à une page qui demande un clic (POST) : un scanner d'emails qui suit
    // les liens ne peut pas confirmer l'inscription à la place de la personne.
    const confirmUrl = `${BASE_URL}/profil/confirmer?token=${subscriber.confirm_token}`
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: emailLower,
        subject: `Confirmez votre briefing matinal · ${cityName}`,
        html: confirmationEmailHtml({ firstName, cityName, confirmUrl }),
      })
      if (result.error) {
        console.error("[subscribe] Resend error:", result.error)
        return NextResponse.json({ error: "Inscription enregistrée mais l'envoi de l'email a échoué.", code: "email-failed" }, { status: 502 })
      }
    } catch (err) {
      console.error("[subscribe] Resend exception:", err)
      return NextResponse.json({ error: "Inscription enregistrée mais l'envoi de l'email a échoué.", code: "email-failed" }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true, cityName })
}
