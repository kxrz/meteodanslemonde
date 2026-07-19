import { NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, RESEND_AUDIENCE_ID, RESEND_GENERAL_AUDIENCE_ID } from "@/lib/resend"

type Row = { id: string; email: string; first_name: string; resend_id: string | null; confirmed_at: Date | null }

async function upsertContact(audienceId: string, email: string, firstName: string, unsubscribed: boolean): Promise<string | null> {
  try {
    const result = await resend.contacts.create({ audienceId, email, firstName, unsubscribed })
    return result.data?.id ?? null
  } catch {
    try {
      let cursor: string | undefined
      do {
        const list = await resend.contacts.list({
          audienceId,
          limit: 100,
          ...(cursor ? { after: cursor } : {}),
        } as Parameters<typeof resend.contacts.list>[0])
        const found = list.data?.data?.find((c: { email: string }) => c.email === email)
        if (found?.id) {
          await resend.contacts.update({ audienceId, id: found.id, firstName, unsubscribed })
          return found.id
        }
        cursor = list.data?.has_more ? list.data?.data?.at(-1)?.id : undefined
      } while (cursor)
    } catch { /* non-bloquant */ }
    return null
  }
}

export async function POST() {
  if (!RESEND_AUDIENCE_ID && !RESEND_GENERAL_AUDIENCE_ID) {
    return NextResponse.json({ error: "RESEND_AUDIENCE_ID non configuré" }, { status: 500 })
  }

  await initDb()
  const sql = getSql()
  const rows = await sql`
    SELECT id, email, first_name, resend_id, confirmed_at FROM subscribers ORDER BY created_at
  ` as Row[]

  const results: { email: string; status: "synced" | "error"; resend_id: string | null; note?: string }[] = []

  for (const row of rows) {
    const unsubscribed = row.confirmed_at === null
    try {
      let resendId: string | null = null

      if (RESEND_AUDIENCE_ID) {
        resendId = await upsertContact(RESEND_AUDIENCE_ID, row.email, row.first_name, unsubscribed)
      }
      if (RESEND_GENERAL_AUDIENCE_ID && RESEND_GENERAL_AUDIENCE_ID !== RESEND_AUDIENCE_ID) {
        const gId = await upsertContact(RESEND_GENERAL_AUDIENCE_ID, row.email, row.first_name, unsubscribed)
        if (!resendId) resendId = gId
      }

      if (resendId && !row.resend_id) {
        await sql`UPDATE subscribers SET resend_id = ${resendId} WHERE id = ${row.id}`
      }

      results.push({ email: row.email, status: "synced", resend_id: resendId ?? row.resend_id, note: unsubscribed ? "non confirme" : "actif" })
    } catch (err) {
      results.push({ email: row.email, status: "error", resend_id: null, note: String(err) })
    }

    // Rate limit Resend ~10 req/s
    await new Promise(r => setTimeout(r, 120))
  }

  const synced = results.filter(r => r.status === "synced").length
  const errors = results.filter(r => r.status === "error").length
  return NextResponse.json({ total: rows.length, synced, errors, results })
}
