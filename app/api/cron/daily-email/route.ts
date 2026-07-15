import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { fetchCityWeather } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { buildDailyEmailHtml, CityEmailData } from "@/lib/email-builder"

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
      string_agg(sub.city_slug, ',' ORDER BY sub.created_at) AS city_slugs,
      string_agg(sub.city_name, ',' ORDER BY sub.created_at) AS city_names
    FROM subscribers s
    JOIN subscriptions sub ON sub.subscriber_id = s.id
    WHERE s.confirmed_at IS NOT NULL
    GROUP BY s.email, s.first_name
  ` as { email: string; first_name: string; city_slugs: string; city_names: string }[]

  if (!rows.length) return NextResponse.json({ sent: 0 })

  const climateMap = loadClimateMap()
  const month = new Date().getMonth()
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>

  const emails: Parameters<typeof resend.batch.send>[0] = []

  for (const row of rows) {
    const citySlugs = row.city_slugs.split(",")
    const cityNames = row.city_names.split(",")

    const cityData: CityEmailData[] = []

    for (let i = 0; i < citySlugs.length; i++) {
      const slug = citySlugs[i]
      const name = cityNames[i]
      const city = citiesFR.find(c => c.id === slug || c.name.toLowerCase().replace(/[\s']/g, "-") === slug)

      let apparentTempMax: number | null = null
      if (city) {
        try {
          const w = await fetchCityWeather(city.lat, city.lon)
          apparentTempMax = w?.apparent_temp_max ?? null
        } catch {}
      }

      const climate = climateMap[slug] ?? null
      const normal = climate?.normal?.[month] ?? null
      const proj2050 = climate?.proj2050?.[month] ?? null
      const anomaly = apparentTempMax !== null && normal !== null
        ? Math.round((apparentTempMax - normal) * 10) / 10
        : null

      cityData.push({ slug, name, apparentTempMax, anomaly, proj2050, normal })
    }

    const html = buildDailyEmailHtml({ firstName: row.first_name, cities: cityData, dateLabel, month })

    emails.push({
      from: FROM_EMAIL,
      to: row.email,
      subject: `Briefing du ${dateLabel}`,
      html,
    })
  }

  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    await resend.batch.send(emails.slice(i, i + 100))
    sent += Math.min(100, emails.length - i)
  }

  return NextResponse.json({ sent })
}
