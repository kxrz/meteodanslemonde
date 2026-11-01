import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { buildDailyEmailHtml } from "@/lib/email-builder"
import { buildCityEmailData } from "@/lib/briefing-data"

// Route de test uniquement
// Usage : GET /api/test-email?to=florent@leswww.com&secret=<CRON_SECRET>
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (secret && req.nextUrl.searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const to = req.nextUrl.searchParams.get("to")
    if (!to) return NextResponse.json({ error: "?to= requis" }, { status: 400 })

    await initDb()
    const sql = getSql()

    const rows = await sql`
      SELECT
        s.first_name,
        s.confirm_token,
        string_agg(sub.city_slug, ',' ORDER BY sub.created_at) AS city_slugs,
        string_agg(sub.city_name, ',' ORDER BY sub.created_at) AS city_names
      FROM subscribers s
      JOIN subscriptions sub ON sub.subscriber_id = s.id
      WHERE s.email = ${to.toLowerCase()}
      GROUP BY s.first_name, s.confirm_token
    ` as { first_name: string; confirm_token: string; city_slugs: string; city_names: string }[]

    if (!rows.length) {
      return NextResponse.json({ error: `Abonné non trouvé : ${to}` }, { status: 404 })
    }

    const { first_name, confirm_token, city_slugs, city_names } = rows[0]
    const citySlugs = city_slugs.split(",")
    const cityNames = city_names.split(",")

    const month = new Date().getMonth()
    const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })
    const cityData = await Promise.all(citySlugs.map((slug, i) => buildCityEmailData(slug, cityNames[i], month)))

    const html = buildDailyEmailHtml({ firstName: first_name, cities: cityData, dateLabel, month, unsubToken: confirm_token })

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[TEST] Briefing du ${dateLabel}`,
      html,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, to, cities: cityNames, resend_id: result.data?.id })
  } catch (err) {
    console.error("[test-email]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
