/**
 * Run this script LOCALLY (not on Vercel) to generate data/climate.json.
 * Vercel's shared IP is rate-limited by Open-Meteo archive/climate APIs.
 *
 * Usage:  npm run fetch-climate
 * Then:   git add data/climate.json && git commit -m "chore: update climate data"
 *
 * Climate data changes rarely (CMIP6 projections are fixed; ERA5 normals
 * update once a year). Re-run whenever you add new cities.
 */
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 2000

interface ClimateEntry {
  normal: (number | null)[]
  trend: (number | null)[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
}

type ApiDaily = Record<string, string[] | (number | null)[]>
type ApiResponse = { daily?: ApiDaily; error?: boolean; reason?: string }

function mergeValues(
  apparent: (number | null | undefined)[],
  temp: (number | null | undefined)[]
): (number | null)[] {
  return apparent.map((av, i) => {
    const v = av != null && !isNaN(Number(av)) ? av : temp[i]
    return v != null && !isNaN(Number(v)) ? Number(v) : null
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
    if (v == null || isNaN(Number(v))) continue
    const d = dates[i]
    const d1 = d.indexOf("-")
    const d2 = d.indexOf("-", d1 + 1)
    if (d1 < 0 || d2 < 0) continue
    const y = +d.slice(0, d1)
    const m = +d.slice(d1 + 1, d2)
    if (m === month && y >= y1 && y <= y2) vals.push(Number(v))
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeEntry(id: string, arch: ApiResponse, clim: ApiResponse): ClimateEntry | null {
  if (!arch?.daily?.time || !clim?.daily?.time) {
    console.warn(`  [skip] ${id}: missing daily data`)
    return null
  }
  const ad = arch.daily.time as string[]
  const av = mergeValues(
    (arch.daily.apparent_temperature_max as (number | null)[]) ?? [],
    (arch.daily.temperature_2m_max as (number | null)[]) ?? []
  )
  const cd = clim.daily.time as string[]
  const cv = (clim.daily.temperature_2m_max as (number | null)[]) ?? []

  if (!ad.length || !cd.length) {
    console.warn(`  [skip] ${id}: empty arrays`)
    return null
  }

  const normal: (number | null)[] = []
  const trend: (number | null)[] = []
  const proj2030: (number | null)[] = []
  const proj2040: (number | null)[] = []
  const proj2050: (number | null)[] = []

  for (let m = 1; m <= 12; m++) {
    const n = monthAvg(ad, av, m, 1991, 2020)
    normal.push(n != null ? Math.round(n) : null)

    const base = monthAvg(ad, av, m, 1991, 2000)
    const recent = monthAvg(ad, av, m, 2015, 2024)
    trend.push(
      base != null && recent != null ? Math.round((recent - base) * 10) / 10 : null
    )

    const cb = monthAvg(cd, cv, m, 2000, 2020)
    const c30 = monthAvg(cd, cv, m, 2028, 2032)
    const c40 = monthAvg(cd, cv, m, 2038, 2042)
    const c50 = monthAvg(cd, cv, m, 2048, 2050)

    proj2030.push(cb != null && c30 != null ? Math.round((c30 - cb) * 10) / 10 : null)
    proj2040.push(cb != null && c40 != null ? Math.round((c40 - cb) * 10) / 10 : null)
    proj2050.push(cb != null && c50 != null ? Math.round((c50 - cb) * 10) / 10 : null)
  }

  if (!normal.some((v) => v != null) && !proj2030.some((v) => v != null)) {
    console.warn(`  [skip] ${id}: all values null`)
    return null
  }

  return { normal, trend, proj2030, proj2040, proj2050 }
}

async function fetchWithTimeout(url: string, ms = 60000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try { return await fetch(url, { signal: ctrl.signal }) }
  finally { clearTimeout(t) }
}

async function fetchBatch(
  cities: { id: string; lat: number; lon: number }[],
  attempt = 0
): Promise<[string, ClimateEntry | null][]> {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")

  let archData: unknown, climData: unknown
  try {
    const [archRes, climRes] = await Promise.all([
      fetchWithTimeout(
        `https://archive-api.open-meteo.com/v1/archive` +
        `?latitude=${lats}&longitude=${lons}` +
        `&start_date=1991-01-01&end_date=2024-12-31` +
        `&daily=temperature_2m_max,apparent_temperature_max&timezone=UTC`
      ),
      fetchWithTimeout(
        `https://climate-api.open-meteo.com/v1/climate` +
        `?latitude=${lats}&longitude=${lons}` +
        `&start_date=2000-01-01&end_date=2050-12-31` +
        `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`
      ),
    ])

    if (!archRes.ok || !climRes.ok) {
      if (attempt < 3) {
        const delay = 5000 * (attempt + 1)
        console.warn(`  [retry ${attempt + 1}/3] arch=${archRes.status} clim=${climRes.status} in ${delay}ms`)
        await new Promise((r) => setTimeout(r, delay))
        return fetchBatch(cities, attempt + 1)
      }
      console.warn(`  [fail] arch=${archRes.status} clim=${climRes.status}`)
      return cities.map((c) => [c.id, null])
    }

    archData = await archRes.json()
    climData = await climRes.json()
  } catch (err) {
    if (attempt < 3) {
      const delay = 5000 * (attempt + 1)
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  [retry ${attempt + 1}/3] error: ${msg} in ${delay}ms`)
      await new Promise((r) => setTimeout(r, delay))
      return fetchBatch(cities, attempt + 1)
    }
    console.warn(`  [fail] ${err instanceof Error ? err.message : err}`)
    return cities.map((c) => [c.id, null])
  }

  const archList = (Array.isArray(archData) ? archData : [archData]) as ApiResponse[]
  const climList = (Array.isArray(climData) ? climData : [climData]) as ApiResponse[]

  return cities.map((city, i) => [
    city.id,
    computeEntry(city.id, archList[i], climList[i]),
  ])
}

async function main() {
  const frPath = path.join(DATA_DIR, "cities-fr.json")
  const worldPath = path.join(DATA_DIR, "cities-world.json")
  const climatePath = path.join(DATA_DIR, "climate.json")

  const citiesFR = JSON.parse(fs.readFileSync(frPath, "utf-8")) as { id: string; lat: number; lon: number }[]
  const citiesWorld = JSON.parse(fs.readFileSync(worldPath, "utf-8")) as { id: string; lat: number; lon: number }[]
  const allCities = [
    ...citiesFR.map((c) => ({ id: c.id, lat: c.lat, lon: c.lon })),
    ...citiesWorld.map((c) => ({ id: c.id, lat: c.lat, lon: c.lon })),
  ]

  const batches: typeof allCities[] = []
  for (let i = 0; i < allCities.length; i += BATCH_SIZE) {
    batches.push(allCities.slice(i, i + BATCH_SIZE))
  }

  const estimatedSecs = Math.ceil(batches.length * (BATCH_DELAY_MS / 1000 + 3))
  console.log(
    `Fetching climate data for ${allCities.length} cities` +
    ` in ${batches.length} batches (estimated ~${estimatedSecs}s)\n`
  )

  const climateMap: Record<string, ClimateEntry> = {}
  let ok = 0
  const failed: string[] = []

  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i].map((c) => c.id).join(", ")
    process.stdout.write(`  [${i + 1}/${batches.length}] ${ids}... `)
    const results = await fetchBatch(batches[i])
    let batchOk = 0
    for (const [id, entry] of results) {
      if (entry) { climateMap[id] = entry; ok++; batchOk++ }
      else failed.push(id)
    }
    console.log(`${batchOk}/${results.length} ok`)
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`\n✓ Climate: ${ok}/${allCities.length} cities with data`)
  if (failed.length > 0) {
    console.warn(`  No data for: ${failed.join(", ")}`)
  }

  fs.writeFileSync(climatePath, JSON.stringify(climateMap))
  const sizeKB = Math.round(JSON.stringify(climateMap).length / 1024)
  console.log(`✓ Wrote ${climatePath} (${sizeKB} kB)`)
  console.log("\nNext step:")
  console.log("  git add data/climate.json && git commit -m 'chore: update climate data' && git push")
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
