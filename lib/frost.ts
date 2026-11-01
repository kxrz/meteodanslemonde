// Nuits de gel : normales 1991-2020 (calculées par scripts/fetch-frost-normals.ts)
// et nuits attendues sur une période donnée.

import fs from "fs"
import path from "path"

/** Une nuit de gel : température minimale strictement sous 0 °C. */
export const FROST_THRESHOLD = 0

export interface FrostNormalsFile {
  generatedAt: string
  period: string
  /** cityId → nombre moyen de nuits de gel par mois (12 valeurs, janvier en premier) */
  cities: Record<string, number[]>
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

/**
 * Nombre moyen de nuits de gel par mois, à partir d'une série quotidienne de minimales.
 * Chaque couple (année, mois) présent dans la série compte pour une année ; les jours sans valeur sont ignorés.
 * Renvoie null si un mois n'a aucune donnée. Valeurs arrondies à 0,1.
 */
export function frostNormalsFromDaily(dates: string[], mins: (number | null)[]): number[] | null {
  // clé "AAAA-MM" → nuits de gel
  const buckets = new Map<string, number>()
  for (let i = 0; i < dates.length; i++) {
    const v = mins[i]
    if (v == null || Number.isNaN(v)) continue
    const key = dates[i].slice(0, 7)
    buckets.set(key, (buckets.get(key) ?? 0) + (v < FROST_THRESHOLD ? 1 : 0))
  }
  const sums = Array(12).fill(0)
  const years = Array(12).fill(0)
  for (const [key, count] of buckets) {
    const m = Number(key.slice(5, 7)) - 1
    sums[m] += count
    years[m] += 1
  }
  if (years.some((n) => n === 0)) return null
  return sums.map((s, m) => Math.round((s / years[m]) * 10) / 10)
}

/**
 * Nuits de gel attendues sur une liste de jours : chaque jour pèse normale du mois / nombre de jours du mois.
 * Pour « du 1er au 10 novembre », cela donne exactement normale de novembre × 10/30.
 */
export function expectedFrostNights(normals: number[], dates: string[]): number {
  let sum = 0
  for (const d of dates) {
    const y = Number(d.slice(0, 4))
    const m = Number(d.slice(5, 7)) - 1
    sum += (normals[m] ?? 0) / daysInMonth(y, m)
  }
  return Math.round(sum * 10) / 10
}

function isValidFile(x: unknown): x is FrostNormalsFile {
  if (!x || typeof x !== "object") return false
  const f = x as FrostNormalsFile
  return typeof f.cities === "object" && f.cities !== null &&
    Object.values(f.cities).every((v) => Array.isArray(v) && v.length === 12 && v.every((n) => typeof n === "number"))
}

/** Lit data/frost-normals.json. Renvoie null si le fichier n'existe pas encore (le site fonctionne sans). */
export function loadFrostNormals(): FrostNormalsFile | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "frost-normals.json"), "utf-8")
    const parsed: unknown = JSON.parse(raw)
    return isValidFile(parsed) ? parsed : null
  } catch {
    return null
  }
}
