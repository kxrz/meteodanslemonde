import { NextRequest, NextResponse } from "next/server"
import { getSql, initDb } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL } from "@/lib/resend"
import { fetchCityWeather } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"

// Route de test uniquement — à supprimer en production
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

  // Chercher l'abonné et ses villes
  const rows = await sql`
    SELECT
      s.first_name,
      string_agg(sub.city_slug, ',' ORDER BY sub.created_at) AS city_slugs,
      string_agg(sub.city_name, ',' ORDER BY sub.created_at) AS city_names
    FROM subscribers s
    JOIN subscriptions sub ON sub.subscriber_id = s.id
    WHERE s.email = ${to.toLowerCase()}
    GROUP BY s.first_name
  ` as { first_name: string; city_slugs: string; city_names: string }[]

  if (!rows.length) {
    return NextResponse.json({ error: `Abonné non trouvé : ${to}` }, { status: 404 })
  }

  const { first_name, city_slugs, city_names } = rows[0]
  const citySlugs = city_slugs.split(",")
  const cityNames = city_names.split(",")

  const climateMap = loadClimateMap()
  const month = new Date().getMonth()
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>

  const cityBlocks: string[] = []
  for (let i = 0; i < citySlugs.length; i++) {
    const slug = citySlugs[i]
    const name = cityNames[i]
    const city = citiesFR.find(c => c.id === slug || c.name.toLowerCase().replace(/[\s']/g, "-") === slug)

    let weather = null
    if (city) {
      try { weather = await fetchCityWeather(city.lat, city.lon) } catch {}
    }

    const climate = climateMap[slug] ?? null
    const normal = climate?.normal?.[month] ?? null
    const proj2050 = climate?.proj2050?.[month] ?? null
    const anomaly = weather && normal !== null
      ? Math.round((weather.apparent_temp_max - normal) * 10) / 10
      : null

    cityBlocks.push(`
      <tr>
        <td style="padding:20px 0;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af">${name}</p>
          ${weather
            ? `<p style="margin:8px 0 0;font-size:36px;font-weight:900;color:#111111;line-height:1">${fmt(weather.apparent_temp_max)}°<span style="font-size:16px;color:#9ca3af;font-weight:400"> ressenti max</span></p>
               ${anomaly !== null ? `<p style="margin:4px 0 0;font-size:13px;color:${anomaly > 0 ? "#f97316" : "#3b82f6"}">${anomaly > 0 ? "+" : ""}${anomaly}°C vs normale</p>` : ""}
               ${proj2050 !== null ? `<p style="margin:4px 0 0;font-size:12px;color:#9ca3af">GIEC 2050 : ${fmtDelta(proj2050)}°C (SSP2-4.5)</p>` : ""}`
            : `<p style="margin:8px 0 0;font-size:14px;color:#9ca3af">Données indisponibles</p>`
          }
          <p style="margin:12px 0 0"><a href="${BASE_URL}/a/${slug}" style="font-size:12px;color:#f97316;font-weight:600;text-decoration:none">Voir la carte complète &rarr;</a></p>
        </td>
      </tr>
    `)
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',system-ui,sans-serif;color:#111111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden">
        <tr>
          <td style="background:#111111;padding:24px 36px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#f97316">cestchaud.fr · briefing matinal</p>
            <p style="margin:6px 0 0;font-size:14px;color:#ffffff;text-transform:capitalize">${dateLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 8px">
            <p style="margin:24px 0 0;font-size:15px;color:#374151">Bonjour ${first_name},</p>
            <table width="100%" cellpadding="0" cellspacing="0">${cityBlocks.join("")}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
              cestchaud.fr &middot; <a href="${BASE_URL}/api/confirm?token=unsub" style="color:#d1d5db">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[TEST] Briefing matinal · ${dateLabel}`,
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
