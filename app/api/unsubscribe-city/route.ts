import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { BASE_URL } from "@/lib/resend"

// GET /api/unsubscribe-city?token=<confirm_token>&city=<slug>
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const citySlug = req.nextUrl.searchParams.get("city")

  if (!token || !citySlug) {
    return NextResponse.redirect(`${BASE_URL}/notifications?unsub=invalid`)
  }

  const sql = getSql()

  // Trouver l'abonné via son token
  const rows = await sql`
    SELECT id FROM subscribers WHERE confirm_token = ${token}
  ` as { id: string }[]

  if (!rows.length) {
    return NextResponse.redirect(`${BASE_URL}/notifications?action=invalid-token`)
  }

  const subscriberId = rows[0].id

  // Récupérer le nom de la ville avant suppression
  const cityRows = await sql`
    SELECT city_name FROM subscriptions
    WHERE subscriber_id = ${subscriberId} AND city_slug = ${citySlug}
  ` as { city_name: string }[]

  if (!cityRows.length) {
    return NextResponse.redirect(`${BASE_URL}/profil?token=${token}&action=city-not-found`)
  }

  const cityName = cityRows[0].city_name

  await sql`
    DELETE FROM subscriptions
    WHERE subscriber_id = ${subscriberId} AND city_slug = ${citySlug}
  `

  const encoded = encodeURIComponent(cityName)
  return NextResponse.redirect(`${BASE_URL}/profil?token=${token}&action=city-removed&city=${encoded}`)
}
