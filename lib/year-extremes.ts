// Extrêmes de l'année par ville (data/year-extremes.json, écrit par scripts/fetch-year-extremes.ts).

export interface CityExtreme {
  /** ressenti maximal le plus haut de l'année */
  max: number
  max_date: string
  /** ressenti maximal le plus bas de l'année (la journée la plus froide, pas la nuit) */
  min: number
  min_date: string
  /** vrai minimum de l'année : température minimale (temperature_2m_min) la plus basse */
  minTempLow?: number
  minTempLowDate?: string
  updated_at: string
}

/**
 * Calcule les extrêmes à partir des séries quotidiennes.
 * `max`/`min` portent sur le ressenti maximal (champs historiques), `minTempLow` sur la minimale.
 * Renvoie null si aucune valeur de ressenti n'est exploitable.
 */
export function computeYearExtremes(
  dates: string[],
  apparentMax: (number | null)[],
  tempMin: (number | null)[] | undefined,
  updatedAt: string,
): CityExtreme | null {
  let max = -Infinity, min = Infinity, low = Infinity
  let max_date = "", min_date = "", lowDate = ""
  for (let i = 0; i < dates.length; i++) {
    const v = apparentMax[i]
    if (v != null) {
      if (v > max) { max = v; max_date = dates[i] }
      if (v < min) { min = v; min_date = dates[i] }
    }
    const t = tempMin?.[i]
    if (t != null && t < low) { low = t; lowDate = dates[i] }
  }
  if (!max_date || !min_date) return null
  return {
    max: Math.round(max),
    max_date,
    min: Math.round(min),
    min_date,
    ...(lowDate ? { minTempLow: Math.round(low * 10) / 10, minTempLowDate: lowDate } : {}),
    updated_at: updatedAt,
  }
}
