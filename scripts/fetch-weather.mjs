import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const citiesFR = JSON.parse(readFileSync(join(root, "data/cities-fr.json"), "utf8"))
const citiesWorld = JSON.parse(readFileSync(join(root, "data/cities-world.json"), "utf8"))

async function fetchBatch(cities) {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,apparent_temperature,weathercode,relative_humidity_2m,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weathercode` +
    `&wind_speed_unit=kmh&forecast_days=1`

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Open-Meteo: ${res.status} — ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : [data]
}

function applyWeather(base, r) {
  return {
    ...base,
    temp: Math.round(r.current.temperature_2m),
    apparent_temp: Math.round(r.current.apparent_temperature),
    temp_max: Math.round(r.daily.temperature_2m_max[0]),
    temp_min: Math.round(r.daily.temperature_2m_min[0]),
    apparent_temp_max: Math.round(r.daily.apparent_temperature_max[0]),
    weathercode: r.current.weathercode,
    humidity: Math.round(r.current.relative_humidity_2m),
    wind: Math.round(r.current.wind_speed_10m),
  }
}

console.log(`Fetching weather for ${citiesFR.length} FR cities + ${citiesWorld.length} world cities…`)

const [frResults, worldResults] = await Promise.all([
  fetchBatch(citiesFR),
  fetchBatch(citiesWorld),
])

const cache = {
  fetchedAt: new Date().toISOString(),
  citiesFR: citiesFR.map((c, i) => applyWeather(c, frResults[i])),
  citiesWorld: citiesWorld.map((c, i) => applyWeather(c, worldResults[i])),
}

mkdirSync(join(root, "data"), { recursive: true })
writeFileSync(join(root, "data/weather-cache.json"), JSON.stringify(cache, null, 2))
console.log(`Weather cache written → data/weather-cache.json (fetched at ${cache.fetchedAt})`)
