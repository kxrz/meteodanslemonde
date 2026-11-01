// Signaux du mois : nuits de gel, nuits tropicales, séries de ressenti ≥ 35 °C.
// Les seuils sont les mêmes partout sur le site.

import { FROST_THRESHOLD } from "@/lib/frost"
import { meteoUrl } from "@/lib/open-meteo"

/** Nuit tropicale : la minimale ne descend pas sous 20 °C (≥ 20 °C). */
export const TROPICAL_NIGHT = 20
/** Chaleur forte : ressenti maximal ≥ 35 °C. */
export const HEAT_FELT = 35
/** Journée très douce : ressenti maximal à +3 °C ou plus de la normale du mois. */
export const MILD_ANOMALY = 3

// ── Dates (AAAA-MM-JJ, calendrier de Paris) ────────────────────────────────

export function parisISODate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function dateRange(start: string, end: string): string[] {
  const out: string[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
  return out
}

// ── Fenêtre d'observation ─────────────────────────────────────────────────

export interface SignalWindow {
  start: string
  end: string
  /** "month" = depuis le 1er du mois ; "rolling" = 30 derniers jours (début de mois, trop peu de recul) */
  kind: "month" | "rolling"
  days: string[]
}

/** Jours minimum depuis le 1er du mois pour comparer « depuis le début du mois ». */
export const MIN_MONTH_DAYS = 7

/**
 * Depuis le 1er du mois si la dernière donnée disponible tombe dans le mois en cours
 * et couvre au moins 7 jours ; sinon les 30 derniers jours disponibles.
 */
export function signalWindow(lastDataDate: string, today: string): SignalWindow {
  const sameMonth = lastDataDate.slice(0, 7) === today.slice(0, 7)
  if (sameMonth && Number(lastDataDate.slice(8, 10)) >= MIN_MONTH_DAYS) {
    const start = `${lastDataDate.slice(0, 7)}-01`
    return { start, end: lastDataDate, kind: "month", days: dateRange(start, lastDataDate) }
  }
  const start = addDays(lastDataDate, -29)
  return { start, end: lastDataDate, kind: "rolling", days: dateRange(start, lastDataDate) }
}

// ── Série quotidienne d'une ville ─────────────────────────────────────────

export interface DailySeries {
  dates: string[]
  mins: (number | null)[]
  apparentMax: (number | null)[]
}

/** Dernière date dont la minimale est renseignée (l'archive finit souvent par des jours vides). */
export function lastValidDate(s: DailySeries): string | null {
  for (let i = s.dates.length - 1; i >= 0; i--) if (s.mins[i] != null) return s.dates[i]
  return null
}

export interface CitySignals {
  frostNights: number
  tropicalNights: number
  /** jours consécutifs à ressenti ≥ 35 °C jusqu'au dernier jour de la fenêtre */
  heatStreakCurrent: number
  /** plus longue série à ressenti ≥ 35 °C dans la fenêtre */
  heatStreakLongest: number
  /** jours de la fenêtre avec une minimale renseignée */
  validDays: number
}

export function summarizeSeries(s: DailySeries, w: Pick<SignalWindow, "start" | "end">): CitySignals {
  let frostNights = 0, tropicalNights = 0, validDays = 0
  let run = 0, longest = 0
  for (let i = 0; i < s.dates.length; i++) {
    const d = s.dates[i]
    if (d < w.start || d > w.end) continue
    const min = s.mins[i]
    if (min != null) {
      validDays++
      if (min < FROST_THRESHOLD) frostNights++
      if (min >= TROPICAL_NIGHT) tropicalNights++
    }
    const max = s.apparentMax[i]
    run = max != null && max >= HEAT_FELT ? run + 1 : 0
    if (run > longest) longest = run
  }
  return { frostNights, tropicalNights, heatStreakCurrent: run, heatStreakLongest: longest, validDays }
}

// ── Archive Open-Meteo ────────────────────────────────────────────────────


export type ArchiveResult = { id: string; ok: true; series: DailySeries } | { id: string; ok: false }

const BATCH = 10

async function fetchBatch(cities: { id: string; lat: number; lon: number }[], start: string, end: string, revalidate: number): Promise<ArchiveResult[]> {
  const url = meteoUrl("archive", {
    latitude: cities.map((c) => c.lat).join(","),
    longitude: cities.map((c) => c.lon).join(","),
    daily: "temperature_2m_min,apparent_temperature_max",
    start_date: start,
    end_date: end,
    timezone: "Europe/Paris",
  })
  try {
    const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    if (data?.error) throw new Error(String(data.reason))
    const arr = Array.isArray(data) ? data : [data]
    return cities.map((c, j) => {
      const d = arr[j]?.daily
      if (!Array.isArray(d?.time) || !Array.isArray(d?.temperature_2m_min) || !Array.isArray(d?.apparent_temperature_max)) return { id: c.id, ok: false }
      return { id: c.id, ok: true, series: { dates: d.time, mins: d.temperature_2m_min, apparentMax: d.apparent_temperature_max } }
    })
  } catch {
    return cities.map((c) => ({ id: c.id, ok: false }))
  }
}

/** Minimales et ressentis maximaux quotidiens, par lots de 10 villes envoyés en parallèle. Un lot en échec est signalé, jamais remplacé par des zéros. */
export async function fetchArchive(cities: { id: string; lat: number; lon: number }[], start: string, end: string, revalidate: number): Promise<ArchiveResult[]> {
  const batches: (typeof cities)[] = []
  for (let i = 0; i < cities.length; i += BATCH) batches.push(cities.slice(i, i + BATCH))
  return (await Promise.all(batches.map((b) => fetchBatch(b, start, end, revalidate)))).flat()
}
