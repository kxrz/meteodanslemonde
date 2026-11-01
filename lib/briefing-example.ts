// Exemple de briefing affiché sur /notifications : construit avec les vraies normales,
// tendance et projections d'une ville, et un écart du jour fictif adapté à la saison.
// Il suit les mêmes règles que l'email réel (lib/email-builder.ts).

import { isColdHalf, isHotSeason, seasonOf } from "@/lib/season"
import { seasonalProjections, smoothedAt, type ClimateFull } from "@/lib/climate-season"
import type { CityEmailData } from "@/lib/email-builder"

export type ExampleKind = "froid" | "chaud" | "intersaison"

export function exampleKind(month: number): ExampleKind {
  if (isColdHalf(month)) return "froid"
  if (isHotSeason(month)) return "chaud"
  return "intersaison"
}

/** Écart fictif de l'exemple : assez net pour être parlant, jamais extrême. */
const EXAMPLE_DELTA: Record<ExampleKind, number> = { froid: 4, chaud: 5, intersaison: 3 }

export function briefingExample(slug: string, name: string, entry: ClimateFull | undefined, month: number): (CityEmailData & { kind: ExampleKind }) | null {
  const normal = entry?.normal?.[month]
  if (normal == null) return null
  const kind = exampleKind(month)
  const apparentTempMax = normal + EXAMPLE_DELTA[kind]
  return {
    kind,
    slug,
    name,
    apparentTempMax,
    normal,
    anomaly: EXAMPLE_DELTA[kind],
    trend: smoothedAt(entry?.trend, month),
    projection: seasonalProjections(entry, seasonOf(month)).find((p) => p.year === 2050) ?? null,
    // En saison froide, l'exemple montre une nuit de gel (bloc présent dans l'email réel)
    tempMin: kind === "froid" ? -1 : null,
    caniculeStreak: 0,
    climateTwin: null,
  }
}
