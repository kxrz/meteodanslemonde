import citiesFRRaw from "@/data/cities-fr.json"
import citiesWorldRaw from "@/data/cities-world.json"
import metaRaw from "@/data/meta.json"
import { CityFR, CityWorld, ClimateMap } from "@/lib/types"
import ClientPage from "@/components/ClientPage"

export const revalidate = 86400

export default function Home() {
  const citiesFR = citiesFRRaw as CityFR[]
  const citiesWorld = citiesWorldRaw as CityWorld[]
  const fetchedAt = (metaRaw as { fetchedAt: string }).fetchedAt

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let climateMap: ClimateMap = {}
  try { climateMap = require("@/data/climate.json") as ClimateMap } catch { /* generated at build time */ }

  return <ClientPage citiesFR={citiesFR} citiesWorld={citiesWorld} fetchedAt={fetchedAt} climateMap={climateMap} />
}
