/**
 * ONE-TIME SCRIPT — run during paid Open-Meteo subscription.
 * Collects static/historical data that doesn't change:
 *   - Extended history since 1940: hot-day counts, records, decadal means
 *   - Multi-scenario climate projections: SSP1-2.6, SSP2-4.5, SSP5-8.5
 *   - Marine SST historical normals (coastal cities)
 *
 * Usage:  npm run fetch-paid-static
 * Output: data/history-stats.json, data/climate-full.json, data/marine-normals.json
 *
 * Safe to interrupt and re-run — already-fetched cities are skipped.
 */
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const HISTORY_PATH  = path.join(DATA_DIR, "history-stats.json")
const CLIMATE_PATH  = path.join(DATA_DIR, "climate-full.json")
const MARINE_PATH   = path.join(DATA_DIR, "marine-normals.json")

const DELAY_CALL  = 10_000   // between API calls within one city
const DELAY_CITY  = 20_000   // between cities
const MAX_RETRIES = 6

// SSP scenarios — models that reliably support each
const SSP_MODELS: Record<string, string[]> = {
  ssp126: ["EC_Earth3P_HR", "MPI_ESM1_2_XR"],
  ssp245: ["EC_Earth3P_HR", "MPI_ESM1_2_XR"],
  ssp585: ["EC_Earth3P_HR", "MPI_ESM1_2_XR", "MRI_AGCM3_2_S"],
}

const COASTAL_IDS = new Set([
  "marseille","bordeaux","nantes","nice","montpellier",
  "brest","bayonne","perpignan","toulon","la-rochelle",
])

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 60_000)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (res.status === 429) {
        const wait = parseInt(res.headers.get("Retry-After") ?? "0") * 1000 || 60_000 * (attempt + 1)
        console.warn(`    [429] waiting ${Math.round(wait / 1000)}s`)
        await sleep(wait)
        continue
      }
      return res
    } catch (err) {
      clearTimeout(t)
      lastErr = err instanceof Error ? err : new Error(String(err))
      await sleep(10_000 * (attempt + 1))
    }
  }
  throw lastErr ?? new Error("max retries")
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function monthAvg(
  dates: string[], values: (number | null)[],
  month: number, y1: number, y2: number
): number | null {
  const vals: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const v = values[i]; if (v == null) continue
    const [y, m] = dates[i].split("-").map(Number)
    if (m === month && y >= y1 && y <= y2) vals.push(v)
  }
  return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null
}

function ensembleMonthAvg(
  dates: string[],
  daily: Record<string, (number | null)[]>,
  modelKeys: string[],
  month: number, y1: number, y2: number
): number | null {
  const cols = modelKeys
    .map(k => monthAvg(dates, daily[k], month, y1, y2))
    .filter((v): v is number => v != null)
  return cols.length ? cols.reduce((a, b) => a + b) / cols.length : null
}

function round1(n: number | null) { return n != null ? Math.round(n * 10) / 10 : null }
function round0(n: number | null) { return n != null ? Math.round(n) : null }

// ─── history stats (ERA5 extended 1940-2024) ──────────────────────────────────

async function fetchHistoryStats(city: { id: string; lat: number; lon: number }) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=1940-01-01&end_date=2024-12-31` +
    `&daily=temperature_2m_max,apparent_temperature_max,precipitation_sum` +
    `&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [history fail ${res.status}]`); return null }
  const data = await res.json() as {
    daily: { time: string[]; temperature_2m_max: (number | null)[]; apparent_temperature_max: (number | null)[]; precipitation_sum: (number | null)[] }
  }

  const { time: dates, temperature_2m_max: tmax, apparent_temperature_max: atmax } = data.daily

  // annual hot-day counts
  const hotDays: Record<string, number>     = {}  // > 30°C
  const veryHotDays: Record<string, number> = {}  // > 35°C
  const extremeDays: Record<string, number> = {}  // > 40°C
  const annualMeans: Record<string, number[]> = {}

  let recordMax: number | null = null
  let recordMaxDate = ""
  let recordApparent: number | null = null
  let recordApparentDate = ""

  for (let i = 0; i < dates.length; i++) {
    const year = dates[i].slice(0, 4)
    const t = tmax[i]; const at = atmax[i]

    if (t != null) {
      hotDays[year]     = (hotDays[year]     ?? 0) + (t > 30 ? 1 : 0)
      veryHotDays[year] = (veryHotDays[year] ?? 0) + (t > 35 ? 1 : 0)
      extremeDays[year] = (extremeDays[year] ?? 0) + (t > 40 ? 1 : 0)
      ;(annualMeans[year] ??= []).push(t)
      if (recordMax == null || t > recordMax) { recordMax = t; recordMaxDate = dates[i] }
    }
    if (at != null && (recordApparent == null || at > recordApparent)) {
      recordApparent = at; recordApparentDate = dates[i]
    }
  }

  const annualMeanByYear: Record<string, number> = {}
  for (const [y, vals] of Object.entries(annualMeans)) {
    annualMeanByYear[y] = round1(vals.reduce((a, b) => a + b) / vals.length)!
  }

  // decadal means (hot days)
  const decades: Record<string, number[]> = {}
  for (const [y, v] of Object.entries(hotDays)) {
    const d = `${y.slice(0, 3)}0s`
    ;(decades[d] ??= []).push(v)
  }
  const hotDaysByDecade: Record<string, number> = {}
  for (const [d, vals] of Object.entries(decades)) {
    hotDaysByDecade[d] = round1(vals.reduce((a, b) => a + b) / vals.length)!
  }

  return {
    recordMax: round1(recordMax),
    recordMaxDate,
    recordApparent: round1(recordApparent),
    recordApparentDate,
    hotDaysPerYear: hotDays,
    veryHotDaysPerYear: veryHotDays,
    extremeDaysPerYear: extremeDays,
    annualMeanByYear,
    hotDaysByDecade,
  }
}

// ─── multi-scenario climate projections ───────────────────────────────────────

async function fetchClimateScenario(
  city: { lat: number; lon: number },
  scenario: string,
  models: string[]
) {
  const url =
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=2000-01-01&end_date=2050-12-31` +
    `&models=${models.join(",")}&daily=temperature_2m_max,apparent_temperature_max`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [climate ${scenario} fail ${res.status}]`); return null }
  const data = await res.json() as { daily: Record<string, (number | null)[]> }
  const daily = data.daily
  const dates = daily.time as unknown as string[]

  const tKeys  = Object.keys(daily).filter(k => k.startsWith("temperature_2m_max") && k !== "time")
  const atKeys = Object.keys(daily).filter(k => k.startsWith("apparent_temperature_max") && k !== "time")
  const keys   = atKeys.length ? atKeys : tKeys  // prefer apparent if available

  const proj2030: (number | null)[] = []
  const proj2040: (number | null)[] = []
  const proj2050: (number | null)[] = []

  for (let m = 1; m <= 12; m++) {
    const cb   = ensembleMonthAvg(dates, daily, keys, m, 2000, 2020)
    const c30  = ensembleMonthAvg(dates, daily, keys, m, 2021, 2039)
    const c40  = ensembleMonthAvg(dates, daily, keys, m, 2031, 2050)
    const c50  = ensembleMonthAvg(dates, daily, keys, m, 2041, 2050)
    proj2030.push(cb != null && c30 != null ? round1(c30 - cb) : null)
    proj2040.push(cb != null && c40 != null ? round1(c40 - cb) : null)
    proj2050.push(cb != null && c50 != null ? round1(c50 - cb) : null)
  }

  return { proj2030, proj2040, proj2050 }
}

async function fetchClimateAll(city: { id: string; lat: number; lon: number }) {
  // ERA5 normals + trend (same as existing climate.json)
  const archUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=1991-01-01&end_date=2024-12-31` +
    `&daily=temperature_2m_max,apparent_temperature_max&timezone=UTC`

  const archRes = await fetchWithRetry(archUrl)
  if (!archRes.ok) { console.warn(`    [archive fail ${archRes.status}]`); return null }
  const arch = await archRes.json() as { daily: Record<string, (number | null)[]> }
  const ad = arch.daily.time as unknown as string[]
  const av = (arch.daily.apparent_temperature_max ?? arch.daily.temperature_2m_max) as (number | null)[]

  const normal: (number | null)[] = []
  const trend:  (number | null)[] = []
  for (let m = 1; m <= 12; m++) {
    normal.push(round0(monthAvg(ad, av, m, 1991, 2020)))
    const base   = monthAvg(ad, av, m, 1991, 2000)
    const recent = monthAvg(ad, av, m, 2015, 2024)
    trend.push(base != null && recent != null ? round1(recent - base) : null)
  }

  const scenarios: Record<string, { proj2030: (number|null)[]; proj2040: (number|null)[]; proj2050: (number|null)[] } | null> = {}
  for (const [ssp, models] of Object.entries(SSP_MODELS)) {
    await sleep(DELAY_CALL)
    console.log(`      ${ssp}...`)
    scenarios[ssp] = await fetchClimateScenario(city, ssp, models)
  }

  return { normal, trend, ...scenarios }
}

// ─── marine SST normals ───────────────────────────────────────────────────────

async function fetchMarineNormals(city: { id: string; lat: number; lon: number }) {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&hourly=sea_surface_temperature` +
    `&start_date=1991-01-01&end_date=2020-12-31` +
    `&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [marine fail ${res.status}]`); return null }
  const data = await res.json() as { hourly?: { time: string[]; sea_surface_temperature: (number | null)[] } }
  if (!data.hourly?.time?.length) return null

  const { time: dates, sea_surface_temperature: sst } = data.hourly

  // monthly normals from hourly data
  const monthly: Record<string, number[]> = {}
  for (let i = 0; i < dates.length; i++) {
    const v = sst[i]; if (v == null) continue
    const m = dates[i].slice(5, 7)
    ;(monthly[m] ??= []).push(v)
  }

  const sstNormals = Array.from({ length: 12 }, (_, i) => {
    const key = String(i + 1).padStart(2, "0")
    const vals = monthly[key] ?? []
    return vals.length ? round1(vals.reduce((a, b) => a + b) / vals.length) : null
  })

  return { sstNormals }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const frCities  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"), "utf-8")) as { id: string; lat: number; lon: number }[]
  const wldCities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-world.json"), "utf-8")) as { id: string; lat: number; lon: number }[]
  const allCities = [...frCities, ...wldCities]

  const histExisting:   Record<string, unknown> = fs.existsSync(HISTORY_PATH)  ? JSON.parse(fs.readFileSync(HISTORY_PATH,  "utf-8")) : {}
  const climExisting:   Record<string, unknown> = fs.existsSync(CLIMATE_PATH)  ? JSON.parse(fs.readFileSync(CLIMATE_PATH,  "utf-8")) : {}
  const marineExisting: Record<string, unknown> = fs.existsSync(MARINE_PATH)   ? JSON.parse(fs.readFileSync(MARINE_PATH,   "utf-8")) : {}

  const histMap   = { ...histExisting }
  const climMap   = { ...climExisting }
  const marineMap = { ...marineExisting }

  const todoCities = allCities.filter(c =>
    !histMap[c.id] || !climMap[c.id] || (COASTAL_IDS.has(c.id) && !marineMap[c.id])
  )

  console.log(`${todoCities.length} cities to process (${allCities.length - todoCities.length} already done)\n`)

  for (let i = 0; i < todoCities.length; i++) {
    const city = todoCities[i]
    console.log(`[${i + 1}/${todoCities.length}] ${city.id}`)

    // History stats
    if (!histMap[city.id]) {
      console.log(`  → history stats (1940-2024)`)
      const h = await fetchHistoryStats(city)
      if (h) histMap[city.id] = h
      await sleep(DELAY_CALL)
    }

    // Multi-scenario climate
    if (!climMap[city.id]) {
      console.log(`  → climate projections (SSP 1-2.6 / 2-4.5 / 5-8.5)`)
      const c = await fetchClimateAll(city)
      if (c) climMap[city.id] = c
      await sleep(DELAY_CALL)
    }

    // Marine normals (coastal only)
    if (COASTAL_IDS.has(city.id) && !marineMap[city.id]) {
      console.log(`  → marine SST normals`)
      const m = await fetchMarineNormals(city)
      if (m) marineMap[city.id] = m
      await sleep(DELAY_CALL)
    }

    // Save after each city
    fs.writeFileSync(HISTORY_PATH,  JSON.stringify(histMap))
    fs.writeFileSync(CLIMATE_PATH,  JSON.stringify(climMap))
    fs.writeFileSync(MARINE_PATH,   JSON.stringify(marineMap))

    console.log(`  ✓ saved\n`)
    if (i < todoCities.length - 1) await sleep(DELAY_CITY)
  }

  console.log(`✓ Done.`)
  console.log(`  history-stats.json  : ${Object.keys(histMap).length} cities`)
  console.log(`  climate-full.json   : ${Object.keys(climMap).length} cities`)
  console.log(`  marine-normals.json : ${Object.keys(marineMap).length} coastal cities`)
  console.log(`\nNext: git add data/ && git commit -m "chore: paid static data" && git push`)
}

main().catch(e => { console.error(e); process.exit(1) })
