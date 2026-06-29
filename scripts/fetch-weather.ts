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

interface ClimateEntry {
  normal: (number | null)[]
  trend: (number | null)[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
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

// Choose best non-null value: apparent temperature preferred, fall back to temperature
function mergeValues(
  apparentVals: (number | null | undefined)[],
  tempVals: (number | null | undefined)[]
): (number | null)[] {
  return apparentVals.map((av, i) => {
    const v = av !== null && av !== undefined && !isNaN(Number(av)) ? av : tempVals[i]
    return v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null
  })
}

function monthAvg(
  dates: string[],
  values: (number | null)[],
  month: number,
  y1: number,
  y2: number
): number | null {
  const vals: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const v = values[i]
    if (v === null || v === undefined || isNaN(Number(v))) continue
    const dash1 = dates[i].indexOf("-")
    const dash2 = dates[i].indexOf("-", dash1 + 1)
    if (dash1 < 0 || dash2 < 0) continue
    const y = +dates[i].slice(0, dash1)
    const m = +dates[i].slice(dash1 + 1, dash2)
    if (m === month && y >= y1 && y <= y2) vals.push(Number(v))
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

async function fetchWithTimeout(url: string, timeoutMs = 45000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchCityClimate(
  city: { id: string; lat: number; lon: number }
): Promise<[string, ClimateEntry | null]> {
  try {
    // Request both apparent_temperature_max AND temperature_2m_max from archive
    // apparent_temperature_max is preferred but may be null for coastal/island ERA5 cells
    const [archRes, climRes] = await Promise.all([
      fetchWithTimeout(
        `https://archive-api.open-meteo.com/v1/archive` +
        `?latitude=${city.lat}&longitude=${city.lon}` +
        `&start_date=1991-01-01&end_date=2024-12-31` +
        `&daily=temperature_2m_max,apparent_temperature_max` +
        `&timezone=UTC`
      ),
      fetchWithTimeout(
        `https://climate-api.open-meteo.com/v1/climate` +
        `?latitude=${city.lat}&longitude=${city.lon}` +
        `&start_date=2000-01-01&end_date=2050-12-31` +
        `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`
      ),
    ])

    if (!archRes.ok || !climRes.ok) {
      console.warn(`  [skip] ${city.id}: HTTP arch=${archRes.status} clim=${climRes.status}`)
      return [city.id, null]
    }

    const arch = await archRes.json()
    const clim = await climRes.json()

    // Defensive: check both APIs returned usable daily arrays
    if (!arch?.daily?.time || !clim?.daily?.time) {
      const archErr = arch?.error ? arch.reason : "no daily.time"
      const climErr = clim?.error ? clim.reason : "no daily.time"
      console.warn(`  [skip] ${city.id}: arch=${archErr} clim=${climErr}`)
      return [city.id, null]
    }

    const ad: string[] = arch.daily.time
    // Prefer apparent_temperature_max; fall back to temperature_2m_max per date
    const av: (number | null)[] = mergeValues(
      arch.daily.apparent_temperature_max ?? [],
      arch.daily.temperature_2m_max ?? []
    )
    const cd: string[] = clim.daily.time
    const cv: (number | null)[] = clim.daily.temperature_2m_max ?? []

    if (ad.length === 0 || cd.length === 0) {
      console.warn(`  [skip] ${city.id}: empty arrays arch=${ad.length} clim=${cd.length}`)
      return [city.id, null]
    }

    const normal: (number | null)[] = []
    const trend: (number | null)[] = []
    const proj2030: (number | null)[] = []
    const proj2040: (number | null)[] = []
    const proj2050: (number | null)[] = []

    for (let m = 1; m <= 12; m++) {
      const n = monthAvg(ad, av, m, 1991, 2020)
      normal.push(n !== null ? Math.round(n) : null)

      const base = monthAvg(ad, av, m, 1991, 2000)
      const recent = monthAvg(ad, av, m, 2015, 2024)
      trend.push(
        base !== null && recent !== null
          ? Math.round((recent - base) * 10) / 10
          : null
      )

      const cb = monthAvg(cd, cv, m, 2000, 2020)
      const c30 = monthAvg(cd, cv, m, 2028, 2032)
      const c40 = monthAvg(cd, cv, m, 2038, 2042)
      const c50 = monthAvg(cd, cv, m, 2048, 2050)

      proj2030.push(cb !== null && c30 !== null ? Math.round((c30 - cb) * 10) / 10 : null)
      proj2040.push(cb !== null && c40 !== null ? Math.round((c40 - cb) * 10) / 10 : null)
      proj2050.push(cb !== null && c50 !== null ? Math.round((c50 - cb) * 10) / 10 : null)
    }

    // Sanity check: at least one field populated for current month
    const hasAnyData = normal.some((v) => v !== null) ||
                       proj2030.some((v) => v !== null)
    if (!hasAnyData) {
      console.warn(`  [skip] ${city.id}: all months null after computation`)
      return [city.id, null]
    }

    return [city.id, { normal, trend, proj2030, proj2040, proj2050 }]
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [error] ${city.id}: ${msg}`)
    return [city.id, null]
  }
}

async function fetchCityClimateWithRetry(
  city: { id: string; lat: number; lon: number },
  retries = 3
): Promise<[string, ClimateEntry | null]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await fetchCityClimate(city)
    if (result[1] !== null) return result
    if (attempt < retries) {
      const delay = 2000 * Math.pow(2, attempt) // 2s, 4s, 8s
      console.warn(`  [retry ${attempt + 1}/${retries}] ${city.id} in ${delay}ms`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  return [city.id, null]
}

async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const j = i++
      results[j] = await tasks[j]()
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

async function main() {
  const frPath = path.join(DATA_DIR, "cities-fr.json")
  const worldPath = path.join(DATA_DIR, "cities-world.json")

  const citiesFR: CityBase[] = JSON.parse(fs.readFileSync(frPath, "utf-8"))
  const citiesWorld: CityBase[] = JSON.parse(fs.readFileSync(worldPath, "utf-8"))

  console.log(`Fetching weather for ${citiesFR.length} FR cities...`)
  const resultsFR = await fetchBatch(citiesFR)

  console.log(`Fetching weather for ${citiesWorld.length} world cities...`)
  const resultsWorld = await fetchBatch(citiesWorld)

  const fetchedAt = new Date().toISOString()
  const updatedFR = citiesFR.map((city, i) => applyWeather(city, resultsFR[i]))
  const updatedWorld = citiesWorld.map((city, i) => applyWeather(city, resultsWorld[i]))

  fs.writeFileSync(path.join(DATA_DIR, "meta.json"), JSON.stringify({ fetchedAt }, null, 2))
  fs.writeFileSync(frPath, JSON.stringify(updatedFR, null, 2))
  fs.writeFileSync(worldPath, JSON.stringify(updatedWorld, null, 2))

  const date = fetchedAt.split("T")[0]
  const time = fetchedAt.split("T")[1].slice(0, 5) + " UTC"
  console.log(`\n✓ Weather done — ${date} ${time}`)

  // Climate data: ERA5 archive + CMIP6 projections for all cities
  // Concurrency=8: conservative to avoid rate limiting on both APIs simultaneously
  const allCities = [
    ...updatedFR.map((c) => ({ id: String(c.id), lat: c.lat as number, lon: c.lon as number })),
    ...updatedWorld.map((c) => ({ id: String(c.id), lat: c.lat as number, lon: c.lon as number })),
  ]
  const total = allCities.length
  console.log(`\nFetching climate data for ${total} cities (concurrency=8, retries=3)…`)

  const climateTasks = allCities.map((city) => () => fetchCityClimateWithRetry(city))
  const climateResults = await runConcurrent(climateTasks, 8)

  const climateMap: Record<string, ClimateEntry> = {}
  let ok = 0
  const failed: string[] = []
  for (const [id, entry] of climateResults) {
    if (entry) { climateMap[id] = entry; ok++ }
    else { failed.push(id) }
  }

  console.log(`\n✓ Climate: ${ok}/${total} cities with data`)
  if (failed.length > 0) {
    console.warn(`  No data for: ${failed.join(", ")}`)
  }
  if (ok < total * 0.75) {
    console.error(`WARNING: Only ${ok}/${total} cities (${Math.round(ok/total*100)}%) have climate data!`)
  }

  fs.writeFileSync(path.join(DATA_DIR, "climate.json"), JSON.stringify(climateMap))
  const sizeKB = Math.round(JSON.stringify(climateMap).length / 1024)
  console.log(`✓ Wrote data/climate.json (${sizeKB} kB)`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
