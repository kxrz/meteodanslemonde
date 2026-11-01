// Le jeu des jumeaux : 5 questions, valables toute l'année, générées de façon déterministe à partir d'une graine.
// Même graine (même jour) → mêmes questions pour tout le monde. Logique pure, testée dans __tests__/twins-game.test.ts.

import { isHotSeason } from "@/lib/season"

export interface GameCity {
  id: string
  name: string
  slug: string
  /** classement des villes du monde par écart moyen à son climat 2050 (lib/twins.ts → ranking) */
  ranking: { id: string; rmse: number }[]
  /** relevé du jour et normale du mois ; null si le relevé est indisponible */
  today: { temp: number; normal: number } | null
}

export interface GameWorldCity {
  id: string
  name: string
  country: string
}

export interface TwinChoice extends GameWorldCity {
  rmse: number
}

export interface TwinQuestion {
  kind: "twin"
  city: { id: string; name: string; slug: string }
  choices: TwinChoice[]
  answer: number
}

export interface AnomalyQuestion {
  kind: "anomaly"
  city: { id: string; name: string; slug: string }
  temp: number
  normal: number
  anomaly: number
  month: number
  choices: string[]
  answer: number
}

export type Question = TwinQuestion | AnomalyQuestion

/** Un distracteur doit être au moins à 2 °C d'écart moyen de plus que le bon jumeau : il ne peut pas être « juste aussi ». */
export const DISTRACTOR_MIN_GAP = 2
/** … et pas trop loin non plus, pour rester plausible (Singapour pour Lille ne fait réfléchir personne). */
const DISTRACTOR_MAX_GAP = 8

export const QUIZ_LENGTH = 5

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Graine du jour : 20261101 pour le 1er novembre 2026 (date UTC). */
export function daySeed(date: Date): number {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()
}

/** Libellés de la question « écart à la normale », justes en toute saison. */
export function anomalyChoices(month: number): string[] {
  const w = isHotSeason(month) ? "chaud" : "doux"
  return ["Plus froid que la normale", "Dans la normale", `Plus ${w} que la normale`, `Beaucoup plus ${w}`]
}

/** Catégorie de l'écart : < −1,5 plus froid · −1,5 à 1,5 normal · 1,5 à 4,5 plus doux · ≥ 4,5 beaucoup plus doux. */
export function anomalyCategory(anomaly: number): number {
  if (anomaly < -1.5) return 0
  if (anomaly <= 1.5) return 1
  if (anomaly < 4.5) return 2
  return 3
}

function twinQuestion(city: GameCity, world: Map<string, GameWorldCity>, rand: () => number): TwinQuestion | null {
  const [best, ...rest] = city.ranking
  const twin = best && world.get(best.id)
  if (!twin) return null
  const far = rest.filter((r) => r.rmse >= best.rmse + DISTRACTOR_MIN_GAP && world.has(r.id))
  const plausible = far.filter((r) => r.rmse <= best.rmse + DISTRACTOR_MAX_GAP)
  const pool = plausible.length >= 3 ? plausible : far
  if (pool.length < 3) return null
  const picked = shuffle(pool, rand).slice(0, 3)
  const choices = shuffle([best, ...picked], rand).map((r) => ({ ...world.get(r.id)!, rmse: r.rmse }))
  return {
    kind: "twin",
    city: { id: city.id, name: city.name, slug: city.slug },
    choices,
    answer: choices.findIndex((c) => c.id === twin.id),
  }
}

function anomalyQuestion(city: GameCity, month: number): AnomalyQuestion | null {
  if (!city.today) return null
  const anomaly = Math.round((city.today.temp - city.today.normal) * 10) / 10
  return {
    kind: "anomaly",
    city: { id: city.id, name: city.name, slug: city.slug },
    temp: city.today.temp,
    normal: city.today.normal,
    anomaly,
    month,
    choices: anomalyChoices(month),
    answer: anomalyCategory(anomaly),
  }
}

/**
 * Cinq questions : jumeau 2050 en 1, 3 et 5 ; écart du jour en 2 et 4 quand les relevés du jour existent.
 * Sans relevé (échec réseau), les cinq questions portent sur les jumeaux : le jeu reste jouable.
 * Chaque ville n'apparaît qu'une fois.
 */
export function buildQuiz(cities: GameCity[], world: GameWorldCity[], seed: number, month: number, length = QUIZ_LENGTH): Question[] {
  const rand = rng(seed)
  const worldMap = new Map(world.map((w) => [w.id, w]))
  const order = shuffle(cities, rand)
  const withToday = order.filter((c) => c.today != null)
  const used = new Set<string>()
  const questions: Question[] = []

  for (let i = 0; i < length; i++) {
    const wantAnomaly = i % 2 === 1 && withToday.some((c) => !used.has(c.id))
    const pool = wantAnomaly ? withToday : order
    for (const c of pool) {
      if (used.has(c.id)) continue
      const q = wantAnomaly ? anomalyQuestion(c, month) : twinQuestion(c, worldMap, rand)
      if (!q) continue
      used.add(c.id)
      questions.push(q)
      break
    }
  }
  return questions
}
