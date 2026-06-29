import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const CLIMATE_BATCH_SIZE = 5 // cities per archive/climate API call
const BATCH_DELAY_MS = 1000  // pause between batches to respect rate limits

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiDaily = { time: string[]; [key: string]: (number | null)[] | string[] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = { daily: ApiDaily; error?: boolean; reason?: string }

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
  if (!res.ok) throw new Error(`Open-Meteo weather error: ${res.status} ${await res.text()}`)
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

// Prefer apparent_temperature_max; fall back to temperature_2m_max per day
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
    const d = dates[i]
    const dash1 = d.indexOf("-")
    const dash2 = d.indexOf("-", dash1 + 1)
    if (dash1 < 0 || dash2 < 0) continue
    const y = +d.slice(0, dash1)
    const m = +d.slice(dash1 + 1, dash2)
    if (m === month && y >= y1 && y <= y2) vals.push(Number(v))
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeClimateEntry(
  cityId: string,
  arch: ApiResponse,
  clim: ApiResponse
): ClimateEntry | null {
  if (!arch?.daily?.time || !clim?.daily?.time) {
    console.warn(`  [skip] ${cityId}: missing daily.time`)
    return null
  }

  const ad = arch.daily.time as string[]
  const av = mergeValues(
    (arch.daily.apparent_temperature_max as (number | null)[]) ?? [],
    (arch.daily.temperature_2m_max as (number | null)[]) ?? []
  )
  const cd = clim.daily.time as string[]
  const cv = (clim.daily.temperature_2m_max as (number | null)[]) ?? []

  if (ad.length === 0 || cd.length === 0) {
    console.warn(`  [skip] ${cityId}: empty arrays arch=${ad.length} clim=${cd.length}`)
    return null
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

  const hasData = normal.some((v) => v !== null) || proj2030.some((v) => v !== null)
  if (!hasData) {
    console.warn(`  [skip] ${cityId}: all months null after computation`)
    return null
  }

  return { normal, trend, proj2030, proj2040, proj2050 }
}

async function fetchWithTimeout(url: string, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchClimateBatch(
  cities: Array<{ id: string; lat: number; lon: number }>,
  batchIndex: number,
  totalBatches: number
): Promise<Array<[string, ClimateEntry | null]>> {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")
  const ids = cities.map((c) => c.id).join(", ")

  console.log(`  Batch ${batchIndex + 1}/${totalBatches}: ${ids}`)

  let archData: unknown, climData: unknown
  try {
    const [archRes, climRes] = await Promise.all([
      fetchWithTimeout(
        `https://archive-api.open-meteo.com/v1/archive` +
        `?latitude=${lats}&longitude=${lons}` +
        `&start_date=1991-01-01&end_date=2024-12-31` +
        `&daily=temperature_2m_max,apparent_temperature_max` +
        `&timezone=UTC`
      ),
      fetchWithTimeout(
        `https://climate-api.open-meteo.com/v1/climate` +
        `?latitude=${lats}&longitude=${lons}` +
        `&start_date=2000-01-01&end_date=2050-12-31` +
        `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`
      ),
    ])

    if (!archRes.ok || !climRes.ok) {
      console.warn(`    HTTP error: arch=${archRes.status} clim=${climRes.status}`)
      // Retry the batch once after a delay
      await new Promise((r) => setTimeout(r, 3000))
      const [r2arch, r2clim] = await Promise.all([
        fetchWithTimeout(
          `https://archive-api.open-meteo.com/v1/archive` +
          `?latitude=${lats}&longitude=${lons}` +
          `&start_date=1991-01-01&end_date=2024-12-31` +
          `&daily=temperature_2m_max,apparent_temperature_max` +
          `&timezone=UTC`
        ),
        fetchWithTimeout(
          `https://climate-api.open-meteo.com/v1/climate` +
          `?latitude=${lats}&longitude=${lons}` +
          `&start_date=2000-01-01&end_date=2050-12-31` +
          `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`
        ),
      ])
      if (!r2arch.ok || !r2clim.ok) {
        console.warn(`    Retry failed: arch=${r2arch.status} clim=${r2clim.status}`)
        return cities.map((c) => [c.id, null])
      }
      archData = await r2arch.json()
      climData = await r2clim.json()
    } else {
      archData = await archRes.json()
      climData = await climRes.json()
    }
  } catch (err) {
    console.warn(`    Error: ${err instanceof Error ? err.message : String(err)}`)
    return cities.map((c) => [c.id, null])
  }

  const archList: ApiResponse[] = Array.isArray(archData)
    ? (archData as ApiResponse[])
    : [archData as ApiResponse]
  const climList: ApiResponse[] = Array.isArray(climData)
    ? (climData as ApiResponse[])
    : [climData as ApiResponse]

  return cities.map((city, idx) => {
    const entry = computeClimateEntry(city.id, archList[idx], climList[idx])
    return [city.id, entry]
  })
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

  // Climate data: batch cities to avoid rate limiting
  // archive-api and climate-api both support multi-location requests
  const allCities = [
    ...updatedFR.map((c) => ({ id: String(c.id), lat: c.lat as number, lon: c.lon as number })),
    ...updatedWorld.map((c) => ({ id: String(c.id), lat: c.lat as number, lon: c.lon as number })),
  ]

  const batches: Array<typeof allCities> = []
  for (let i = 0; i < allCities.length; i += CLIMATE_BATCH_SIZE) {
    batches.push(allCities.slice(i, i + CLIMATE_BATCH_SIZE))
  }

  console.log(
    `\nFetching climate for ${allCities.length} cities in ${batches.length} batches of ${CLIMATE_BATCH_SIZE}` +
    ` (${BATCH_DELAY_MS}ms between batches)…`
  )

  const climateMap: Record<string, ClimateEntry> = {}
  let ok = 0
  const failed: string[] = []

  for (let i = 0; i < batches.length; i++) {
    const results = await fetchClimateBatch(batches[i], i, batches.length)
    for (const [id, entry] of results) {
      if (entry) { climateMap[id] = entry; ok++ }
      else failed.push(id)
    }
    // Pause between batches to respect API rate limits
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`\n✓ Climate: ${ok}/${allCities.length} cities with data`)
  if (failed.length > 0) {
    console.warn(`  No data for: ${failed.join(", ")}`)
  }
  if (ok < allCities.length * 0.75) {
    console.error(
      `WARNING: Only ${ok}/${allCities.length} cities (${Math.round((ok / allCities.length) * 100)}%) have climate data!`
    )
  }

  fs.writeFileSync(path.join(DATA_DIR, "climate.json"), JSON.stringify(climateMap))
  const sizeKB = Math.round(JSON.stringify(climateMap).length / 1024)
  console.log(`✓ Wrote data/climate.json (${sizeKB} kB)`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
