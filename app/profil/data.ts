import { getSql } from "@/lib/db"
import { isToken } from "@/lib/subscription"

export interface Profile {
  id: string
  email: string
  first_name: string
  confirmed_at: Date | null
  beta_tester: boolean
  created_at: Date
  cities: Array<{ slug: string; name: string }>
}

/** "invalid" = jeton inconnu ou malformé ; "unavailable" = base injoignable. */
export async function loadProfile(token: string | undefined): Promise<Profile | "invalid" | "unavailable"> {
  if (!isToken(token)) return "invalid"
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT s.id, s.email, s.first_name, s.confirmed_at, s.beta_tester, s.created_at,
             json_agg(json_build_object('slug', sub.city_slug, 'name', sub.city_name) ORDER BY sub.created_at)
               FILTER (WHERE sub.id IS NOT NULL) AS cities
      FROM subscribers s
      LEFT JOIN subscriptions sub ON sub.subscriber_id = s.id
      WHERE s.confirm_token = ${token}
      GROUP BY s.id
    ` as Array<Omit<Profile, "cities"> & { cities: Profile["cities"] | null }>
    if (!rows.length) return "invalid"
    return { ...rows[0], cities: rows[0].cities ?? [] }
  } catch (err) {
    console.error("[profil]", err)
    return "unavailable"
  }
}
