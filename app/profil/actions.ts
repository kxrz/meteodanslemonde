"use server"

import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL, updateResendContact, welcomeEmailHtml } from "@/lib/resend"
import { isToken, normalizeFirstName } from "@/lib/subscription"
import { redirect } from "next/navigation"

// Toutes les actions qui modifient un abonnement passent par ici, en POST (actions serveur).
// Les liens des emails mènent à des pages de confirmation : un scanner ou un préchargement
// qui suit un lien ne peut rien déclencher.

function guard(token: string) {
  if (!isToken(token)) redirect("/notifications?action=invalid-token")
}

export async function updateFirstName(token: string, formData: FormData) {
  guard(token)
  const firstName = normalizeFirstName(formData.get("firstName") as string | null)
  if (!firstName) redirect(`/profil?token=${token}&action=name-empty`)
  const sql = getSql()
  await sql`UPDATE subscribers SET first_name = ${firstName} WHERE confirm_token = ${token}`
  redirect(`/profil?token=${token}&action=name-updated#prenom`)
}

export async function toggleBeta(token: string, current: boolean) {
  guard(token)
  const sql = getSql()
  await sql`UPDATE subscribers SET beta_tester = ${!current} WHERE confirm_token = ${token}`
  redirect(`/profil?token=${token}&action=beta-updated#beta`)
}

export async function regenerateToken(token: string) {
  guard(token)
  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers SET confirm_token = gen_random_uuid()
    WHERE confirm_token = ${token}
    RETURNING confirm_token
  ` as { confirm_token: string }[]
  if (!rows.length) redirect(`/profil?token=${token}&action=error`)
  redirect(`/profil?token=${rows[0].confirm_token}&action=token-regenerated`)
}

export async function removeCity(token: string, citySlug: string) {
  guard(token)
  const sql = getSql()
  const rows = await sql`
    DELETE FROM subscriptions
    WHERE city_slug = ${citySlug}
      AND subscriber_id = (SELECT id FROM subscribers WHERE confirm_token = ${token})
    RETURNING city_name
  ` as { city_name: string }[]
  if (!rows.length) redirect(`/profil?token=${token}&action=city-not-found`)
  redirect(`/profil?token=${token}&action=city-removed&city=${encodeURIComponent(rows[0].city_name)}`)
}

export async function unsubscribeAll(token: string) {
  guard(token)
  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers SET confirmed_at = NULL
    WHERE confirm_token = ${token}
    RETURNING email
  ` as { email: string }[]
  if (!rows.length) redirect("/notifications?action=invalid-token")
  await updateResendContact(rows[0].email, "unsubscribe")
  redirect(`/profil?token=${token}&action=unsubscribed`)
}

export async function confirmSubscription(token: string) {
  guard(token)
  const sql = getSql()
  const before = await sql`
    SELECT id, first_name, email, confirmed_at FROM subscribers WHERE confirm_token = ${token}
  ` as { id: string; first_name: string; email: string; confirmed_at: Date | null }[]
  if (!before.length) redirect("/notifications?action=invalid-token")
  const sub = before[0]

  await sql`UPDATE subscribers SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id = ${sub.id}`

  // Email de bienvenue uniquement à la première confirmation
  if (!sub.confirmed_at) {
    const cityRows = await sql`
      SELECT city_name FROM subscriptions WHERE subscriber_id = ${sub.id} ORDER BY created_at LIMIT 1
    ` as { city_name: string }[]
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: "Bienvenue sur cestchaud.fr",
        html: welcomeEmailHtml({ firstName: sub.first_name, cityName: cityRows[0]?.city_name ?? "", profilUrl: `${BASE_URL}/profil?token=${token}` }),
      })
    } catch {
      // Non bloquant
    }
  }
  redirect(`/profil?token=${token}&action=confirmed`)
}

export async function deleteAccount(token: string) {
  guard(token)
  const sql = getSql()
  const rows = await sql`
    DELETE FROM subscribers WHERE confirm_token = ${token} RETURNING email
  ` as { email: string }[]
  if (!rows.length) redirect("/notifications?action=invalid-token")
  await updateResendContact(rows[0].email, "remove")
  redirect(`${BASE_URL}/notifications?action=deleted`)
}
