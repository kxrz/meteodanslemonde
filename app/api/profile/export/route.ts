import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 })

  const sql = getSql()
  const rows = await sql`
    SELECT s.email, s.first_name, s.confirmed_at, s.created_at, s.frequency, s.alert_threshold, s.beta_tester,
           json_agg(json_build_object('city_slug', sub.city_slug, 'city_name', sub.city_name, 'subscribed_at', sub.created_at)
             ORDER BY sub.created_at) FILTER (WHERE sub.id IS NOT NULL) AS cities
    FROM subscribers s
    LEFT JOIN subscriptions sub ON sub.subscriber_id = s.id
    WHERE s.confirm_token = ${token}
    GROUP BY s.email, s.first_name, s.confirmed_at, s.created_at, s.frequency, s.alert_threshold, s.beta_tester
  ` as Array<Record<string, unknown>>

  if (!rows.length) return NextResponse.json({ error: "Token invalide" }, { status: 404 })

  const data = {
    exported_at: new Date().toISOString(),
    source: "cestchaud.fr",
    subscriber: {
      email: rows[0].email,
      first_name: rows[0].first_name,
      subscribed_at: rows[0].created_at,
      confirmed_at: rows[0].confirmed_at,
      frequency: rows[0].frequency,
      alert_threshold_celsius: rows[0].alert_threshold,
      beta_tester: rows[0].beta_tester,
    },
    cities: rows[0].cities ?? [],
    data_retention: "Données conservées pendant la durée de l'abonnement + 3 ans (RGPD Art. 17)",
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cestchaud-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
