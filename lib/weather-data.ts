import citiesFRRaw from "@/data/cities-fr.json"
import citiesWorldRaw from "@/data/cities-world.json"
import { CityFR, CityWorld } from "./types"

type FRBase = { id: string; name: string; lat: number; lon: number; region: string }
type WorldBase = { id: string; name: string; country: string; lat: number; lon: number; climateProfile: string; climateLabel: string }

async function fetchBatch(cities: { lat: number; lon: number }[]) {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,apparent_temperature,weathercode,relative_humidity_2m,wind_speed_10m` +
    `&daily=temperature_2m_max,apparent_temperature_max,weathercode` +
    `&wind_speed_unit=kmh&forecast_days=1`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : [data]
}

function applyWeather<T>(base: T, r: { current: { temperature_2m: number; apparent_temperature: number; weathercode: number; relative_humidity_2m: number; wind_speed_10m: number }; daily: { temperature_2m_max: number[]; apparent_temperature_max: number[] } }): T & Pick<CityFR, "temp" | "apparent_temp" | "temp_max" | "apparent_temp_max" | "weathercode" | "humidity" | "wind"> {
  return {
    ...base,
    temp: Math.round(r.current.temperature_2m),
    apparent_temp: Math.round(r.current.apparent_temperature),
    temp_max: Math.round(r.daily.temperature_2m_max[0]),
    apparent_temp_max: Math.round(r.daily.apparent_temperature_max[0]),
    weathercode: r.current.weathercode,
    humidity: Math.round(r.current.relative_humidity_2m),
    wind: Math.round(r.current.wind_speed_10m),
  }
}

export async function getWeatherData() {
  const frBase = citiesFRRaw as FRBase[]
  const worldBase = citiesWorldRaw as WorldBase[]
  const [frResults, worldResults] = await Promise.all([fetchBatch(frBase), fetchBatch(worldBase)])
  return {
    citiesFR: frBase.map((c, i) => applyWeather(c, frResults[i]) as CityFR),
    citiesWorld: worldBase.map((c, i) => applyWeather(c, worldResults[i]) as CityWorld),
    fetchedAt: new Date().toISOString(),
  }
}
