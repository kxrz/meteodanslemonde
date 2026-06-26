import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

interface CityBase {
  id: string
  lat: number
  lon: number
  [key: string]: unknown
}

interface OpenMeteoResult {
  current: {
    temperature_2m: number
    apparent_temperature: number
    weathercode: number
    relative_humidity_2m: number
    wind_speed_10m: number
  }
  daily: {
    temperature_2m_max: number[]
    apparent_temperature_max: number[]
    weathercode: number[]
  }
}

async function fetchBatch(cities: CityBase[]): Promise<OpenMeteoResult[]> {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,apparent_temperature,weathercode,relative_humidity_2m,wind_speed_10m` +
    `&daily=temperature_2m_max,apparent_temperature_max,weathercode` +
    `&wind_speed_unit=kmh` +
    `&forecast_days=1`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return Array.isArray(data) ? data : [data]
}

function applyWeather(city: CityBase, r: OpenMeteoResult): CityBase {
  return {
    ...city,
    temp: Math.round(r.current.temperature_2m),
    apparent_temp: Math.round(r.current.apparent_temperature),
    temp_max: Math.round(r.daily.temperature_2m_max[0]),
    apparent_temp_max: Math.round(r.daily.apparent_temperature_max[0]),
    weathercode: r.current.weathercode,
    humidity: Math.round(r.current.relative_humidity_2m),
    wind: Math.round(r.current.wind_speed_10m),
  }
}

async function main() {
  const frPath = path.join(DATA_DIR, "cities-fr.json")
  const worldPath = path.join(DATA_DIR, "cities-world.json")

  const citiesFR: CityBase[] = JSON.parse(fs.readFileSync(frPath, "utf-8"))
  const citiesWorld: CityBase[] = JSON.parse(fs.readFileSync(worldPath, "utf-8"))

  console.log(`Fetching ${citiesFR.length} FR cities...`)
  const resultsFR = await fetchBatch(citiesFR)

  console.log(`Fetching ${citiesWorld.length} world cities...`)
  const resultsWorld = await fetchBatch(citiesWorld)

  const fetchedAt = new Date().toISOString()

  const updatedFR = citiesFR.map((city, i) => applyWeather(city, resultsFR[i]))
  const updatedWorld = citiesWorld.map((city, i) => applyWeather(city, resultsWorld[i]))

  const meta = { fetchedAt }
  fs.writeFileSync(path.join(DATA_DIR, "meta.json"), JSON.stringify(meta, null, 2))
  fs.writeFileSync(frPath, JSON.stringify(updatedFR, null, 2))
  fs.writeFileSync(worldPath, JSON.stringify(updatedWorld, null, 2))

  const date = fetchedAt.split("T")[0]
  const time = fetchedAt.split("T")[1].slice(0, 5) + " UTC"
  console.log(`\n✓ Done — ${date} ${time}`)
  console.log("\nFR cities (temp / max / feels like max):")
  updatedFR.forEach((c) =>
    console.log(`  ${String(c.id).padEnd(14)} ${c.temp}° / max ${c.temp_max}° / ressenti ${c.apparent_temp_max}°`)
  )
  console.log("\nWorld cities:")
  updatedWorld.forEach((c) =>
    console.log(`  ${String(c.id).padEnd(14)} ${c.temp}° / max ${c.temp_max}° / ressenti ${c.apparent_temp_max}°`)
  )
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
