import { Metadata } from "next"
import { getSql, initDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { robots: "noindex, nofollow", title: "Dashboard · Admin" }

type Row = {
  id: string
  first_name: string
  email: string
  confirmed_at: Date | null
  created_at: Date
  beta_tester: boolean
  city_count: number
  cities: string
}

function mask(email: string) {
  return email.slice(0, 3) + "***"
}

export default async function AdminDashboardPage() {
  await initDb()
  const sql = getSql()

  const rows = await sql`
    SELECT
      s.id,
      s.first_name,
      s.email,
      s.confirmed_at,
      s.created_at,
      s.beta_tester,
      COUNT(sub.id)::int AS city_count,
      COALESCE(STRING_AGG(sub.city_name, ', ' ORDER BY sub.created_at), '') AS cities
    FROM subscribers s
    LEFT JOIN subscriptions sub ON sub.subscriber_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  ` as Row[]

  const total = rows.length
  const confirmed = rows.filter(r => r.confirmed_at).length
  const unconfirmed = total - confirmed
  const beta = rows.filter(r => r.beta_tester).length
  const totalCities = rows.reduce((s, r) => s + r.city_count, 0)

  const cityCount: Record<string, number> = {}
  for (const row of rows) {
    for (const city of row.cities.split(", ").filter(Boolean)) {
      cityCount[city] = (cityCount[city] ?? 0) + 1
    }
  }
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-1">Admin</p>
          <h1 className="text-2xl font-black text-neutral-900">Dashboard abonnes</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 mb-1">Total</p>
            <p className="text-4xl font-black text-neutral-900">{total}</p>
          </div>
          <div className="bg-green-50 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 mb-1">Confirmes</p>
            <p className="text-4xl font-black text-green-700">{confirmed}</p>
          </div>
          <div className="bg-amber-50 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 mb-1">En attente</p>
            <p className="text-4xl font-black text-amber-600">{unconfirmed}</p>
          </div>
          <div className="bg-neutral-900 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/40 mb-1">Villes suivies</p>
            <p className="text-4xl font-black text-white">{totalCities}</p>
          </div>
        </div>

        {/* Top villes */}
        {topCities.length > 0 && (
          <div className="bg-white rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400 mb-4">Top villes</p>
            <div className="flex flex-wrap gap-2">
              {topCities.map(([city, count]) => (
                <span key={city} className="flex items-center gap-1.5 bg-neutral-100 rounded-xl px-3 py-1.5 text-sm">
                  <span className="font-semibold text-neutral-800">{city}</span>
                  <span className="text-xs font-black text-orange-500">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tableau abonnes */}
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400">Abonnes ({total})</p>
            {beta > 0 && <p className="text-xs text-neutral-400">{beta} beta</p>}
          </div>
          <div className="divide-y divide-neutral-50">
            {rows.map(row => (
              <div key={row.id} className="px-5 py-3.5 flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <span className="text-xs font-black text-neutral-500">
                    {row.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-neutral-900">{row.first_name}</span>
                    <span className="text-xs text-neutral-400 font-mono">{mask(row.email)}</span>
                    {!row.confirmed_at && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600">non confirme</span>
                    )}
                    {row.beta_tester && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-900 text-white">beta</span>
                    )}
                  </div>
                  {row.city_count > 0 ? (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      <span className="font-semibold text-neutral-700">{row.city_count} ville{row.city_count > 1 ? "s" : ""}</span>
                      {" · "}{row.cities}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-300 mt-0.5">aucune ville</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-neutral-300">
                    {new Date(row.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="px-5 py-8 text-sm text-neutral-400 text-center">Aucun abonne</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
