import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { resend, FROM_EMAIL, BASE_URL } from "@/lib/resend"
import { fetchCityWeather } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import { fmt, fmtDelta } from "@/lib/format"

// Protégé par CRON_SECRET — Vercel injecte automatiquement le header Authorization
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Récupérer tous les abonnés confirmés avec leurs villes
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

  if (!rows.length) {
    return NextResponse.json({ sent: 0 })
  }

  const climateMap = loadClimateMap()
  const month = new Date().getMonth()
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  // Construire les emails
  const emails: Parameters<typeof resend.batch.send>[0] = []

  for (const row of rows) {
    const citySlugs = row.city_slugs.split(",")
    const cityNames = row.city_names.split(",")

    const cityBlocks: string[] = []

    for (let i = 0; i < citySlugs.length; i++) {
      const slug = citySlugs[i]
      const name = cityNames[i]

      let weather: Awaited<ReturnType<typeof fetchCityWeather>> | null = null
      try {
        // Trouver lat/lon depuis le slug
        const cities = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number; region: string }>
        const city = cities.find(c => c.id === slug || c.name.toLowerCase().replace(/\s+/g, "-") === slug)
        if (city) {
          weather = await fetchCityWeather(city.lat, city.lon)
        }
      } catch {
        // On inclut quand même le bloc ville sans météo
      }

      const climate = climateMap[slug] ?? null
      const normal = climate?.normal?.[month] ?? null
      const proj2050 = climate?.proj2050?.[month] ?? null
      const anomaly = weather && normal !== null
        ? Math.round((weather.apparent_temp_max - normal) * 10) / 10
        : null

      const anomalyLine = anomaly !== null
        ? `<p style="margin:4px 0 0;font-size:13px;color:${anomaly > 0 ? "#f97316" : "#3b82f6"}">${anomaly > 0 ? "+" : ""}${anomaly}°C vs normale de saison</p>`
        : ""

      const proj2050Line = proj2050 !== null
        ? `<p style="margin:4px 0 0;font-size:12px;color:#9ca3af">GIEC 2050 : ${fmtDelta(proj2050)}°C en été (SSP2-4.5)</p>`
        : ""

      cityBlocks.push(`
        <tr>
          <td style="padding:20px 0;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af">${name}</p>
            ${weather
              ? `<p style="margin:8px 0 0;font-size:36px;font-weight:900;color:#111111;line-height:1">${fmt(weather.apparent_temp_max)}°<span style="font-size:16px;color:#9ca3af;font-weight:400"> ressenti max</span></p>
                 ${anomalyLine}
                 ${proj2050Line}`
              : `<p style="margin:8px 0 0;font-size:14px;color:#9ca3af">Données indisponibles aujourd'hui</p>`
            }
            <p style="margin:12px 0 0">
              <a href="${BASE_URL}/a/${slug}" style="font-size:12px;color:#f97316;font-weight:600;text-decoration:none">Voir la carte complète &rarr;</a>
            </p>
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
            <p style="margin:24px 0 0;font-size:15px;color:#374151">Bonjour ${row.first_name},</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${cityBlocks.join("")}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center">
              cestchaud.fr &middot; données ERA5 &amp; GIEC CMIP6 &middot;
              <a href="${BASE_URL}/api/confirm?token=unsub" style="color:#d1d5db">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    emails.push({
      from: FROM_EMAIL,
      to: row.email,
      subject: `Votre briefing du ${dateLabel}`,
      html,
    })
  }

  // Envoyer par lots de 100 (limite Resend batch)
  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100)
    await resend.batch.send(batch)
    sent += batch.length
  }

  return NextResponse.json({ sent })
}
