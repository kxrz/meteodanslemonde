import { Metadata } from "next"
import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import HeatMapClient from "./HeatMapClient"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Carte de chaleur · cestchaud.fr",
  description: "Anomalies de température en temps réel sur les grandes villes françaises. Où fait-il anormalement chaud aujourd'hui ?",
  alternates: { canonical: "https://www.cestchaud.fr/carte" },
  openGraph: {
    title: "Carte de chaleur — anomalies du jour · cestchaud.fr",
    description: "Visualisez où il fait anormalement chaud aujourd'hui en France. Données ERA5 / GIEC en temps réel.",
    url: "https://www.cestchaud.fr/carte",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/france.png", width: 1200, height: 630, alt: "Carte de chaleur France · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carte de chaleur — anomalies du jour · cestchaud.fr",
    description: "Visualisez où il fait anormalement chaud aujourd'hui en France. Données ERA5 / GIEC en temps réel.",
    images: ["/og/france.png"],
  },
}

export default async function CartePage() {
  const { citiesFR, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()

  const month = new Date(fetchedAt).getMonth() // 0-indexed

  const citiesWithAnomaly = citiesFR.map((city) => {
    const climate = climateMap[city.id]
    const normal = climate?.normal?.[month] ?? null
    const anomaly = normal !== null ? Math.round((city.apparent_temp_max - normal) * 10) / 10 : null
    return { ...city, normal, anomaly }
  })

  return (
    <HeatMapClient
      cities={citiesWithAnomaly}
      fetchedAt={fetchedAt}
      month={month}
    />
  )
}
