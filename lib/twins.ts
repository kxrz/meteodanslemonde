// Jumeaux 2050 : quelle ville du monde vit AUJOURD'HUI le climat que votre ville aura en 2050 ?
// Logique pure (aucun accès réseau, aucune dépendance React) : testée dans __tests__/twins.test.ts.

import { SEASON_MONTHS, type Season } from "@/lib/season"

type Arr = (number | null)[]

/** Ce dont on a besoin d'une entrée de data/climate-full.json. */
export interface TwinClimate {
  normal: number[]
  trend: number[]
  ssp245?: { proj2050: Arr }
}

export interface WorldRef {
  id: string
  name: string
  country: string
}

/**
 * Seuil d'honnêteté : au-delà de 2,5 °C d'écart moyen (écart quadratique moyen sur 12 mois),
 * on ne parle plus de « jumeau ».
 * Pourquoi 2,5 °C : la moyenne mensuelle du ressenti maximal varie naturellement d'une année
 * à l'autre de l'ordre de 1,5 à 2,5 °C. Sous ce seuil, la différence entre votre ville en 2050
 * et son jumeau n'est pas plus grande que la différence entre deux années ordinaires.
 * Au-dessus, elle devient plus grande que le réchauffement projeté lui-même (≈ 1,5 °C) : la comparaison
 * n'apprendrait plus rien.
 */
export const TWIN_MAX_RMSE = 2.5

/** Moyenne glissante circulaire sur 3 mois (décembre voisine janvier). */
export function smooth3(values: number[]): number[] {
  return values.map((_, i) => (values[(i + 11) % 12] + values[i] + values[(i + 1) % 12]) / 3)
}

/**
 * Écart de réchauffement retenu pour 2050, mois par mois.
 *
 * Choix documenté :
 * 1. On part de la projection médiane des modèles à l'horizon 2050 (série « ssp245 » : moyenne
 *    2041-2050 de l'ensemble CMIP6, comparée à 2000-2020 ; voir l'avertissement de lib/climate-season.ts).
 * 2. On la lisse sur 3 mois : une valeur mensuelle brute de projection est bruitée
 *    (deux modèles seulement, dix années), un mois isolé peut « baisser » sans signification physique.
 * 3. On ne descend jamais sous la tendance déjà observée (ERA5, 1991-2000 → 2015-2024), elle aussi lissée :
 *    le climat de 2050 ne peut pas être plus frais que celui qu'on mesure déjà. Quand la projection
 *    est plus basse que l'observé, c'est le bruit des modèles, pas un refroidissement.
 * Une valeur manquante de projection compte pour 0 (avant le plancher de la tendance).
 */
export function warming2050(c: TwinClimate): number[] {
  const proj = smooth3((c.ssp245?.proj2050 ?? Array(12).fill(null)).map((v) => v ?? 0))
  const trend = smooth3(c.trend)
  return proj.map((p, i) => Math.max(p, trend[i]))
}

/** Climat cible : la normale 1991-2020 de la ville + le réchauffement retenu pour 2050. */
export function climate2050(c: TwinClimate): number[] {
  const d = warming2050(c)
  return c.normal.map((n, i) => n + d[i])
}

/** Écart quadratique moyen entre deux courbes de 12 mois. */
export function rmse(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < 12; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s / 12)
}

export interface SeasonGap {
  season: Season
  /** écart moyen signé (jumeau − cible) sur les 3 mois : > 0, le jumeau est plus chaud */
  diff: number
  /** écart absolu moyen sur les 3 mois */
  abs: number
}

export interface Twin {
  id: string
  name: string
  country: string
  /** écart quadratique moyen sur 12 mois, en °C */
  rmse: number
  /** écart moyen signé sur l'année (jumeau − cible), en °C */
  bias: number
  /** ressemblance de 0 à 100 : 100 − 20 × écart moyen (100 = identique, 50 = 2,5 °C, 0 = 5 °C ou plus) */
  score: number
  /** saison où la ressemblance est la plus forte / la plus faible */
  best: SeasonGap
  worst: SeasonGap
  /** la normale actuelle du jumeau, mois par mois */
  normal: number[]
}

export interface TwinResult {
  /** climat cible 2050 de la ville française */
  target: number[]
  /** les 3 villes les plus proches, de la plus proche à la moins proche */
  top: Twin[]
  /** false si même la meilleure dépasse TWIN_MAX_RMSE */
  hasCloseTwin: boolean
  /** classement complet (utile pour le jeu : choisir des distracteurs vraiment éloignés) */
  ranking: { id: string; rmse: number }[]
}

const SEASONS: Season[] = ["hiver", "printemps", "ete", "automne"]

function seasonGaps(twin: number[], target: number[]): SeasonGap[] {
  return SEASONS.map((season) => {
    const ms = SEASON_MONTHS[season]
    const diffs = ms.map((m) => twin[m] - target[m])
    return {
      season,
      diff: diffs.reduce((a, b) => a + b, 0) / 3,
      abs: diffs.reduce((a, b) => a + Math.abs(b), 0) / 3,
    }
  })
}

export function similarityScore(r: number): number {
  return Math.max(0, Math.round(100 - 20 * r))
}

/** Compare une courbe cible aux normales actuelles des villes du monde. */
export function rankTwins(target: number[], world: WorldRef[], climate: Record<string, TwinClimate | undefined>, n = 3): TwinResult {
  const scored = world
    .map((w) => {
      const normal = climate[w.id]?.normal
      if (!normal || normal.length !== 12) return null
      return { w, normal, r: rmse(normal, target) }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => a.r - b.r)

  const top: Twin[] = scored.slice(0, n).map(({ w, normal, r }) => {
    const gaps = seasonGaps(normal, target)
    const byAbs = [...gaps].sort((a, b) => a.abs - b.abs)
    return {
      id: w.id,
      name: w.name,
      country: w.country,
      rmse: r,
      bias: normal.reduce((s, v, i) => s + v - target[i], 0) / 12,
      score: similarityScore(r),
      best: byAbs[0],
      worst: byAbs[byAbs.length - 1],
      normal,
    }
  })

  return {
    target,
    top,
    hasCloseTwin: top.length > 0 && top[0].rmse <= TWIN_MAX_RMSE,
    ranking: scored.map(({ w, r }) => ({ id: w.id, rmse: r })),
  }
}

/** Les jumeaux 2050 d'une ville française. null si la ville n'a pas de données climatiques. */
export function findTwins2050(cityId: string, world: WorldRef[], climate: Record<string, TwinClimate | undefined>, n = 3): TwinResult | null {
  const c = climate[cityId]
  if (!c || c.normal?.length !== 12 || c.trend?.length !== 12) return null
  return rankTwins(climate2050(c), world, climate, n)
}

/**
 * L'ancien calcul, présenté pour ce qu'il est : la MÉTÉO du jour, pas le climat.
 * Villes du monde dont le ressenti maximal du jour est à ±tolérance de celui de la ville française.
 */
export function sameWeatherToday<T extends { apparent_temp_max: number }>(temp: number, world: T[], tolerance = 4, max = 6): (T & { diff: number })[] {
  return world
    .map((w) => ({ ...w, diff: w.apparent_temp_max - temp }))
    .filter((w) => Math.abs(w.diff) <= tolerance)
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
    .slice(0, max)
}
