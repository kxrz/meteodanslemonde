import type { Metadata } from "next"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import type { CityFR, CityWorld } from "@/lib/types"
import JeuClient from "./JeuClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Le jeu du jumeau climatique · cestchaud.fr",
  description: "Trouvez a quel pays ressemble votre ville francaise aujourd'hui. 5 questions basees sur les ressentis UTCI du jour. Vos resultats changent chaque jour.",
  metadataBase: new URL("https://www.cestchaud.fr"),
  alternates: { canonical: "https://www.cestchaud.fr/jeu" },
  openGraph: {
    title: "Le jeu du jumeau climatique · cestchaud.fr",
    description: "Bordeaux ressemble aujourd'hui a quelle ville du monde ? Testez vos connaissances climatiques en 5 questions.",
    url: "https://www.cestchaud.fr/jeu",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Le jeu du jumeau climatique · cestchaud.fr",
    description: "Bordeaux ressemble aujourd'hui a quelle ville du monde ? 5 questions, donnees du jour.",
  },
}

export type QuizQuestion = {
  cityFR: { name: string; region: string; apparentTempMax: number; anomaly: number | null; normal: number | null; monthName: string }
  correctCountry: string
  correctCity: string
  correctClimateLabel: string
  choices: string[]
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

const MONTH_NAMES = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]

export default async function JeuPage() {
  const [{ citiesFR, citiesWorld }, climateMap] = await Promise.all([
    getWeatherData(),
    Promise.resolve(loadClimateMap()),
  ])

  const month = new Date().getMonth()
  const monthName = MONTH_NAMES[month]

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
      cityFR: { name: city.name, region: city.region, apparentTempMax: city.apparent_temp_max, anomaly, normal, monthName },
      correctCountry: twin.country,
      correctCity: twin.name,
      correctClimateLabel: twin.climateLabel,
      choices,
    }
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": "Le jeu du jumeau climatique",
    "description": "Un quiz quotidien base sur les ressentis thermiques UTCI du jour en France. Trouvez a quel pays ressemble chaque ville francaise aujourd'hui.",
    "url": "https://www.cestchaud.fr/jeu",
    "inLanguage": "fr",
    "provider": {
      "@type": "Organization",
      "name": "cestchaud.fr",
      "url": "https://www.cestchaud.fr",
    },
    "educationalUse": "Self-assessment",
    "about": {
      "@type": "Thing",
      "name": "Jumeaux climatiques et anomalies thermiques en France",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JeuClient questions={questions} />
    </>
  )
}
