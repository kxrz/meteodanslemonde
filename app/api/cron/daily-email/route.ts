import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL } from "@/lib/resend"
import { buildDailyEmailHtml } from "@/lib/email-builder"
import { buildCityEmailData } from "@/lib/briefing-data"

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = getSql()
  const rows = await sql`
    SELECT
      s.email,
      s.first_name,
      s.confirm_token,
      string_agg(sub.city_slug, ',' ORDER BY sub.created_at) AS city_slugs,
      string_agg(sub.city_name, ',' ORDER BY sub.created_at) AS city_names
    FROM subscribers s
    JOIN subscriptions sub ON sub.subscriber_id = s.id
    WHERE s.confirmed_at IS NOT NULL
    GROUP BY s.email, s.first_name, s.confirm_token
  ` as { email: string; first_name: string; confirm_token: string; city_slugs: string; city_names: string }[]

  if (!rows.length) return NextResponse.json({ sent: 0 })

  const now = new Date()
  const month = now.getMonth()
  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })

  // Une ville suivie par plusieurs abonnés n'est calculée qu'une fois.
  const cache = new Map<string, ReturnType<typeof buildCityEmailData>>()
  const cityData = (slug: string, name: string) => {
    if (!cache.has(slug)) cache.set(slug, buildCityEmailData(slug, name, month))
    return cache.get(slug)!
  }

  const emails: Parameters<typeof resend.batch.send>[0] = []

  for (const row of rows) {
    const citySlugs = row.city_slugs.split(",")
    const cityNames = row.city_names.split(",")
    const cities = await Promise.all(citySlugs.map((slug, i) => cityData(slug, cityNames[i])))

    const html = buildDailyEmailHtml({ firstName: row.first_name, cities, dateLabel, month, unsubToken: row.confirm_token, date: now })

    emails.push({
      from: FROM_EMAIL,
      to: row.email,
      subject: `Briefing du ${dateLabel}`,
      html,
      // Désabonnement en un clic des messageries (RFC 8058) : POST sur /api/unsubscribe
      headers: {
        "List-Unsubscribe": `<${BASE_URL}/api/unsubscribe?token=${row.confirm_token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    })
  }

  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    await resend.batch.send(emails.slice(i, i + 100))
    sent += Math.min(100, emails.length - i)
  }

  return NextResponse.json({ sent })
}
