// Lecture « robuste » des données climatiques pour la pédagogie :
// - les projections sont agrégées par saison, avec la fourchette entre séries de modèles.
//   Attention : les clés ssp126/ssp245/ssp585 de climate-full.json ne correspondent pas à des scénarios
//   demandés à Open-Meteo (scripts/fetch-climate-scenarios.ts ne choisit que des listes de modèles).
//   On affiche donc « médiane des modèles » (série ssp245) et « fourchette entre modèles ».
// - le glissement des saisons est exprimé en jours, à partir de la courbe des normales.
// Les valeurs mensuelles brutes sont trop bruitées (2040 > 2050 dans 83 cases) pour être montrées seules.

import { SEASON_MONTHS, seasonalMean, type Season } from "@/lib/season"

type Arr = (number | null)[]
interface Scenario { proj2030: Arr; proj2040: Arr; proj2050: Arr }
export interface ClimateFull {
  normal: number[]
  trend: number[]
  ssp126?: Scenario
  ssp245?: Scenario
  ssp585?: Scenario
}

let cache: Record<string, ClimateFull> | null = null
export function loadClimateFull(): Record<string, ClimateFull> {
  if (cache) return cache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache = require("@/data/climate-full.json") as Record<string, ClimateFull>
  } catch {
    cache = {}
  }
  return cache
}

export type Horizon = "proj2030" | "proj2040" | "proj2050"
export const HORIZONS: { key: Horizon; year: number }[] = [
  { key: "proj2030", year: 2030 },
  { key: "proj2040", year: 2040 },
  { key: "proj2050", year: 2050 },
]

export interface SeasonalProjection {
  year: number
  central: number | null // série « ssp245 » : médiane des modèles affichée
  low: number | null // minimum entre séries de modèles
  high: number | null // maximum entre séries de modèles
}

/**
 * Projection saisonnière par horizon, avec la fourchette entre séries de modèles.
 * On impose la monotonie de l'affichage (une valeur centrale ne peut pas redescendre
 * d'un horizon au suivant) : la baisse viendrait du bruit des modèles, pas d'un signal.
 */
export function seasonalProjections(entry: ClimateFull | undefined, season: Season): SeasonalProjection[] {
  if (!entry) return []
  const scenarios = [entry.ssp126, entry.ssp245, entry.ssp585].filter(Boolean) as Scenario[]
  let floor = -Infinity
  return HORIZONS.map(({ key, year }) => {
    const vals = scenarios.map((s) => seasonalMean(s[key], season)).filter((v): v is number => v != null)
    let central = entry.ssp245 ? seasonalMean(entry.ssp245[key], season) : vals[0] ?? null
    if (central != null) {
      central = Math.max(central, floor)
      floor = central
    }
    return {
      year,
      central,
      low: vals.length ? Math.min(...vals, central ?? Infinity) : null,
      high: vals.length ? Math.max(...vals, central ?? -Infinity) : null,
    }
  })
}

/** Normale saisonnière et tendance saisonnière (moyennes des 3 mois). */
export function seasonalNormalAndTrend(entry: ClimateFull | undefined, season: Season) {
  return {
    normal: seasonalMean(entry?.normal, season),
    trend: seasonalMean(entry?.trend, season),
  }
}

/**
 * Glissement des saisons, en jours.
 * Question : « la valeur qu'on attend aujourd'hui (normale + écart), on l'atteignait quand, sur la courbe 1991-2020 ? »
 * On interpole linéairement la courbe des normales entre le milieu des mois.
 * Retourne null si la courbe est trop plate à cette période (le calcul n'aurait pas de sens).
 *   > 0 : la date « recule » (ex. un novembre qui ressemble à un mois d'octobre d'avant)
 */
export function seasonShiftDays(normal: number[], month: number, delta: number): number | null {
  if (!normal || normal.length !== 12 || !Number.isFinite(delta)) return null
  const prev = normal[(month + 11) % 12]
  const next = normal[(month + 1) % 12]
  const slopePerMonth = (next - prev) / 2 // °C par mois autour du mois courant
  if (Math.abs(slopePerMonth) < 2) return null
  // Une saison qui refroidit (pente < 0) et un écart positif : on « recule » dans le calendrier.
  const months = -delta / slopePerMonth
  return Math.round(months * 30.4)
}

/** Mois index ← saison, pratique pour les libellés. */
export function seasonMonths(season: Season) {
  return SEASON_MONTHS[season]
}

/** Tendance lissée sur 3 mois autour du mois donné (le chiffre mensuel brut est bruité). */
export function smoothedAt(values: number[] | undefined, month: number): number | null {
  if (!values || values.length !== 12) return null
  const v = (values[(month + 11) % 12] + values[month] + values[(month + 1) % 12]) / 3
  return Math.round(v * 10) / 10
}
