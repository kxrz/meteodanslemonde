/**
 * Fetches, for the current year and each FR city, the highest and lowest daily apparent
 * temperature max (fields max/min, kept for compatibility) and the true lowest minimum
 * temperature (temperature_2m_min → minTempLow / minTempLowDate).
 * Output: data/year-extremes.json
 *
 * Run locally or via GitHub Actions (daily).
 * Usage: npm run fetch-year-extremes
 */
import fs from "fs"
import path from "path"
import { computeYearExtremes, type CityExtreme } from "../lib/year-extremes"

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [k, ...rest] = line.split("=")
    if (k?.trim() && !k.startsWith("#")) process.env[k.trim()] = rest.join("=").trim()
  }
}

const API_KEY = process.env.OPEN_METEO_API_KEY ?? ""
const API_SUFFIX = API_KEY ? `&apikey=${API_KEY}` : ""
const ARCHIVE_HOST = API_KEY ? "customer-archive-api.open-meteo.com" : "archive-api.open-meteo.com"
if (API_KEY) console.log("Open-Meteo API key detected — using premium endpoints")

const DATA_DIR = path.join(process.cwd(), "data")
const OUTPUT_PATH = path.join(DATA_DIR, "year-extremes.json")
const DELAY_MS = API_KEY ? 300 : 2000

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchCityExtremes(
  id: string,
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<CityExtreme | null> {
  const url =
    `https://${ARCHIVE_HOST}/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=apparent_temperature_max,temperature_2m_min&timezone=Europe%2FParis` + API_SUFFIX

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 30_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)

      if (res.status === 429) {
        const wait = parseInt(res.headers.get("Retry-After") ?? "60") * 1000
        console.warn(`    [429] waiting ${Math.round(wait / 1000)}s`)
        await sleep(wait)
        continue
      }

      const text = await res.text()
      let data: { daily?: { time?: string[]; apparent_temperature_max?: (number | null)[]; temperature_2m_min?: (number | null)[] } }
      try {
        data = JSON.parse(text)
      } catch {
        console.warn(`    [${id}] json parse error: ${text.slice(0, 100)}`)
        if (attempt < 3) { await sleep(15_000 * (attempt + 1)); continue }
        return null
      }

      const dates = data.daily?.time ?? []
      const values = data.daily?.apparent_temperature_max ?? []
      if (!dates.length) {
        console.warn(`    [${id}] empty response`)
        if (attempt < 3) { await sleep(15_000 * (attempt + 1)); continue }
        return null
      }

      const result = computeYearExtremes(dates, values, data.daily?.temperature_2m_min, new Date().toISOString())
      if (!result) {
        console.warn(`    [${id}] no valid values`)
        return null
      }
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`    [${id}] error: ${msg}`)
      if (attempt < 3) await sleep(10_000 * (attempt + 1))
    }
  }
  return null
}

async function main() {
  const cities = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"), "utf-8")
  ) as { id: string; name: string; lat: number; lon: number }[]

  const now = new Date()
  const year = now.getFullYear()
  const startDate = `${year}-01-01`
  // Archive API has ~5 day lag — use yesterday to be safe
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 2)
  const endDate = yesterday.toISOString().slice(0, 10)

  console.log(`Fetching year extremes for ${cities.length} cities (${startDate} → ${endDate})\n`)

  const output: Record<string, CityExtreme> = {}
  let ok = 0

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]
    process.stdout.write(`[${i + 1}/${cities.length}] ${city.name}... `)
    const result = await fetchCityExtremes(city.id, city.lat, city.lon, startDate, endDate)
    if (result) {
      output[city.id] = result
      ok++
      console.log(`max ${result.max}°C (${result.max_date}), min ${result.min}°C (${result.min_date}), vrai min ${result.minTempLow ?? "?"}°C (${result.minTempLowDate ?? "?"})`)
    } else {
      console.log(`✗ skipped`)
    }
    if (i < cities.length - 1) await sleep(DELAY_MS)
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`\n✓ ${ok}/${cities.length} cities — wrote ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
