// Modèle de lettre aux élus : uniquement des chiffres sourcés de la ville choisie,
// et un paragraphe qui change avec la saison (juste en novembre comme en juillet).

import { fmtDeltaTemp, fmtTemp } from "@/lib/format"
import { MONTHS, SEASON_LABEL, deMonth, seasonOf, type Season } from "@/lib/season"
import { seasonalNormalAndTrend, seasonalProjections, type ClimateFull } from "@/lib/climate-season"

export interface LetterFacts {
  city: string
  month: number
  season: Season
  /** normale 1991-2020 du ressenti maximal pour le mois en cours */
  normalMonth: number | null
  /** évolution de la saison en 30 ans (moyenne des 3 mois) */
  trendSeason: number | null
  /** projection 2050 de la saison : centrale SSP2-4.5 et fourchette entre scénarios */
  proj2050: { central: number | null; low: number | null; high: number | null } | null
}

export function letterFacts(city: string, entry: ClimateFull | undefined, month: number): LetterFacts {
  const season = seasonOf(month)
  const p = seasonalProjections(entry, season).find((x) => x.year === 2050)
  return {
    city,
    month,
    season,
    normalMonth: entry?.normal?.[month] ?? null,
    trendSeason: seasonalNormalAndTrend(entry, season).trend,
    proj2050: p ? { central: p.central, low: p.low, high: p.high } : null,
  }
}

/** « l'hiver », « le printemps », « l'été », « l'automne » */
export function theSeason(s: Season): string {
  return s === "printemps" ? "le printemps" : `l'${SEASON_LABEL[s]}`
}

const SEASON_STAKES: Record<Season, string> = {
  hiver:
    "Un hiver plus doux n'est pas une bonne nouvelle. Moins de gel, ce sont davantage d'insectes ravageurs, des bourgeons qui démarrent trop tôt puis gèlent en avril, un enneigement en recul et des ressources en eau moins bien rechargées.",
  printemps:
    "Un printemps plus précoce dérègle le calendrier des cultures : la végétation démarre plus tôt et reste exposée aux gelées tardives, tandis que les sécheresses de printemps se multiplient.",
  ete:
    "La chaleur est en France le risque climatique le plus meurtrier : nuits sans récupération, personnes âgées et travailleurs exposés, écoles et logements qui deviennent des étuves.",
  automne:
    "Un automne qui s'étire repousse le repos de la végétation, prolonge la saison des moustiques et prépare des hivers moins froids : ce sont tous les repères saisonniers qui glissent.",
}

export function buildLetter(f: LetterFacts | null): string {
  const facts: string[] = []
  if (f) {
    if (f.normalMonth != null) {
      facts.push(`- la normale ${deMonth(f.month)} à ${f.city} (1991-2020) est de ${fmtTemp(f.normalMonth)} de ressenti maximal ;`)
    }
    if (f.trendSeason != null) {
      facts.push(`- en 30 ans, ${theSeason(f.season)} s'y est déjà réchauffé de ${fmtDeltaTemp(f.trendSeason)} en moyenne (années 1990 comparées à 2015-2024, réanalyse Copernicus ERA5) ;`)
    }
    if (f.proj2050?.central != null) {
      const range = f.proj2050.low != null && f.proj2050.high != null && f.proj2050.high - f.proj2050.low >= 0.1
        ? `, entre ${fmtDeltaTemp(f.proj2050.low)} et ${fmtDeltaTemp(f.proj2050.high)} selon les trajectoires d'émissions`
        : ""
      facts.push(`- d'ici 2050, ${theSeason(f.season)} pourrait y gagner encore ${fmtDeltaTemp(f.proj2050.central)} par rapport à 2000-2020 (scénario intermédiaire SSP2-4.5 des modèles du GIEC${range}).`)
    }
  }

  const where = f ? `à ${f.city}` : "dans ma commune"
  const figures = facts.length
    ? `Les données publiques rassemblées sur cestchaud.fr montrent que :\n${facts.join("\n")}`
    : "[Choisissez votre ville sur cestchaud.fr/citoyens pour ajouter ici ses chiffres : normale, tendance sur 30 ans et projection 2050.]"
  const stakes = f ? SEASON_STAKES[f.season] : SEASON_STAKES.hiver

  return `Madame la Sénatrice, Monsieur le Sénateur,

J'habite ${where} et je vous écris au sujet du changement climatique, qui se mesure déjà localement.

${figures}

${stakes}

Vous pouvez agir : adaptation des logements et des écoles, végétalisation et désimperméabilisation des villes, protection de la ressource en eau, accompagnement des agriculteurs, et réduction de nos émissions pour limiter la suite. Ces décisions se prennent maintenant.

Pourriez-vous m'indiquer quelles mesures vous soutenez sur ces sujets ?

Je vous prie d'agréer, Madame la Sénatrice, Monsieur le Sénateur, l'expression de ma considération distinguée.

[Votre prénom et votre nom]
[Votre commune]

Sources : Copernicus ERA5 (normales 1991-2020), GIEC AR6 / CMIP6 (projections), via cestchaud.fr${f ? ` (${MONTHS[f.month]})` : ""}.`
}
