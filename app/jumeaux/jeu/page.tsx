import type { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import JeuClient from "@/components/twins/JeuClient"
import { getWeatherData } from "@/lib/weather-data"
import { CLIMATE, FR_CITIES, twinsOf, WORLD_CITIES } from "@/lib/twins-data"
import { daySeed, type GameCity } from "@/lib/twins-game"

const BASE = "https://www.cestchaud.fr"

export const metadata: Metadata = {
  title: "Le jeu des jumeaux 2050 · cestchaud.fr",
  description: "Cinq questions, une minute : quelle ville du monde vit déjà le climat de la vôtre en 2050 ? Et aujourd'hui, il fait plus doux que la normale ? Nouvelle série chaque jour.",
  alternates: { canonical: `${BASE}/jumeaux/jeu` },
  openGraph: {
    title: "Le jeu des jumeaux 2050 · cestchaud.fr",
    description: "Lille en 2050 ressemble à quelle ville du monde ? Cinq questions, une minute.",
    url: `${BASE}/jumeaux/jeu`,
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Le jeu des jumeaux 2050 · cestchaud.fr", description: "Cinq questions, une minute. Nouvelle série chaque jour." },
}

export default async function JeuPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const atelier = (await searchParams).mode === "atelier"
  const { citiesFR, fetchedAt } = await getWeatherData()
  const date = new Date(fetchedAt)
  const month = date.getMonth()
  // Relevés absents (échec réseau) : pas de questions sur la météo du jour, jamais de zéros
  const hasData = citiesFR.some((c) => c.apparent_temp_max !== 0 || c.temp_min !== 0)

  const cities: GameCity[] = FR_CITIES.flatMap((c) => {
    const res = twinsOf(c)
    if (!res) return []
    const w = citiesFR.find((x) => x.id === c.id)
    const normal = CLIMATE[c.id]?.normal?.[month]
    return [{
      id: c.id,
      name: c.name,
      slug: c.slug,
      ranking: res.ranking.map((r) => ({ id: r.id, rmse: Math.round(r.rmse * 100) / 100 })),
      today: hasData && w && normal != null ? { temp: w.apparent_temp_max, normal } : null,
    }]
  })
  const world = WORLD_CITIES.map((w) => ({ id: w.id, name: w.name, country: w.country }))

  return (
    <PageShell crumbs={[{ label: "Jumeaux 2050", href: "/jumeaux" }, { label: "Le jeu" }]} width={atelier ? "wide" : "text"}>
      <JeuClient cities={cities} world={world} seed={daySeed(date)} month={month} atelier={atelier} />
    </PageShell>
  )
}
