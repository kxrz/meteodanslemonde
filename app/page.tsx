import { getWeatherData } from "@/lib/weather-data"
import ClientPage from "@/components/ClientPage"

export const revalidate = 86400

let climateMap: Record<string, unknown> = {}
try { climateMap = require("@/data/climate.json") } catch {}

export default async function Home() {
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  return <ClientPage citiesFR={citiesFR} citiesWorld={citiesWorld} fetchedAt={fetchedAt} climateMap={climateMap} />
}
