import { getWeatherData } from "@/lib/weather-data"
import ClientPage from "@/components/ClientPage"

export const revalidate = 86400

export default async function Home() {
  const { citiesFR, citiesWorld, fetchedAt } = await getWeatherData()
  return <ClientPage citiesFR={citiesFR} citiesWorld={citiesWorld} fetchedAt={fetchedAt} />
}
