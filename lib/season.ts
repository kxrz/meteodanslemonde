// Couche saisonnière : un seul endroit décide de ce qui change selon la période de l'année.
// Saisons météorologiques : hiver = déc-fév, printemps = mars-mai, été = juin-août, automne = sept-nov.

export type Season = "hiver" | "printemps" | "ete" | "automne"

export const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

/** « de janvier », « d'avril », « d'octobre », « d'août » */
export function deMonth(month: number): string {
  const m = MONTHS[month]
  return /^[aeiouyéèê]/i.test(m) ? `d'${m}` : `de ${m}`
}

export function seasonOf(month: number): Season {
  if (month === 11 || month <= 1) return "hiver"
  if (month <= 4) return "printemps"
  if (month <= 7) return "ete"
  return "automne"
}

/** Mois de la saison (index 0-11) */
export const SEASON_MONTHS: Record<Season, number[]> = {
  hiver: [11, 0, 1],
  printemps: [2, 3, 4],
  ete: [5, 6, 7],
  automne: [8, 9, 10],
}

export const SEASON_LABEL: Record<Season, string> = {
  hiver: "hiver",
  printemps: "printemps",
  ete: "été",
  automne: "automne",
}

/** Période froide au sens des signaux : on surveille le gel et les jours doux (nov → mars). */
export function isColdHalf(month: number): boolean {
  return month >= 10 || month <= 2
}

/** Période chaude au sens des signaux : nuits tropicales, canicule, anomalies thermiques (juin → sept). */
export function isHotSeason(month: number): boolean {
  return month >= 5 && month <= 8
}

export interface SeasonCopy {
  /** Complément du slogan « En vrai, c'est chaud. » */
  tagline: string
  /** Question d'accroche de l'accueil */
  question: string
}

export const SEASON_COPY: Record<Season, SeasonCopy> = {
  hiver: {
    tagline: "Même en hiver.",
    question: "Il fait froid, donc tout va bien ?",
  },
  printemps: {
    tagline: "Même au printemps.",
    question: "Un printemps précoce, c'est une bonne nouvelle ?",
  },
  ete: {
    tagline: "Et pas qu'un peu.",
    question: "Il fait vraiment chaud aujourd'hui ?",
  },
  automne: {
    tagline: "Même en automne.",
    question: "Un automne doux, c'est normal ?",
  },
}

export function seasonCopy(month: number): SeasonCopy {
  return SEASON_COPY[seasonOf(month)]
}

/** Moyenne d'un tableau mensuel sur les mois de la saison (null si incomplet). */
export function seasonalMean(values: (number | null | undefined)[] | undefined, season: Season): number | null {
  if (!values) return null
  const picked = SEASON_MONTHS[season].map((m) => values[m])
  if (picked.some((v) => v == null)) return null
  const mean = (picked as number[]).reduce((a, b) => a + b, 0) / picked.length
  return Math.round(mean * 10) / 10
}

/** Moyenne annuelle d'un tableau mensuel. */
export function annualMean(values: (number | null | undefined)[] | undefined): number | null {
  if (!values || values.length !== 12 || values.some((v) => v == null)) return null
  return Math.round(((values as number[]).reduce((a, b) => a + b, 0) / 12) * 10) / 10
}
