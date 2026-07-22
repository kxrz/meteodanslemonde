import type { Metadata } from "next"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import type { CityFR, CityWorld } from "@/lib/types"
import JeuClient from "./JeuClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Jumeau climatique · Le jeu · cestchaud.fr",
  description: "Trouvez a quel pays ressemble votre ville aujourd'hui. Un quiz base sur les donnees meteorologiques du jour.",
  robots: "noindex",
}

export type QuizQuestion = {
  cityFR: { name: string; region: string; apparentTempMax: number; anomaly: number | null }
  correctCountry: string
  correctCity: string
  choices: string[] // 4 pays dont 1 correct
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function findTwin(frTemp: number, world: CityWorld[]): CityWorld | null {
  const pool = world
    .map((c) => ({ ...c, diff: Math.abs(c.apparent_temp_max - frTemp) }))
    .filter((c) => c.diff <= 5)
    .sort((a, b) => a.diff - b.diff)
  return pool[0] ?? null
}

function pickDisctractors(correct: string, world: CityWorld[], n: number): string[] {
  const countries = [...new Set(world.map((c) => c.country))].filter((c) => c !== correct)
  return shuffle(countries).slice(0, n)
}

export default async function JeuPage() {
  const [{ citiesFR, citiesWorld }, climateMap] = await Promise.all([
    getWeatherData(),
    Promise.resolve(loadClimateMap()),
  ])

  const month = new Date().getMonth()

  // Villes FR avec un jumeau monde clair
  const candidates = citiesFR.filter((c) => {
    const twin = findTwin(c.apparent_temp_max, citiesWorld)
    return twin !== null && c.apparent_temp_max > 15
  })

  const picked = shuffle(candidates).slice(0, 5)

  const questions: QuizQuestion[] = picked.map((city: CityFR) => {
    const twin = findTwin(city.apparent_temp_max, citiesWorld)!
    const climate = climateMap[city.id]
    const normal = climate?.normal?.[month] ?? null
    const anomaly = normal !== null ? Math.round((city.apparent_temp_max - normal) * 10) / 10 : null

    const distractors = pickDisctractors(twin.country, citiesWorld, 3)
    const choices = shuffle([twin.country, ...distractors])

    return {
      cityFR: { name: city.name, region: city.region, apparentTempMax: city.apparent_temp_max, anomaly },
      correctCountry: twin.country,
      correctCity: twin.name,
      choices,
    }
  })

  return <JeuClient questions={questions} />
}
