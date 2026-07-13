import { Metadata } from "next"
import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import { slugify } from "@/lib/slugify"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Alertes thermiques · nuits tropicales & canicule · cestchaud.fr",
  description: "Nuits tropicales du mois et jours de canicule consécutifs pour les 62 grandes villes françaises. Données Open-Meteo actualisées quotidiennement.",
  alternates: { canonical: "https://www.cestchaud.fr/alertes" },
}

const citiesFR = require("@/data/cities-fr.json") as Array<{
  id: string; name: string; lat: number; lon: number; region: string
}>

type CityAlerts = {
  id: string
  name: string
  region: string
  tropicalNights: number
  heatwaveStreak: number
  maxTempToday: number | null
  minTempToday: number | null
}

async function fetchAlertMetrics(): Promise<CityAlerts[]> {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const monthStart = `${y}-${m}-01`
  const today = `${y}-${m}-${d}`
  const past30 = new Date(now)
  past30.setDate(past30.getDate() - 30)
  const past30Str = past30.toISOString().split("T")[0]

  const BATCH = 10
  const allResults: CityAlerts[] = []

  for (let i = 0; i < citiesFR.length; i += BATCH) {
    const batch = citiesFR.slice(i, i + BATCH)
    const lats = batch.map(c => c.lat).join(",")
    const lons = batch.map(c => c.lon).join(",")
    try {
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lats}&longitude=${lons}` +
        `&daily=temperature_2m_min,apparent_temperature_max&start_date=${past30Str}&end_date=${today}`,
        { next: { revalidate: 86400 } }
      )
      if (!res.ok) {
        batch.forEach(c => allResults.push({ ...c, tropicalNights: 0, heatwaveStreak: 0, maxTempToday: null, minTempToday: null }))
        continue
      }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : [data]
      batch.forEach((city, j) => {
        const r = arr[j]
        if (!r?.daily) {
          allResults.push({ ...city, tropicalNights: 0, heatwaveStreak: 0, maxTempToday: null, minTempToday: null })
          return
        }
        const dates = r.daily.time as string[]
        const minTemps = r.daily.temperature_2m_min as number[]
        const maxTemps = r.daily.apparent_temperature_max as number[]
        const tropicalNights = dates.filter((date, k) => date >= monthStart && minTemps[k] > 20).length
        let heatwaveStreak = 0
        for (let k = maxTemps.length - 1; k >= 0; k--) {
          if (maxTemps[k] >= 35) heatwaveStreak++
          else break
        }
        allResults.push({
          ...city,
          tropicalNights,
          heatwaveStreak,
          maxTempToday: maxTemps.length > 0 ? Math.round(maxTemps[maxTemps.length - 1]) : null,
          minTempToday: minTemps.length > 0 ? Math.round(minTemps[minTemps.length - 1]) : null,
        })
      })
    } catch {
      batch.forEach(c => allResults.push({ ...c, tropicalNights: 0, heatwaveStreak: 0, maxTempToday: null, minTempToday: null }))
    }
  }

  return allResults
}

export default async function AlertesPage() {
  const cities = await fetchAlertMetrics()
  const now = new Date()
  const monthName = now.toLocaleDateString("fr-FR", { month: "long" })
  const daysInMonth = now.getDate()

  const byTropicalNights = [...cities]
    .filter(c => c.tropicalNights > 0)
    .sort((a, b) => b.tropicalNights - a.tropicalNights)

  const byHeatwave = [...cities]
    .filter(c => c.heatwaveStreak > 0)
    .sort((a, b) => b.heatwaveStreak - a.heatwaveStreak || (b.maxTempToday ?? 0) - (a.maxTempToday ?? 0))

  const totalTropical = byTropicalNights.length
  const totalHeatwave = byHeatwave.length
  const maxNights = byTropicalNights[0]?.tropicalNights ?? 0
  const maxStreak = byHeatwave[0]?.heatwaveStreak ?? 0

  return (
    <div className="bg-[#f5f4f0] min-h-screen">
      <SiteHeader asLink />
      <Breadcrumb crumbs={[{ label: "Alertes thermiques" }]} />

      {/* Hero */}
      <div className="bg-neutral-900 px-5 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/30 mb-4">Alertes thermiques</p>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Nuits tropicales & jours de canicule
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-8">
            Deux signaux d&apos;alerte climatique pour les 62 grandes villes françaises : les nuits sans fraîcheur (min &gt; 20°C) et les jours de canicule consécutifs (ressenti &gt; 35°C). Données Open-Meteo, actualisées chaque jour.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-black text-sky-400 leading-none">{totalTropical}</p>
              <p className="text-xs text-white/30 mt-1">villes en nuit tropicale</p>
            </div>
            <div>
              <p className="text-3xl font-black text-sky-300 leading-none">{maxNights}</p>
              <p className="text-xs text-white/30 mt-1">nuits max ce mois ({monthName})</p>
            </div>
            <div>
              <p className="text-3xl font-black text-red-400 leading-none">{totalHeatwave}</p>
              <p className="text-xs text-white/30 mt-1">villes en canicule active</p>
            </div>
            <div>
              <p className="text-3xl font-black text-red-300 leading-none">{maxStreak}j</p>
              <p className="text-xs text-white/30 mt-1">streak max en cours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Nuits tropicales */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500">Nuits tropicales · {monthName} (sur {daysInMonth} jours)</p>
            </div>

            {byTropicalNights.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-neutral-400 text-sm">Aucune nuit tropicale ce mois-ci.</p>
                <p className="text-neutral-300 text-xs mt-1">Toutes les villes descendent sous 20°C la nuit.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">#</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Ville</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Nuits &gt; 20°C</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Min ce soir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {byTropicalNights.map((city, i) => (
                      <tr key={city.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-neutral-300 font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/a/${slugify(city.name)}`} className="font-semibold text-neutral-900 hover:underline">
                            {city.name}
                          </Link>
                          <p className="text-xs text-neutral-400">{city.region}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-black text-sky-600 text-base">{city.tropicalNights}</span>
                            <span className="text-xs text-neutral-400">/{daysInMonth}j</span>
                          </span>
                          <div className="flex justify-end mt-1">
                            <div className="h-1 rounded-full bg-sky-100 w-16 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-sky-400"
                                style={{ width: `${Math.round((city.tropicalNights / daysInMonth) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {city.minTempToday !== null ? (
                            <span className={`font-semibold text-sm ${city.minTempToday > 20 ? "text-sky-500" : "text-neutral-500"}`}>
                              {city.minTempToday}°
                            </span>
                          ) : <span className="text-neutral-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {byTropicalNights.length < cities.length && (
                  <p className="px-4 py-3 text-xs text-neutral-300 border-t border-neutral-100">
                    {cities.length - byTropicalNights.length} villes n&apos;ont aucune nuit tropicale ce mois.
                  </p>
                )}
              </div>
            )}

            {/* Pédagogie */}
            <div className="mt-4 bg-[#1e293b] rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-sky-400/50 mb-2">Pourquoi c&apos;est important</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Une nuit tropicale (minimum &gt; 20°C) empêche la récupération thermique du corps. Les personnes âgées, les nourrissons et les malades chroniques sont particulièrement vulnérables. Selon Santé Publique France, 80% des surmortalités lors des canicules surviennent la nuit.
              </p>
            </div>
          </div>

          {/* Canicule streak */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500">Jours de canicule consécutifs · en cours</p>
            </div>

            {byHeatwave.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-neutral-400 text-sm">Pas de canicule active en ce moment.</p>
                <p className="text-neutral-300 text-xs mt-1">Aucune ville au-dessus de 35°C de ressenti.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">#</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Ville</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Streak</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Ressenti aujourd&apos;hui</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {byHeatwave.map((city, i) => (
                      <tr key={city.id} className={`hover:bg-neutral-50 transition-colors ${city.heatwaveStreak >= 5 ? "bg-red-50/50" : ""}`}>
                        <td className="px-4 py-3 text-xs text-neutral-300 font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/a/${slugify(city.name)}`} className="font-semibold text-neutral-900 hover:underline">
                            {city.name}
                          </Link>
                          <p className="text-xs text-neutral-400">{city.region}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black text-base ${city.heatwaveStreak >= 7 ? "text-red-700" : city.heatwaveStreak >= 4 ? "text-red-500" : "text-orange-500"}`}>
                            {city.heatwaveStreak}j
                          </span>
                          {city.heatwaveStreak >= 3 && (
                            <p className="text-[10px] text-red-400">épisode actif</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {city.maxTempToday !== null ? (
                            <span className={`font-semibold text-sm ${city.maxTempToday >= 40 ? "text-red-700" : city.maxTempToday >= 35 ? "text-red-500" : "text-neutral-600"}`}>
                              {city.maxTempToday}°C
                            </span>
                          ) : <span className="text-neutral-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {byHeatwave.length < cities.length && (
                  <p className="px-4 py-3 text-xs text-neutral-300 border-t border-neutral-100">
                    {cities.length - byHeatwave.length} villes sous le seuil de canicule (35°C ressenti).
                  </p>
                )}
              </div>
            )}

            {/* Pédagogie */}
            <div className="mt-4 bg-[#7f1d1d]/10 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-red-400/70 mb-2">Pourquoi c&apos;est important</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Un épisode caniculaire est défini par Météo-France comme 3 jours consécutifs avec un ressenti max &gt; 35°C et un minimum nocturne &gt; 20°C. La durée est le facteur le plus dangereux : le corps n&apos;a pas le temps de récupérer. La canicule de 2003 (17 jours) a causé 15 000 décès supplémentaires en France.
              </p>
            </div>
          </div>
        </div>

        {/* Lien retour */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-3">
          <Link href="/" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
            &larr; Retour à l&apos;accueil
          </Link>
          <Link href="/en/france" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
            France en chiffres &rarr;
          </Link>
          <Link href="/carte" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
            Carte de chaleur &rarr;
          </Link>
        </div>
      </div>

      <PageFooter className="px-5" />
    </div>
  )
}
