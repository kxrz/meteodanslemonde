/**
 * Run LOCALLY to generate data/climate.json. Vercel's IP is rate-limited by Open-Meteo.
 *
 * Usage:  npm run fetch-climate
 * Then:   git add data/climate.json && git commit -m "chore: update climate data" && git push
 *
 * The script saves progress after every batch — safe to interrupt and re-run.
 * Already-fetched cities are skipped automatically.
 */
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const CLIMATE_PATH = path.join(DATA_DIR, "climate.json")
const BATCH_SIZE = 3          // fewer cities per batch = smaller responses
const BETWEEN_CALLS_MS = 4000 // pause between archive call and climate call
const BETWEEN_BATCHES_MS = 6000 // pause between batches

interface ClimateEntry {
  normal: (number | null)[]
  trend: (number | null)[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
}

type ApiResponse = {
  daily?: Record<string, string[] | (number | null)[]>
  error?: boolean
  reason?: string
}

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
  dates: string[], values: (number | null)[],
  month: number, y1: number, y2: number
): number | null {
  const vals: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const v = values[i]
    if (v == null || isNaN(Number(v))) continue
    const d = dates[i]; const d1 = d.indexOf("-"); const d2 = d.indexOf("-", d1 + 1)
    if (d1 < 0 || d2 < 0) continue
    const y = +d.slice(0, d1); const m = +d.slice(d1 + 1, d2)
    if (m === month && y >= y1 && y <= y2) vals.push(Number(v))
  }
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeEntry(id: string, arch: ApiResponse, clim: ApiResponse): ClimateEntry | null {
  if (!arch?.daily?.time || !clim?.daily?.time) return null
  const ad = arch.daily.time as string[]
  const av = mergeValues(
    (arch.daily.apparent_temperature_max as (number | null)[]) ?? [],
    (arch.daily.temperature_2m_max as (number | null)[]) ?? []
  )
  const cd = clim.daily.time as string[]
  const cv = (clim.daily.temperature_2m_max as (number | null)[]) ?? []
  if (!ad.length || !cd.length) return null

  const normal: (number | null)[] = [], trend: (number | null)[] = []
  const proj2030: (number | null)[] = [], proj2040: (number | null)[] = [], proj2050: (number | null)[] = []

  for (let m = 1; m <= 12; m++) {
    const n = monthAvg(ad, av, m, 1991, 2020)
    normal.push(n != null ? Math.round(n) : null)
    const base = monthAvg(ad, av, m, 1991, 2000)
    const recent = monthAvg(ad, av, m, 2015, 2024)
    trend.push(base != null && recent != null ? Math.round((recent - base) * 10) / 10 : null)
    const cb = monthAvg(cd, cv, m, 2000, 2020)
    const c30 = monthAvg(cd, cv, m, 2028, 2032)
    const c40 = monthAvg(cd, cv, m, 2038, 2042)
    const c50 = monthAvg(cd, cv, m, 2048, 2050)
    proj2030.push(cb != null && c30 != null ? Math.round((c30 - cb) * 10) / 10 : null)
    proj2040.push(cb != null && c40 != null ? Math.round((c40 - cb) * 10) / 10 : null)
    proj2050.push(cb != null && c50 != null ? Math.round((c50 - cb) * 10) / 10 : null)
  }

  if (!normal.some((v) => v != null) && !proj2030.some((v) => v != null)) {
    console.warn(`    [skip] ${id}: all values null`)
    return null
  }
  return { normal, trend, proj2030, proj2040, proj2050 }
}

async function fetchOne(url: string, maxRetries = 4): Promise<Response> {
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 60000)
    let res: Response
    try {
      res = await fetch(url, { signal: ctrl.signal })
    } catch (err) {
      clearTimeout(t)
      lastErr = err instanceof Error ? err : new Error(String(err))
      const delay = 10000 * (attempt + 1)
      console.warn(`    [network error, retry in ${delay / 1000}s] ${lastErr.message}`)
      await new Promise((r) => setTimeout(r, delay))
      continue
    }
    clearTimeout(t)

    if (res.status === 429) {
      // Respect Retry-After if present, otherwise back off progressively
      const retryAfter = res.headers.get("Retry-After")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 15000 * (attempt + 1)
      console.warn(`    [429, waiting ${Math.round(delay / 1000)}s]`)
      await new Promise((r) => setTimeout(r, delay))
      continue
    }
    return res
  }
  throw lastErr ?? new Error("Max retries exceeded")
}

async function fetchClimateBatch(
  cities: { id: string; lat: number; lon: number }[]
): Promise<[string, ClimateEntry | null][]> {
  const lats = cities.map((c) => c.lat).join(",")
  const lons = cities.map((c) => c.lon).join(",")

  // Sequential: archive first, then pause, then climate
  // Avoids hammering two different rate-limited endpoints simultaneously
  const archRes = await fetchOne(
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lats}&longitude=${lons}` +
    `&start_date=1991-01-01&end_date=2024-12-31` +
    `&daily=temperature_2m_max,apparent_temperature_max&timezone=UTC`
  )
  if (!archRes.ok) {
    console.warn(`    [fail] archive HTTP ${archRes.status}`)
    return cities.map((c) => [c.id, null])
  }
  const archData = await archRes.json()

  await new Promise((r) => setTimeout(r, BETWEEN_CALLS_MS))

  const climRes = await fetchOne(
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${lats}&longitude=${lons}` +
    `&start_date=2000-01-01&end_date=2050-12-31` +
    `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`
  )
  if (!climRes.ok) {
    console.warn(`    [fail] climate HTTP ${climRes.status}`)
    return cities.map((c) => [c.id, null])
  }
  const climData = await climRes.json()

  const archList = (Array.isArray(archData) ? archData : [archData]) as ApiResponse[]
  const climList = (Array.isArray(climData) ? climData : [climData]) as ApiResponse[]

  return cities.map((city, i) => [city.id, computeEntry(city.id, archList[i], climList[i])])
}

async function main() {
  const frPath = path.join(DATA_DIR, "cities-fr.json")
  const worldPath = path.join(DATA_DIR, "cities-world.json")

  const allCities = [
    ...(JSON.parse(fs.readFileSync(frPath, "utf-8")) as { id: string; lat: number; lon: number }[]),
    ...(JSON.parse(fs.readFileSync(worldPath, "utf-8")) as { id: string; lat: number; lon: number }[]),
  ].map((c) => ({ id: c.id, lat: c.lat, lon: c.lon }))

  // Load existing data — skip already-fetched cities
  const existing: Record<string, ClimateEntry> = fs.existsSync(CLIMATE_PATH)
    ? JSON.parse(fs.readFileSync(CLIMATE_PATH, "utf-8"))
    : {}

  const todo = allCities.filter((c) => !existing[c.id])

  if (todo.length === 0) {
    console.log(`All ${allCities.length} cities already have climate data. Nothing to do.`)
    return
  }

  const skipped = allCities.length - todo.length
  if (skipped > 0) console.log(`Resuming: ${skipped} cities already done, ${todo.length} remaining.`)

  const batches: typeof todo[] = []
  for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE))

  const totalSecs = Math.ceil(batches.length * ((BETWEEN_CALLS_MS + BETWEEN_BATCHES_MS) / 1000 + 6))
  console.log(`Fetching ${todo.length} cities in ${batches.length} batches (~${totalSecs}s estimated)\n`)

  const climateMap = { ...existing }
  let ok = Object.keys(existing).length
  const failed: string[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const ids = batch.map((c) => c.id).join(", ")
    process.stdout.write(`  [${i + 1}/${batches.length}] ${ids}... `)

    const results = await fetchClimateBatch(batch)
    let batchOk = 0
    for (const [id, entry] of results) {
      if (entry) { climateMap[id] = entry; ok++; batchOk++ }
      else failed.push(id)
    }
    console.log(`${batchOk}/${results.length} ok`)

    // Save after every batch so progress isn't lost on interruption
    fs.writeFileSync(CLIMATE_PATH, JSON.stringify(climateMap))

    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, BETWEEN_BATCHES_MS))
    }
  }

  const total = allCities.length
  console.log(`\n✓ Climate: ${ok}/${total} cities with data`)
  if (failed.length > 0) console.warn(`  No data for: ${failed.join(", ")}`)

  const sizeKB = Math.round(fs.statSync(CLIMATE_PATH).size / 1024)
  console.log(`✓ Wrote ${CLIMATE_PATH} (${sizeKB} kB)`)
  if (ok < total) {
    console.log(`\nTip: re-run 'npm run fetch-climate' to retry the ${failed.length} failed cities.`)
  } else {
    console.log("\nNext step:")
    console.log("  git add data/climate.json && git commit -m 'chore: update climate data' && git push")
  }
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
