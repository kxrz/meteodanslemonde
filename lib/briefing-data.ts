// Assemble les données d'une ville pour l'email quotidien (cron et route de test).
// Seules les villes suivies (data/cities-fr.json) sont couvertes : une ville hors liste
// donne un bloc « relevé indisponible » plutôt que des chiffres inventés.

import { fetchCityWeather, fetchCaniculeStreak, fetchClimateTwin } from "@/lib/weather-data"
import { loadClimateFull, seasonalProjections, smoothedAt } from "@/lib/climate-season"
import { seasonOf } from "@/lib/season"
import { resolveBriefingCity } from "@/lib/subscription"
import type { CityEmailData } from "@/lib/email-builder"
import citiesFR from "@/data/cities-fr.json"

export async function buildCityEmailData(slug: string, storedName: string, month: number): Promise<CityEmailData> {
  const city = resolveBriefingCity(slug, citiesFR)
  const name = city?.name ?? storedName
  if (!city) {
    return { slug, name, apparentTempMax: null, normal: null, anomaly: null }
  }

  const entry = loadClimateFull()[city.id]
  const normal = entry?.normal?.[month] ?? null
  const trend = smoothedAt(entry?.trend, month)
  const projection = seasonalProjections(entry, seasonOf(month)).find((p) => p.year === 2050) ?? null

  const weather = await fetchCityWeather(city.lat, city.lon)
  const apparentTempMax = weather?.apparent_temp_max ?? null
  const tempMin = weather?.temp_min ?? null
  const anomaly = apparentTempMax != null && normal != null ? Math.round((apparentTempMax - normal) * 10) / 10 : null

  // Le compteur de chaleur n'a de sens que les jours chauds : on évite l'appel sinon.
  const [caniculeStreak, climateTwin] = apparentTempMax != null
    ? await Promise.all([apparentTempMax >= 30 ? fetchCaniculeStreak(city.lat, city.lon) : Promise.resolve(0), fetchClimateTwin(apparentTempMax)])
    : [0, null]

  return { slug, name, apparentTempMax, normal, anomaly, trend, projection, tempMin, caniculeStreak, climateTwin }
}
