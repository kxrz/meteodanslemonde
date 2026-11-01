// Le chiffre qui accompagne chaque idée reçue (partage, légende TikTok / Instagram).
// Une phrase, un nombre, la ville choisie. null quand la donnée manque : on n'invente rien.

import type { Myth } from "@/lib/myths"
import { deMonth, MONTHS } from "@/lib/season"
import { fmtDeltaTemp, fmtTemp } from "@/lib/format"
import { expectedFrostSeason } from "@/lib/pedago"

export interface FactInput {
  cityName: string
  month: number
  trend: number | null
  shiftDays: number | null
  frost: number[] | null
  extremesMin: number | null
  aboveCount: number | null
  totalCities: number
  summer2050: number | null
}

export function mythFact(myth: Myth, d: FactInput): string | null {
  switch (myth.module) {
    case "breakdown":
      return d.trend != null ? `À ${d.cityName}, la normale ${deMonth(d.month)} a déjà pris ${fmtDeltaTemp(d.trend)} en 30 ans.` : null
    case "curve":
      if (d.shiftDays != null && Math.abs(d.shiftDays) >= 3) return `À ${d.cityName}, ${MONTHS[d.month]} a glissé de ${Math.abs(d.shiftDays)} jours en 30 ans.`
      return d.trend != null ? `À ${d.cityName}, ${MONTHS[d.month]} a pris ${fmtDeltaTemp(d.trend)} en 30 ans.` : null
    case "frost":
      return d.frost ? `À ${d.cityName}, on attend ${Math.round(expectedFrostSeason(d.frost))} nuits de gel par an en moyenne.` : null
    case "extremes":
      return d.extremesMin != null ? `À ${d.cityName}, la journée la plus froide de l'année n'a pas dépassé ${fmtTemp(d.extremesMin)} ressentis.` : null
    case "map":
      return d.aboveCount != null ? `Aujourd'hui, ${d.aboveCount} villes sur ${d.totalCities} sont au-dessus de la normale.` : null
    case "twins":
      return d.summer2050 != null ? `L'été 2050 à ${d.cityName} : ${fmtDeltaTemp(d.summer2050)} par rapport à aujourd'hui.` : null
    default:
      return null
  }
}

/** Légende courte et prête à coller : l'affirmation, puis la chute (le chiffre si on l'a, sinon la réponse). */
export function mythShareText(myth: Myth, fact: string | null): string {
  return `« ${myth.claim} » ${fact ? `En vrai : ${fact}` : myth.answer}`
}
