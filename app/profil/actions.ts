"use server"

import { getSql } from "@/lib/db"
import { resend, BASE_URL, RESEND_AUDIENCE_ID } from "@/lib/resend"
import { redirect } from "next/navigation"

export async function updateFirstName(token: string, formData: FormData) {
  const firstName = (formData.get("firstName") as string | null)?.trim()
  if (!firstName) return
  const sql = getSql()
  await sql`UPDATE subscribers SET first_name = ${firstName} WHERE confirm_token = ${token}`
  redirect(`/profil?token=${token}&action=name-updated`)
}

export async function toggleBeta(token: string, current: boolean) {
  const sql = getSql()
  await sql`UPDATE subscribers SET beta_tester = ${!current} WHERE confirm_token = ${token}`
  redirect(`/profil?token=${token}&action=beta-updated`)
}

export async function regenerateToken(token: string) {
  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers SET confirm_token = gen_random_uuid()
    WHERE confirm_token = ${token}
    RETURNING confirm_token
  ` as { confirm_token: string }[]
  if (!rows.length) redirect(`/profil?token=${token}&action=error`)
  redirect(`/profil?token=${rows[0].confirm_token}&action=token-regenerated`)
}

export async function unsubscribeAll(token: string) {
  const sql = getSql()
  const rows = await sql`
    UPDATE subscribers SET confirmed_at = NULL
    WHERE confirm_token = ${token}
    RETURNING resend_id
  ` as { resend_id: string | null }[]
  if (rows[0]?.resend_id && RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.update({ audienceId: RESEND_AUDIENCE_ID, id: rows[0].resend_id, unsubscribed: true })
    } catch { /* non-bloquant */ }
  }
  redirect(`/profil?token=${token}&action=unsubscribed`)
}

export async function deleteAccount(token: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, resend_id FROM subscribers WHERE confirm_token = ${token}
  ` as { id: string; resend_id: string | null }[]
  if (!rows.length) redirect("/notifications")
  if (rows[0].resend_id && RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.remove({ audienceId: RESEND_AUDIENCE_ID, id: rows[0].resend_id })
    } catch { /* non-bloquant */ }
  }
  await sql`DELETE FROM subscribers WHERE id = ${rows[0].id}`
  redirect(`${BASE_URL}/notifications?action=deleted`)
}
