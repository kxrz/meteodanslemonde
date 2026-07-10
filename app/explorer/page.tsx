import type { Metadata } from "next"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import ExplorerClient from "./ExplorerClient"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Explorer les jumeaux climatiques · cestchaud.fr",
  description: "Votre ville française, vue du monde entier. Comparez le ressenti du jour avec des villes mondiales qui vivent déjà ce que nous vivrons demain.",
  alternates: { canonical: "https://www.cestchaud.fr/explorer" },
  openGraph: {
    title: "Jumeaux climatiques mondiaux · cestchaud.fr",
    description: "Cliquez une ville française et découvrez ses villes jumelles dans le monde — celles qui vivent aujourd'hui votre climat de demain.",
    url: "https://www.cestchaud.fr/explorer",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "https://www.cestchaud.fr/og/home.png", width: 1200, height: 630, alt: "Jumeaux climatiques · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jumeaux climatiques mondiaux · cestchaud.fr",
    description: "Cliquez une ville française et découvrez ses villes jumelles dans le monde.",
    images: ["https://www.cestchaud.fr/og/home.png"],
  },
}

export default async function ExplorerPage() {
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()
  return (
    <ExplorerClient
      citiesFR={citiesFR}
      citiesWorld={citiesWorld}
      fetchedAt={fetchedAt}
      climateMap={climateMap}
    />
  )
}
