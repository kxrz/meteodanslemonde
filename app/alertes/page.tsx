import { Metadata } from "next"
import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import { slugify } from "@/lib/slugify"

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
  nightCount: number      // nuits tropicales OU nuits de gel selon saison
  streakCount: number     // streak canicule OU vague de froid
  maxTemp: number | null  // apparant_temperature_max d'avant-hier
  minTemp: number | null  // temperature_2m_min d'avant-hier
}

type Season = "summer" | "winter"

function getSeason(month: number): Season {
  // month 0-11, mai(4)-sept(9) = été
  return month >= 4 && month <= 9 ? "summer" : "winter"
}

async function fetchAlertMetrics(season: Season, monthStart: string, end: string, past30: string): Promise<CityAlerts[]> {
  const BATCH = 10
  const allResults: CityAlerts[] = []
  const nightThreshold = season === "summer" ? 20 : 0
  const heatThreshold = season === "summer" ? 35 : 5

  for (let i = 0; i < citiesFR.length; i += BATCH) {
    const batch = citiesFR.slice(i, i + BATCH)
    const lats = batch.map(c => c.lat).join(",")
    const lons = batch.map(c => c.lon).join(",")
    try {
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lats}&longitude=${lons}` +
        `&daily=temperature_2m_min,apparent_temperature_max&start_date=${past30}&end_date=${end}`,
        { next: { revalidate: 86400 } }
      )
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      // API retourne un objet (1 ville) ou tableau (N villes)
      if (data?.error) throw new Error(data.reason)
      const arr = Array.isArray(data) ? data : [data]
      batch.forEach((city, j) => {
        const r = arr[j]
        if (!r?.daily?.time) {
          allResults.push({ ...city, nightCount: 0, streakCount: 0, maxTemp: null, minTemp: null })
          return
        }
        const dates = r.daily.time as string[]
        const minTemps = r.daily.temperature_2m_min as (number | null)[]
        const maxTemps = r.daily.apparent_temperature_max as (number | null)[]

        // Nuits hors norme dans le mois courant
        const nightCount = dates.filter((date, k) =>
          date >= monthStart && minTemps[k] !== null &&
          (season === "summer" ? minTemps[k]! > nightThreshold : minTemps[k]! < nightThreshold)
        ).length

        // Streak à rebours depuis la dernière date disponible
        let streakCount = 0
        for (let k = maxTemps.length - 1; k >= 0; k--) {
          if (maxTemps[k] === null) break
          const qualifies = season === "summer" ? maxTemps[k]! >= heatThreshold : maxTemps[k]! < heatThreshold
          if (qualifies) streakCount++
          else break
        }

        const last = maxTemps.length - 1
        allResults.push({
          ...city,
          nightCount,
          streakCount,
          maxTemp: last >= 0 && maxTemps[last] !== null ? Math.round(maxTemps[last]!) : null,
          minTemp: last >= 0 && minTemps[last] !== null ? Math.round(minTemps[last]!) : null,
        })
      })
    } catch {
      batch.forEach(c => allResults.push({ ...c, nightCount: 0, streakCount: 0, maxTemp: null, minTemp: null }))
    }
  }

  return allResults
}

export default async function AlertesPage() {
  const now = new Date()
  const month = now.getMonth()
  const season = getSeason(month)
  const isSummer = season === "summer"
  const monthName = now.toLocaleDateString("fr-FR", { month: "long" })

  const y = now.getFullYear()
  const m = String(month + 1).padStart(2, "0")
  const monthStart = `${y}-${m}-01`
  const daysInMonth = now.getDate()

  // Utilise avant-hier pour éviter le lag de l'API archive (1-2 jours)
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() - 2)
  const endStr = endDate.toISOString().split("T")[0]

  const past30 = new Date(now)
  past30.setDate(past30.getDate() - 32)
  const past30Str = past30.toISOString().split("T")[0]

  const cities = await fetchAlertMetrics(season, monthStart, endStr, past30Str)

  const nightLabel = isSummer ? "Nuits tropicales" : "Nuits de gel"
  const nightDesc = isSummer ? "min > 20°C" : "min < 0°C"
  const streakLabel = isSummer ? "Canicule" : "Vague de froid"
  const streakDesc = isSummer ? "ressenti > 35°C" : "max < 5°C"
  const nightColor = isSummer ? "bg-sky-400" : "bg-blue-300"
  const streakColor = isSummer ? "bg-red-400" : "bg-blue-500"
  const nightBg = isSummer ? "bg-[#1e293b]" : "bg-[#1e3a5f]"
  const streakBg = isSummer ? "bg-[#7f1d1d]" : "bg-[#1e3a8a]"
  const nightTextColor = isSummer ? "text-sky-400/60" : "text-blue-300/60"
  const streakTextColor = isSummer ? "text-red-300/50" : "text-blue-200/50"
  const nightCountColor = isSummer ? "text-sky-600" : "text-blue-500"
  const streakCountColor = isSummer ? "text-red-500" : "text-blue-500"

  const byNights = [...cities]
    .filter(c => c.nightCount > 0)
    .sort((a, b) => b.nightCount - a.nightCount)

  const byStreak = [...cities]
    .filter(c => c.streakCount > 0)
    .sort((a, b) => b.streakCount - a.streakCount || (b.maxTemp ?? 0) - (a.maxTemp ?? 0))

  const totalNights = byNights.length
  const totalStreak = byStreak.length
  const maxNights = byNights[0]?.nightCount ?? 0
  const maxStreak = byStreak[0]?.streakCount ?? 0

  const nightPedagoSummer = "Une nuit tropicale (minimum > 20°C) empêche la récupération thermique du corps. Les personnes âgées, nourrissons et malades chroniques sont particulièrement vulnérables. 80% des surmortalités lors des canicules surviennent la nuit (Santé Publique France)."
  const nightPedagoWinter = "Une nuit de gel (minimum < 0°C) représente un risque pour les canalisations, les cultures et les personnes vulnérables à la rue. Elles sont également un marqueur fort : leur fréquence diminue sous l'effet du réchauffement climatique, notamment dans le sud de la France."
  const streakPedagoSummer = "Un épisode caniculaire (Météo-France) : 3 jours consécutifs avec ressenti > 35°C et minimum > 20°C. La durée est le facteur le plus dangereux. La canicule de 2003 (17 jours) a causé 15 000 décès supplémentaires en France."
  const streakPedagoWinter = "Une vague de froid (Météo-France) : plusieurs jours consécutifs avec des températures nettement inférieures aux normales de saison. Seuil : max < 5°C pendant au moins 3 jours. Risques pour les réseaux d'eau, l'énergie et les populations précaires."

  return (
    <div className="bg-[#f5f4f0] min-h-screen">
      <SiteHeader asLink />
      <Breadcrumb crumbs={[{ label: "Alertes thermiques" }]} />

      {/* Hero */}
      <div className="bg-neutral-900 px-5 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/30 mb-4">
            {isSummer ? "Été · alertes chaleur" : "Hiver · alertes froid"}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            {isSummer ? "Nuits sans fraîcheur & jours de canicule" : "Nuits de gel & vagues de froid"}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-8">
            {isSummer
              ? "Deux signaux d'alerte estivaux pour les 62 grandes villes françaises : les nuits où le corps ne récupère pas et les épisodes de canicule qui s'allongent."
              : "Deux signaux d'alerte hivernaux pour les 62 grandes villes françaises : les nuits de gel et les épisodes de froid persistant. Données Open-Meteo, actualisées quotidiennement."
            }
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className={`text-3xl font-black leading-none ${isSummer ? "text-sky-400" : "text-blue-300"}`}>{totalNights}</p>
              <p className="text-xs text-white/30 mt-1">villes · {nightLabel.toLowerCase()}</p>
            </div>
            <div>
              <p className={`text-3xl font-black leading-none ${isSummer ? "text-sky-300" : "text-blue-200"}`}>{maxNights}</p>
              <p className="text-xs text-white/30 mt-1">nuits max ce mois ({monthName})</p>
            </div>
            <div>
              <p className={`text-3xl font-black leading-none ${isSummer ? "text-red-400" : "text-blue-500"}`}>{totalStreak}</p>
              <p className="text-xs text-white/30 mt-1">villes · {streakLabel.toLowerCase()} active</p>
            </div>
            <div>
              <p className={`text-3xl font-black leading-none ${isSummer ? "text-red-300" : "text-blue-400"}`}>{maxStreak}j</p>
              <p className="text-xs text-white/30 mt-1">streak max en cours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Colonne nuits */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${nightColor}`} />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500">
                {nightLabel} · {monthName} (sur {daysInMonth} jours)
              </p>
            </div>

            {byNights.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm font-semibold">
                  {isSummer ? "Aucune nuit tropicale ce mois-ci" : "Aucune nuit de gel ce mois-ci"}
                </p>
                <p className="text-neutral-300 text-xs mt-1">
                  {isSummer ? "Toutes les villes descendent sous 20°C." : "Les températures nocturnes restent positives."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3 w-7">#</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Ville</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">{nightDesc}</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Min récent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {byNights.map((city, i) => (
                      <tr key={city.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-neutral-300 font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/a/${slugify(city.name)}`} className="font-semibold text-neutral-900 hover:underline">
                            {city.name}
                          </Link>
                          <p className="text-xs text-neutral-400">{city.region}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black text-base ${nightCountColor}`}>{city.nightCount}</span>
                          <span className="text-xs text-neutral-400 ml-1">/{daysInMonth}j</span>
                          <div className="flex justify-end mt-1">
                            <div className="h-1 rounded-full bg-neutral-100 w-16 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isSummer ? "bg-sky-400" : "bg-blue-400"}`}
                                style={{ width: `${Math.min(100, Math.round((city.nightCount / Math.max(daysInMonth, 1)) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {city.minTemp !== null ? (
                            <span className={`font-semibold text-sm ${isSummer ? (city.minTemp > 20 ? "text-sky-500" : "text-neutral-400") : (city.minTemp < 0 ? "text-blue-500" : "text-neutral-400")}`}>
                              {city.minTemp}°
                            </span>
                          ) : <span className="text-neutral-300">n/a</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cities.length - byNights.length > 0 && (
                  <p className="px-4 py-3 text-xs text-neutral-300 border-t border-neutral-100">
                    {cities.length - byNights.length} villes sans {isSummer ? "nuit tropicale" : "nuit de gel"} ce mois.
                  </p>
                )}
              </div>
            )}

            <div className={`mt-4 ${nightBg} rounded-2xl p-5`}>
              <p className={`text-[10px] uppercase tracking-[0.12em] font-semibold mb-2 ${nightTextColor}`}>Pourquoi c&apos;est important</p>
              <p className="text-xs text-slate-400 leading-relaxed">{isSummer ? nightPedagoSummer : nightPedagoWinter}</p>
            </div>
          </div>

          {/* Colonne streak */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${streakColor}`} />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500">
                {streakLabel} · épisodes actifs
              </p>
            </div>

            {byStreak.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-neutral-500 text-sm font-semibold">
                  {isSummer ? "Pas de canicule active" : "Pas de vague de froid active"}
                </p>
                <p className="text-neutral-300 text-xs mt-1">
                  {isSummer ? "Aucune ville au-dessus de 35°C de ressenti." : "Toutes les villes dépassent 5°C de ressenti."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3 w-7">#</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Ville</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">Streak</th>
                      <th className="text-right text-[10px] uppercase tracking-[0.12em] text-neutral-400 font-semibold px-4 py-3">
                        {isSummer ? "Ressenti max" : "Max récent"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {byStreak.map((city, i) => (
                      <tr key={city.id} className={`hover:bg-neutral-50 transition-colors ${city.streakCount >= 5 ? (isSummer ? "bg-red-50/50" : "bg-blue-50/50") : ""}`}>
                        <td className="px-4 py-3 text-xs text-neutral-300 font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/a/${slugify(city.name)}`} className="font-semibold text-neutral-900 hover:underline">
                            {city.name}
                          </Link>
                          <p className="text-xs text-neutral-400">{city.region}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black text-base ${city.streakCount >= 7 ? (isSummer ? "text-red-700" : "text-blue-800") : city.streakCount >= 4 ? (isSummer ? "text-red-500" : "text-blue-600") : (isSummer ? "text-orange-500" : "text-blue-400")}`}>
                            {city.streakCount}j
                          </span>
                          {city.streakCount >= 3 && (
                            <p className={`text-[10px] ${isSummer ? "text-red-400" : "text-blue-400"}`}>épisode actif</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {city.maxTemp !== null ? (
                            <span className={`font-semibold text-sm ${isSummer ? (city.maxTemp >= 40 ? "text-red-700" : "text-red-500") : (city.maxTemp < 0 ? "text-blue-700" : "text-blue-500")}`}>
                              {city.maxTemp}°C
                            </span>
                          ) : <span className="text-neutral-300">n/a</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cities.length - byStreak.length > 0 && (
                  <p className="px-4 py-3 text-xs text-neutral-300 border-t border-neutral-100">
                    {cities.length - byStreak.length} villes sous le seuil ({streakDesc}).
                  </p>
                )}
              </div>
            )}

            <div className={`mt-4 rounded-2xl p-5 ${isSummer ? "bg-[#7f1d1d]/10" : "bg-[#1e3a8a]/10"}`}>
              <p className={`text-[10px] uppercase tracking-[0.12em] font-semibold mb-2 ${streakTextColor} opacity-100`} style={{ color: isSummer ? "rgb(248 113 113 / 0.7)" : "rgb(147 197 253 / 0.7)" }}>
                Pourquoi c&apos;est important
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">{isSummer ? streakPedagoSummer : streakPedagoWinter}</p>
            </div>
          </div>
        </div>

        {/* CTA réutilisant le pattern sombre du site */}
        <div className="bg-neutral-900 rounded-3xl p-6 lg:p-8">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 mb-3">Aller plus loin</p>
            <h2 className="text-2xl font-black text-white leading-tight mb-4">
              Ces alertes ont un pendant chiffré.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Chaque ville ci-dessus dispose d&apos;une fiche complète avec la tendance ERA5 sur 30 ans et les projections GIEC 2030-2050. La fréquence des nuits tropicales et des épisodes de canicule augmente précisément parce que les normales se déplacent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/carte" className="bg-white text-neutral-900 font-semibold text-sm rounded-2xl px-5 py-3 hover:bg-neutral-100 transition-colors">
                Carte de chaleur &rarr;
              </Link>
              <Link href="/en/france" className="bg-white/10 text-white font-semibold text-sm rounded-2xl px-5 py-3 hover:bg-white/20 transition-colors">
                France en chiffres &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PageFooter className="px-5" />
    </div>
  )
}

export const dynamic = "force-dynamic"
