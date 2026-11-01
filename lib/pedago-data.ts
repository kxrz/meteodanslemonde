// Données d'une ville pour les pages pédagogiques (idées reçues, mode projection). Côté serveur uniquement.

import { readFileSync } from "fs"
import path from "path"
import citiesFRRaw from "@/data/cities-fr.json"
import yearExtremesRaw from "@/data/year-extremes.json"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateFull, seasonalProjections, seasonShiftDays, smoothedAt } from "@/lib/climate-season"
import { MONTHS, SEASON_LABEL, seasonOf, seasonalMean, type Season } from "@/lib/season"
import { resolveCitySlug } from "@/lib/pedago"
import { slugify } from "@/lib/slugify"
import type { DotCity } from "@/components/pedago/FranceDotMap"

export interface CityOption { id: string; name: string }

export interface SeasonFuture {
  season: Season
  label: string
  normal: number | null
  central: number | null
  low: number | null
  high: number | null
}

export interface PedagoCity {
  id: string
  name: string
  region: string
  /** ressenti maximal du jour (null : relevé indisponible) */
  today: number | null
  /** température minimale de la nuit (null : relevé indisponible) */
  tonightMin: number | null
  normal: number | null
  /** tendance lissée sur 3 mois autour du mois courant */
  trend: number | null
  anomaly: number | null
  normals: number[] | null
  trends: number[] | null
  proj2030: (number | null)[] | null
  proj2050: (number | null)[] | null
  shiftDays: number | null
  future2050: SeasonFuture[]
  /** extrêmes de l'année, sur le ressenti maximal du jour */
  extremes: { max: number; maxDate: string; min: number; minDate: string } | null
  /** nuits de gel attendues par mois (normales), si le fichier existe */
  frost: number[] | null
}

export interface PedagoContext {
  city: PedagoCity
  cities: CityOption[]
  month: number
  monthLabel: string
  season: Season
  dataDate: string
  hasData: boolean
  dotCities: DotCity[]
}

type FRBase = { id: string; name: string; region: string; lat: number; lon: number }
type Extremes = Record<string, { max: number; max_date: string; min: number; min_date: string }>

let frostCache: Record<string, number[]> | null | undefined
function loadFrost(): Record<string, number[]> | null {
  if (frostCache !== undefined) return frostCache ?? null
  try {
    const raw = JSON.parse(readFileSync(path.join(process.cwd(), "data", "frost-normals.json"), "utf8"))
    frostCache = raw?.cities ?? null
  } catch {
    frostCache = null
  }
  return frostCache ?? null
}

const round1 = (n: number) => Math.round(n * 10) / 10

export async function loadPedagoContext(ville: string | string[] | undefined): Promise<PedagoContext> {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const full = loadClimateFull()
  const base = citiesFRRaw as FRBase[]
  const dataDate = new Date(fetchedAt)
  const month = dataDate.getMonth()
  const season = seasonOf(month)
  // Échec du relevé : getWeatherData renvoie des zéros partout. On le détecte pour ne jamais les afficher.
  const hasData = citiesFR.some((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)

  const picked = resolveCitySlug(base, ville)
  const live = hasData ? citiesFR.find((c) => c.id === picked.id) : undefined
  const entry = full[picked.id]
  const normal = entry?.normal?.[month] ?? null
  const trend = smoothedAt(entry?.trend, month)
  const today = live ? live.apparent_temp_max : null
  const ext = (yearExtremesRaw as Extremes)[picked.id]
  const frost = loadFrost()?.[picked.id]

  const city: PedagoCity = {
    id: picked.id,
    name: picked.name,
    region: picked.region,
    today,
    tonightMin: live ? live.temp_min : null,
    normal,
    trend,
    anomaly: today != null && normal != null ? round1(today - normal) : null,
    normals: entry?.normal ?? null,
    trends: entry?.trend ?? null,
    proj2030: entry?.ssp245?.proj2030 ?? null,
    proj2050: entry?.ssp245?.proj2050 ?? null,
    shiftDays: entry && trend != null ? seasonShiftDays(entry.normal, month, trend) : null,
    future2050: (["hiver", "printemps", "ete", "automne"] as Season[]).map((s) => {
      const p = seasonalProjections(entry, s).find((x) => x.year === 2050)
      return { season: s, label: SEASON_LABEL[s], normal: seasonalMean(entry?.normal, s), central: p?.central ?? null, low: p?.low ?? null, high: p?.high ?? null }
    }),
    extremes: ext ? { max: ext.max, maxDate: ext.max_date, min: ext.min, minDate: ext.min_date } : null,
    frost: Array.isArray(frost) && frost.length === 12 ? frost : null,
  }

  const dotCities: DotCity[] = citiesFR.map((c) => {
    const n = full[c.id]?.normal?.[month] ?? null
    return {
      id: c.id, name: c.name, slug: slugify(c.name), region: c.region, lat: c.lat, lon: c.lon, temp: c.apparent_temp_max, normal: n,
      anomaly: hasData && n != null ? round1(c.apparent_temp_max - n) : null,
    }
  })

  return {
    city,
    cities: [...base].sort((a, b) => a.name.localeCompare(b.name, "fr")).map((c) => ({ id: c.id, name: c.name })),
    month,
    monthLabel: MONTHS[month],
    season,
    dataDate: fetchedAt,
    hasData,
    dotCities,
  }
}
