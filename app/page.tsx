import { getWeatherData } from "@/lib/weather-data"
import { loadClimateMap } from "@/lib/climate"
import ClientPage from "@/components/ClientPage"

export const revalidate = 86400

export default async function Home() {
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  const climateMap = loadClimateMap()
  return <ClientPage citiesFR={citiesFR} citiesWorld={citiesWorld} fetchedAt={fetchedAt} climateMap={climateMap} />
}
