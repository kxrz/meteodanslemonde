// Logique pure de la pédagogie (idées reçues, atelier, mode projection).
// Aucune lecture de fichier ici : tout est testable (voir __tests__/pedago.test.ts).

import { MYTHS, mythsFor, type Myth } from "@/lib/myths"
import type { Season } from "@/lib/season"
import { slugify } from "@/lib/slugify"

export const DEFAULT_CITY = "paris"

/** Retrouve une ville à partir du paramètre `?ville=` (identifiant ou nom « slugifié »). Paris par défaut. */
export function resolveCitySlug<T extends { id: string; name: string }>(cities: T[], raw: string | string[] | undefined): T {
  const wanted = slugify(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "")
  return (
    cities.find((c) => c.id === wanted) ??
    cities.find((c) => slugify(c.name) === wanted) ??
    cities.find((c) => c.id === DEFAULT_CITY) ??
    cities[0]
  )
}

/** Découpe une réponse autour du passage à surligner. `highlight` absent du texte : une seule partie. */
export function splitHighlight(answer: string, highlight: string): { text: string; hl: boolean }[] {
  const i = highlight ? answer.indexOf(highlight) : -1
  if (i < 0) return [{ text: answer, hl: false }]
  return [
    { text: answer.slice(0, i), hl: false },
    { text: highlight, hl: true },
    { text: answer.slice(i + highlight.length), hl: false },
  ].filter((p) => p.text.length > 0)
}

/** Idées reçues dans l'ordre de la page : celles de la saison d'abord, puis les autres. */
export function mythsInPageOrder(season: Season): { current: Myth[]; others: Myth[] } {
  const current = mythsFor(season)
  return { current, others: MYTHS.filter((m) => !current.includes(m)) }
}

const NEXT_SEASON: Record<Season, Season> = { hiver: "printemps", printemps: "ete", ete: "automne", automne: "hiver" }

/**
 * Trois idées reçues pour l'atelier : celles de la saison, sans le jumeau 2050 (il a sa propre diapo),
 * complétées si besoin par celles de la saison suivante.
 */
export function workshopMyths(season: Season, count = 3): Myth[] {
  const picked: Myth[] = []
  for (const s of [season, NEXT_SEASON[season]]) {
    for (const m of mythsFor(s)) {
      if (picked.length >= count) break
      if (m.module !== "twins" && !picked.includes(m)) picked.push(m)
    }
  }
  return picked
}

// ── Nuits de gel ──

/** Début de la saison de gel : 1er août (le gel ne commence jamais avant). */
const FROST_SEASON_START = 7

/**
 * Nuits de gel attendues depuis le 1er août jusqu'à la date donnée (incluse), d'après les normales mensuelles.
 * Le mois en cours est compté au prorata des jours écoulés.
 */
export function expectedFrostToDate(monthly: number[], date: Date): number {
  if (monthly.length !== 12) return 0
  const month = date.getMonth()
  const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate()
  let total = 0
  for (let m = FROST_SEASON_START; m !== month; m = (m + 1) % 12) total += monthly[m] ?? 0
  total += (monthly[month] ?? 0) * (date.getDate() / daysInMonth)
  return Math.round(total * 10) / 10
}

/** Nuits de gel attendues sur une saison complète (août → juillet). */
export function expectedFrostSeason(monthly: number[]): number {
  return Math.round(monthly.reduce((a, b) => a + (b ?? 0), 0) * 10) / 10
}

// ── Mode projection ──

export type Deroule = "45" | "15"

export function parseDeroule(raw: string | string[] | undefined): Deroule {
  return (Array.isArray(raw) ? raw[0] : raw) === "15" ? "15" : "45"
}

export type SlideKind = "today" | "normal" | "breakdown" | "curve" | "myth" | "future" | "twin" | "act"

export interface SlideDef {
  kind: SlideKind
  /** index de l'idée reçue pour les diapos « myth » */
  myth?: number
  /** nombre d'étapes (révélations) de la diapo, 1 = aucune révélation */
  steps: number
}

/** Les diapos de chaque déroulé. `hasToday` : relevé du jour disponible (sinon on saute les révélations météo). */
export function deckFor(deroule: Deroule, hasToday: boolean): SlideDef[] {
  const all: SlideDef[] = [
    { kind: "today", steps: 2 },
    { kind: "normal", steps: hasToday ? 3 : 2 },
    { kind: "breakdown", steps: hasToday ? 3 : 2 },
    { kind: "curve", steps: 3 },
    { kind: "myth", myth: 0, steps: 3 },
    { kind: "myth", myth: 1, steps: 3 },
    { kind: "myth", myth: 2, steps: 3 },
    { kind: "future", steps: 2 },
    { kind: "twin", steps: 2 },
    { kind: "act", steps: 1 },
  ]
  if (deroule === "45") return all
  return [all[0], all[1], all[2], all[4], all[7], all[9]]
}

export interface DeckPos {
  slide: number
  step: number
}

/** « Suivant » : révèle d'abord l'étape suivante, puis passe à la diapo suivante. */
export function nextPos(deck: SlideDef[], pos: DeckPos): DeckPos {
  if (pos.step < deck[pos.slide].steps - 1) return { slide: pos.slide, step: pos.step + 1 }
  if (pos.slide < deck.length - 1) return { slide: pos.slide + 1, step: 0 }
  return pos
}

/** « Précédent » : recule d'une étape ; au début d'une diapo, revient à la précédente entièrement révélée. */
export function prevPos(deck: SlideDef[], pos: DeckPos): DeckPos {
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 }
  if (pos.slide > 0) return { slide: pos.slide - 1, step: deck[pos.slide - 1].steps - 1 }
  return pos
}

/** `#d3` → diapo d'index 2 (bornée au déroulé). Hash absent ou invalide : première diapo. */
export function slideFromHash(hash: string, count: number): number {
  const m = /^#?d(\d+)$/.exec(hash.trim())
  if (!m) return 0
  return Math.min(Math.max(Number(m[1]) - 1, 0), count - 1)
}
