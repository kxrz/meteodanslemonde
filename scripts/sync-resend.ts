/**
 * Sync tous les abonnés DB vers Resend.
 * Usage : npx tsx scripts/sync-resend.ts
 * Variables requises : DATABASE_URL, RESEND_API_KEY, RESEND_AUDIENCE_ID
 * Optionnel         : RESEND_GENERAL_AUDIENCE_ID
 */

import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"

const DATABASE_URL = process.env.DATABASE_URL
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ""
const RESEND_GENERAL_AUDIENCE_ID = process.env.RESEND_GENERAL_AUDIENCE_ID ?? RESEND_AUDIENCE_ID

if (!DATABASE_URL) throw new Error("DATABASE_URL manquant")
if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant")
if (!RESEND_AUDIENCE_ID) throw new Error("RESEND_AUDIENCE_ID manquant")

const sql = neon(DATABASE_URL)
const resend = new Resend(RESEND_API_KEY)

type Row = { id: string; email: string; first_name: string; resend_id: string | null; confirmed_at: Date | null }

async function upsertContact(audienceId: string, email: string, firstName: string, unsubscribed: boolean): Promise<string | null> {
  try {
    const result = await resend.contacts.create({ audienceId, email, firstName, unsubscribed })
    return result.data?.id ?? null
  } catch {
    // Contact déjà existant — chercher par email avec pagination
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
    } catch {
      // Non-bloquant
    }
    return null
  }
}

async function main() {
  const rows = await sql`
    SELECT id, email, first_name, resend_id, confirmed_at
    FROM subscribers
    ORDER BY created_at
  ` as Row[]

  console.log(`${rows.length} abonne(s) a synchroniser`)

  let synced = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    const unsubscribed = row.confirmed_at === null
    try {
      // Liste segmentée principale
      const resendId = await upsertContact(RESEND_AUDIENCE_ID, row.email, row.first_name, unsubscribed)

      // Liste générale (si différente)
      if (RESEND_GENERAL_AUDIENCE_ID && RESEND_GENERAL_AUDIENCE_ID !== RESEND_AUDIENCE_ID) {
        await upsertContact(RESEND_GENERAL_AUDIENCE_ID, row.email, row.first_name, unsubscribed)
      }

      // Mettre à jour resend_id en DB si absent
      if (resendId && !row.resend_id) {
        await sql`UPDATE subscribers SET resend_id = ${resendId} WHERE id = ${row.id}`
        console.log(`  [OK] ${row.email} — resend_id enregistre`)
      } else {
        console.log(`  [OK] ${row.email} — deja lie (${row.resend_id ?? resendId ?? "sans id"})`)
      }
      synced++
    } catch (err) {
      console.error(`  [ERR] ${row.email}:`, err)
      errors++
    }

    // Respecter le rate limit Resend (~10 req/s)
    await new Promise(r => setTimeout(r, 120))
  }

  console.log(`\nTermine : ${synced} syncs, ${skipped} ignores, ${errors} erreurs`)
}

main().catch(err => { console.error(err); process.exit(1) })
