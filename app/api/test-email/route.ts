import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL } from "@/lib/resend"
import { fetchCityWeather, fetchCaniculeStreak, fetchClimateTwin } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { buildDailyEmailHtml, CityEmailData } from "@/lib/email-builder"

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

    const climateMap = loadClimateMap()
    const month = new Date().getMonth()
    const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>

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

      const [caniculeStreak, climateTwin] = city && apparentTempMax !== null
        ? await Promise.all([fetchCaniculeStreak(city.lat, city.lon), fetchClimateTwin(apparentTempMax)])
        : [0, null]

      cityData.push({ slug, name, apparentTempMax, anomaly, proj2050, normal, caniculeStreak, climateTwin })
    }

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
