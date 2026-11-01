// Logique pure de la fiche ville et des pages région (testée dans __tests__/city-page.test.ts).

/** Les relevés du jour sont-ils réels ? (getWeatherData renvoie des zéros quand l'appel échoue) */
export function hasLiveData(cities: { apparent_temp_max: number; temp_min?: number }[]): boolean {
  return cities.some((c) => c.apparent_temp_max !== 0 || (c.temp_min ?? 0) !== 0)
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

export interface SignalPeriod {
  start: string // AAAA-MM-JJ
  end: string
  month: number // 0-11, mois couvert
  days: number // jours couverts
  daysInMonth: number
}

/**
 * Période des signaux « ce mois-ci ». L'archive Open-Meteo a ~2 jours de retard :
 * en tout début de mois (moins de 5 jours disponibles), on montre le mois précédent complet.
 */
export function signalPeriod(now: Date): SignalPeriod {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2))
  if (end.getUTCDate() >= 5) {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    const dim = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
    return { start: iso(start), end: iso(end), month: end.getUTCMonth(), days: end.getUTCDate(), daysInMonth: dim }
  }
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1))
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0))
  return { start: iso(start), end: iso(last), month: start.getUTCMonth(), days: last.getUTCDate(), daysInMonth: last.getUTCDate() }
}

/** Nombre de nuits attendues sur la période, d'après la normale mensuelle (null si pas de normale). */
export function expectedNights(normals: number[] | undefined, period: SignalPeriod): number | null {
  const n = normals?.[period.month]
  if (n == null || !Number.isFinite(n)) return null
  return Math.round(((n * period.days) / period.daysInMonth) * 10) / 10
}

/** Compte les valeurs non nulles qui vérifient le prédicat. */
export function countDays(values: (number | null)[], test: (v: number) => boolean): number {
  return values.filter((v): v is number => v != null && test(v)).length
}

/** Série en cours (depuis la fin) de jours qui vérifient le prédicat. */
export function trailingStreak(values: (number | null)[], test: (v: number) => boolean): number {
  let n = 0
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i]
    if (v == null || !test(v)) break
    n++
  }
  return n
}

export type ImpactStatus = "tendance" | "france" | "approche"

/**
 * Statut d'un impact, fondé sur la TENDANCE de la saison (climat), jamais sur l'écart d'un seul jour (météo).
 *  - tendance : le réchauffement de la saison ici atteint déjà le seuil associé à l'impact
 *  - france   : impact documenté en France, sans seuil local
 *  - approche : seuil pas encore atteint ici par la tendance de fond
 */
export function impactStatus(seasonTrend: number | null, anomalyMin: number): ImpactStatus {
  if (anomalyMin > 0 && seasonTrend != null && seasonTrend >= anomalyMin) return "tendance"
  if (anomalyMin === 0) return "france"
  return "approche"
}

export interface YearExtremeRaw {
  max: number
  max_date: string
  min: number
  min_date: string
  minTempLow?: number
  minTempLowDate?: string
}

export interface ExtremeItem {
  value: number
  date: string
  label: string
  detail: string
}

/**
 * Libellés justes pour les extrêmes de l'année.
 * `min` est le plus bas des ressentis MAXIMAUX (la journée la plus froide), pas un minimum nocturne.
 * Si le vrai minimum nocturne (`minTempLow`) est fourni, on l'utilise.
 */
export function extremesView(e: YearExtremeRaw): { hot: ExtremeItem; cold: ExtremeItem } {
  const hot = { value: e.max, date: e.max_date, label: "Journée la plus chaude", detail: "ressenti maximal" }
  const cold = e.minTempLow != null && e.minTempLowDate
    ? { value: e.minTempLow, date: e.minTempLowDate, label: "Nuit la plus froide", detail: "température minimale" }
    : { value: e.min, date: e.min_date, label: "Journée la plus froide", detail: "ressenti maximal de la journée" }
  return { hot, cold }
}

/** Le portrait (narratives.json) parle-t-il de l'été ? */
export function isSummerNarrative(text: string): boolean {
  return /(juillet|août|(^|[^a-zà-ÿ])été|estival|canicule)/i.test(text)
}

const THE_SEASON: Record<string, string> = { hiver: "l'hiver", printemps: "le printemps", ete: "l'été", automne: "l'automne" }
const IN_SEASON: Record<string, string> = { hiver: "en hiver", printemps: "au printemps", ete: "en été", automne: "en automne" }

/** « l'hiver », « le printemps », « l'été », « l'automne » */
export function theSeason(season: string): string {
  return THE_SEASON[season] ?? season
}

/** « en hiver », « au printemps », « en été », « en automne » */
export function inSeason(season: string): string {
  return IN_SEASON[season] ?? season
}

export interface Crop { x: number; y: number; w: number; h: number }

/**
 * Cadre (viewBox) autour de points projetés : marge, taille minimale, rapport largeur/hauteur imposé,
 * le tout gardé dans les limites de la carte.
 */
export function regionCrop(pts: [number, number][], opts: { minSpan: number; ratio: number; maxW: number; maxH: number }): Crop {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  let w = Math.max(opts.minSpan, (Math.max(...xs) - Math.min(...xs)) * 1.5)
  let h = Math.max(opts.minSpan / opts.ratio, (Math.max(...ys) - Math.min(...ys)) * 1.5)
  if (w / h > opts.ratio) h = w / opts.ratio
  else w = h * opts.ratio
  w = Math.min(w, opts.maxW)
  h = Math.min(h, opts.maxH)
  const x = Math.min(Math.max(0, cx - w / 2), opts.maxW - w)
  const y = Math.min(Math.max(0, cy - h / 2), opts.maxH - h)
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}

/** Moyenne arrondie au dixième des valeurs non nulles (null si aucune). */
export function mean1(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => x != null && Number.isFinite(x))
  if (!v.length) return null
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10
}
