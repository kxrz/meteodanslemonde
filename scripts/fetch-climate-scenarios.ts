/**
 * ONE-TIME SCRIPT — run during paid Open-Meteo subscription.
 * Collects CMIP6 projections for SSP2-4.5 and SSP5-8.5 with a multi-model ensemble.
 *
 * Output: data/climate-full.json
 * Structure per city:
 *   normal: number[]        ERA5 1991-2020 monthly apparent temp normals
 *   trend:  number[]        observed trend 1991-2000 vs 2015-2024
 *   ssp245: { proj2030, proj2040, proj2050 }   current trajectory
 *   ssp585: { proj2030, proj2040, proj2050 }   worst case
 *
 * Usage:  npm run fetch-climate-scenarios
 * Safe to interrupt and re-run — already-fetched cities are skipped.
 */
import fs from "fs"
import path from "path"

// Load .env.local if present (tsx doesn't auto-load it)
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [k, ...rest] = line.split("=")
    if (k?.trim() && !k.startsWith("#")) process.env[k.trim()] = rest.join("=").trim()
  }
}

const API_KEY  = process.env.OPEN_METEO_API_KEY ?? ""
const API_SUFFIX = API_KEY ? `&apikey=${API_KEY}` : ""

if (!API_KEY) console.warn("⚠ OPEN_METEO_API_KEY not set — running without auth (rate limits apply)")

const DATA_DIR    = path.join(process.cwd(), "data")
const OUTPUT_PATH = path.join(DATA_DIR, "climate-full.json")

const DELAY_BETWEEN_CALLS = 10_000   // between archive / each SSP call
const DELAY_BETWEEN_CITIES = 20_000  // between cities
const MAX_RETRIES = 6

// Models that reliably support each SSP in Open-Meteo Climate API
const SSP_MODELS: Record<string, string[]> = {
  ssp245: ["EC_Earth3P_HR", "MPI_ESM1_2_XR"],
  ssp585: ["EC_Earth3P_HR", "MPI_ESM1_2_XR", "MRI_AGCM3_2_S"],
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function round1(n: number | null) { return n != null ? Math.round(n * 10) / 10 : null }
function round0(n: number | null) { return n != null ? Math.round(n) : null }

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

async function safeJson(res: Response): Promise<unknown | null> {
  const text = await res.text().catch(() => "")
  try {
    return JSON.parse(text)
  } catch {
    console.warn(`    [json parse error] ${text.slice(0, 200)}`)
    return null
  }
}

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

// ─── fetch ERA5 normals + trend ───────────────────────────────────────────────

async function fetchNormals(city: { lat: number; lon: number }) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=1991-01-01&end_date=2024-12-31` +
    `&daily=temperature_2m_max,apparent_temperature_max&timezone=UTC` + API_SUFFIX

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [archive fail ${res.status}]`); return null }
  const data = await safeJson(res) as { daily?: Record<string, (number | null)[]> } | null
  if (!data?.daily) { console.warn(`    [archive] invalid response`); return null }

  const dates = data.daily.time as unknown as string[]
  const vals  = (data.daily.apparent_temperature_max ?? data.daily.temperature_2m_max) as (number | null)[]

  const normal: (number | null)[] = []
  const trend:  (number | null)[] = []
  for (let m = 1; m <= 12; m++) {
    normal.push(round0(monthAvg(dates, vals, m, 1991, 2020)))
    const base   = monthAvg(dates, vals, m, 1991, 2000)
    const recent = monthAvg(dates, vals, m, 2015, 2024)
    trend.push(base != null && recent != null ? round1(recent - base) : null)
  }
  return { normal, trend }
}

// ─── fetch one SSP scenario ───────────────────────────────────────────────────

async function fetchScenario(city: { lat: number; lon: number }, models: string[]) {
  const url =
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=2000-01-01&end_date=2050-12-31` +
    `&models=${models.join(",")}&daily=temperature_2m_max,apparent_temperature_max` + API_SUFFIX

  const res = await fetchWithRetry(url)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.warn(`    [climate fail ${res.status}] ${body.slice(0, 200)}`)
    return null
  }
  const data = await safeJson(res) as { daily?: Record<string, (number | null)[]>; error?: boolean; reason?: string } | null
  if (!data?.daily) {
    console.warn(`    [climate] invalid or empty response`)
    return null
  }

  const daily = data.daily
  const dates = daily.time as unknown as string[]
  console.log(`    [climate] ${dates?.length ?? 0} days, keys: ${Object.keys(daily).filter(k => k !== "time").join(", ")}`)

  const atKeys = Object.keys(daily).filter(k => k.startsWith("apparent_temperature_max") && k !== "time")
  const tKeys  = Object.keys(daily).filter(k => k.startsWith("temperature_2m_max") && k !== "time")
  const hasAtData = atKeys.some(k => (daily[k] as (number | null)[]).some(v => v != null))
  const keys = hasAtData ? atKeys : tKeys
  console.log(`    [climate] using ${hasAtData ? "apparent_temperature_max" : "temperature_2m_max"} (${keys.length} models)`)

  const proj2030: (number | null)[] = []
  const proj2040: (number | null)[] = []
  const proj2050: (number | null)[] = []

  for (let m = 1; m <= 12; m++) {
    const cb  = ensembleMonthAvg(dates, daily, keys, m, 2000, 2020)
    const c30 = ensembleMonthAvg(dates, daily, keys, m, 2021, 2039)
    const c40 = ensembleMonthAvg(dates, daily, keys, m, 2031, 2050)
    const c50 = ensembleMonthAvg(dates, daily, keys, m, 2041, 2050)
    proj2030.push(cb != null && c30 != null ? round1(c30 - cb) : null)
    proj2040.push(cb != null && c40 != null ? round1(c40 - cb) : null)
    proj2050.push(cb != null && c50 != null ? round1(c50 - cb) : null)
  }

  return { proj2030, proj2040, proj2050 }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const frCities  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"),    "utf-8")) as { id: string; lat: number; lon: number }[]
  const wldCities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-world.json"), "utf-8")) as { id: string; lat: number; lon: number }[]
  const allCities = [...frCities, ...wldCities]

  const existing: Record<string, unknown> = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"))
    : {}

  const output = { ...existing }
  const todo   = allCities.filter(c => !output[c.id])

  if (!todo.length) {
    console.log(`All ${allCities.length} cities already done.`)
    return
  }

  const skipped = allCities.length - todo.length
  if (skipped) console.log(`Resuming: ${skipped} done, ${todo.length} remaining`)

  const mins = Math.ceil(todo.length * (DELAY_BETWEEN_CALLS * 3 + DELAY_BETWEEN_CITIES) / 60_000)
  console.log(`~${mins} min estimated\n`)

  for (let i = 0; i < todo.length; i++) {
    const city = todo[i]
    console.log(`[${i + 1}/${todo.length}] ${city.id}`)

    console.log(`  → ERA5 normals`)
    const base = await fetchNormals(city)
    if (!base) { console.warn(`  ✗ skipped (archive failed)`); continue }
    await sleep(DELAY_BETWEEN_CALLS)

    const scenarios: Record<string, unknown> = {}
    for (const [ssp, models] of Object.entries(SSP_MODELS)) {
      console.log(`  → ${ssp}`)
      const s = await fetchScenario(city, models)
      if (s) scenarios[ssp] = s
      await sleep(DELAY_BETWEEN_CALLS)
    }

    output[city.id] = { ...base, ...scenarios }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output))
    console.log(`  ✓\n`)

    if (i < todo.length - 1) await sleep(DELAY_BETWEEN_CITIES)
  }

  console.log(`✓ Done — ${Object.keys(output).length} cities`)
  console.log(`  data/climate-full.json written`)
  console.log(`\nNext:`)
  console.log(`  git add data/climate-full.json && git commit -m "chore: climate-full complete" && git push`)
}

main().catch(e => { console.error(e); process.exit(1) })
