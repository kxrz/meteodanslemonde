/**
 * DAILY SCRIPT — run during paid Open-Meteo subscription.
 * Collects data that refreshes daily:
 *   - Air quality + pollen (toutes les villes FR)
 *   - Ensemble forecast p10/p50/p90 sur 15 jours (toutes les villes FR)
 *   - Seasonal forecast 6 mois (toutes les villes FR)
 *   - Marine SST actuelle (villes côtières)
 *
 * Usage:  npm run fetch-paid-dynamic
 * Output: data/air-quality.json, data/ensemble-forecast.json,
 *         data/seasonal.json, data/marine-current.json
 *
 * Intégrer dans le build Vercel en ajoutant au build command :
 *   npm run fetch-weather && npm run fetch-paid-dynamic && next build --webpack
 */
import fs from "fs"
import path from "path"

const DATA_DIR        = path.join(process.cwd(), "data")
const AQ_PATH         = path.join(DATA_DIR, "air-quality.json")
const ENSEMBLE_PATH   = path.join(DATA_DIR, "ensemble-forecast.json")
const SEASONAL_PATH   = path.join(DATA_DIR, "seasonal.json")
const MARINE_CUR_PATH = path.join(DATA_DIR, "marine-current.json")

const DELAY_CALL = 6_000
const DELAY_CITY = 12_000
const MAX_RETRIES = 5

const COASTAL_IDS = new Set([
  "marseille","bordeaux","nantes","nice","montpellier",
  "brest","bayonne","perpignan","toulon","la-rochelle",
])

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 30_000)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (res.status === 429) {
        const wait = parseInt(res.headers.get("Retry-After") ?? "0") * 1000 || 30_000 * (attempt + 1)
        console.warn(`    [429] waiting ${Math.round(wait / 1000)}s`)
        await sleep(wait)
        continue
      }
      return res
    } catch (err) {
      clearTimeout(t)
      lastErr = err instanceof Error ? err : new Error(String(err))
      await sleep(8_000 * (attempt + 1))
    }
  }
  throw lastErr ?? new Error("max retries")
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function round1(n: number | null | undefined) { return n != null ? Math.round(n * 10) / 10 : null }

function percentile(arr: number[], p: number) {
  if (!arr.length) return null
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return round1(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo))
}

// ─── air quality + pollen ─────────────────────────────────────────────────────

async function fetchAirQuality(city: { lat: number; lon: number }) {
  const today = new Date().toISOString().slice(0, 10)
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,` +
    `european_aqi,us_aqi,` +
    `alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
    `&forecast_days=1&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [AQ fail ${res.status}]`); return null }
  const data = await res.json() as { hourly: Record<string, (number | null)[]> }
  const h = data.hourly

  // daily max / mean from hourly values
  function dailyMax(arr: (number | null)[]) {
    const vals = arr.filter((v): v is number => v != null)
    return vals.length ? round1(Math.max(...vals)) : null
  }
  function dailyMean(arr: (number | null)[]) {
    const vals = arr.filter((v): v is number => v != null)
    return vals.length ? round1(vals.reduce((a, b) => a + b) / vals.length) : null
  }

  return {
    date: today,
    europeanAqi:  dailyMax(h.european_aqi),
    usAqi:        dailyMax(h.us_aqi),
    pm25:         dailyMean(h.pm2_5),
    pm10:         dailyMean(h.pm10),
    ozone:        dailyMax(h.ozone),
    no2:          dailyMax(h.nitrogen_dioxide),
    co:           dailyMax(h.carbon_monoxide),
    pollen: {
      alder:    dailyMax(h.alder_pollen),
      birch:    dailyMax(h.birch_pollen),
      grass:    dailyMax(h.grass_pollen),
      mugwort:  dailyMax(h.mugwort_pollen),
      olive:    dailyMax(h.olive_pollen),
      ragweed:  dailyMax(h.ragweed_pollen),
    },
  }
}

// ─── ensemble forecast (p10 / p50 / p90) ─────────────────────────────────────

async function fetchEnsemble(city: { lat: number; lon: number }) {
  const url =
    `https://ensemble-api.open-meteo.com/v1/ensemble` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&daily=temperature_2m_max,apparent_temperature_max,precipitation_sum` +
    `&models=ecmwf_ifs04` +
    `&forecast_days=15&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [ensemble fail ${res.status}]`); return null }
  const data = await res.json() as { daily: Record<string, (number | null)[]> }
  const daily = data.daily
  const dates = daily.time as unknown as string[]

  const tKeys  = Object.keys(daily).filter(k => k.startsWith("apparent_temperature_max") && k !== "time")
  const pKeys  = Object.keys(daily).filter(k => k.startsWith("precipitation_sum") && k !== "time")

  // per day: collect all member values → compute percentiles
  const p10: (number | null)[] = []
  const p50: (number | null)[] = []
  const p90: (number | null)[] = []
  const precipP50: (number | null)[] = []

  for (let d = 0; d < dates.length; d++) {
    const tVals = tKeys.map(k => daily[k][d]).filter((v): v is number => v != null)
    const pVals = pKeys.map(k => daily[k][d]).filter((v): v is number => v != null)
    p10.push(percentile(tVals, 10))
    p50.push(percentile(tVals, 50))
    p90.push(percentile(tVals, 90))
    precipP50.push(percentile(pVals, 50))
  }

  return { dates, p10, p50, p90, precipP50 }
}

// ─── seasonal forecast (6 months) ────────────────────────────────────────────

async function fetchSeasonal(city: { lat: number; lon: number }) {
  // Seasonal API returns monthly aggregates
  const url =
    `https://seasonal-api.open-meteo.com/v1/seasonal` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&monthly=temperature_2m_mean,precipitation_sum` +
    `&forecast_months=6&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [seasonal fail ${res.status}]`); return null }
  const data = await res.json() as { monthly?: Record<string, (number | null)[]> }
  if (!data.monthly?.time) return null

  const monthly = data.monthly
  const dates   = monthly.time as unknown as string[]

  // Average across ensemble members per variable
  const tKeys = Object.keys(monthly).filter(k => k.startsWith("temperature_2m_mean") && k !== "time")
  const pKeys = Object.keys(monthly).filter(k => k.startsWith("precipitation_sum") && k !== "time")

  const tempMean = dates.map((_, i) => {
    const vals = tKeys.map(k => monthly[k][i]).filter((v): v is number => v != null)
    return vals.length ? round1(vals.reduce((a, b) => a + b) / vals.length) : null
  })
  const precipMean = dates.map((_, i) => {
    const vals = pKeys.map(k => monthly[k][i]).filter((v): v is number => v != null)
    return vals.length ? round1(vals.reduce((a, b) => a + b) / vals.length) : null
  })

  return { months: dates, tempForecast: tempMean, precipForecast: precipMean }
}

// ─── marine SST current ───────────────────────────────────────────────────────

async function fetchMarineCurrent(city: { lat: number; lon: number }) {
  const today = new Date().toISOString().slice(0, 10)
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    `&hourly=sea_surface_temperature,wave_height,ocean_current_velocity` +
    `&forecast_days=1&timezone=UTC`

  const res = await fetchWithRetry(url)
  if (!res.ok) { console.warn(`    [marine fail ${res.status}]`); return null }
  const data = await res.json() as { hourly?: { sea_surface_temperature: (number | null)[], wave_height: (number | null)[] } }
  if (!data.hourly) return null

  const sstVals = data.hourly.sea_surface_temperature.filter((v): v is number => v != null)
  const waveVals = data.hourly.wave_height.filter((v): v is number => v != null)

  return {
    date: today,
    sst:       sstVals.length  ? round1(sstVals.reduce((a, b) => a + b)  / sstVals.length)  : null,
    waveHeight: waveVals.length ? round1(Math.max(...waveVals)) : null,
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const frCities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"), "utf-8")) as { id: string; lat: number; lon: number }[]

  const fetchedAt = new Date().toISOString()

  const aqMap:       Record<string, unknown> = {}
  const ensMap:      Record<string, unknown> = {}
  const seasonalMap: Record<string, unknown> = {}
  const marineCurMap: Record<string, unknown> = {}

  console.log(`Fetching dynamic data for ${frCities.length} French cities\n`)

  for (let i = 0; i < frCities.length; i++) {
    const city = frCities[i]
    console.log(`[${i + 1}/${frCities.length}] ${city.id}`)

    console.log(`  → air quality + pollen`)
    const aq = await fetchAirQuality(city)
    if (aq) aqMap[city.id] = aq
    await sleep(DELAY_CALL)

    console.log(`  → ensemble forecast 15j`)
    const ens = await fetchEnsemble(city)
    if (ens) ensMap[city.id] = ens
    await sleep(DELAY_CALL)

    console.log(`  → seasonal forecast 6 mois`)
    const seasonal = await fetchSeasonal(city)
    if (seasonal) seasonalMap[city.id] = seasonal
    await sleep(DELAY_CALL)

    if (COASTAL_IDS.has(city.id)) {
      console.log(`  → marine SST actuelle`)
      const marine = await fetchMarineCurrent(city)
      if (marine) marineCurMap[city.id] = marine
      await sleep(DELAY_CALL)
    }

    console.log(`  ✓\n`)
    if (i < frCities.length - 1) await sleep(DELAY_CITY)
  }

  fs.writeFileSync(AQ_PATH,         JSON.stringify({ fetchedAt, cities: aqMap }))
  fs.writeFileSync(ENSEMBLE_PATH,   JSON.stringify({ fetchedAt, cities: ensMap }))
  fs.writeFileSync(SEASONAL_PATH,   JSON.stringify({ fetchedAt, cities: seasonalMap }))
  fs.writeFileSync(MARINE_CUR_PATH, JSON.stringify({ fetchedAt, cities: marineCurMap }))

  console.log(`✓ Done — ${new Date().toLocaleTimeString()}`)
  console.log(`  air-quality.json       : ${Object.keys(aqMap).length} cities`)
  console.log(`  ensemble-forecast.json : ${Object.keys(ensMap).length} cities`)
  console.log(`  seasonal.json          : ${Object.keys(seasonalMap).length} cities`)
  console.log(`  marine-current.json    : ${Object.keys(marineCurMap).length} coastal cities`)
}

main().catch(e => { console.error(e); process.exit(1) })
