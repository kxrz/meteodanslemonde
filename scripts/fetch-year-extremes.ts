/**
 * Fetches the apparent temperature max/min for the current year for each FR city.
 * Output: data/year-extremes.json
 *
 * Run locally or via GitHub Actions (daily).
 * Usage: npm run fetch-year-extremes
 */
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const OUTPUT_PATH = path.join(DATA_DIR, "year-extremes.json")
const DELAY_MS = 2000

interface CityExtreme {
  max: number
  max_date: string
  min: number
  min_date: string
  updated_at: string
}

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
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=apparent_temperature_max&timezone=Europe%2FParis`

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
      let data: { daily?: { time?: string[]; apparent_temperature_max?: (number | null)[] } }
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

      let max = -Infinity, min = Infinity
      let max_date = "", min_date = ""
      for (let i = 0; i < dates.length; i++) {
        const v = values[i]
        if (v == null) continue
        if (v > max) { max = v; max_date = dates[i] }
        if (v < min) { min = v; min_date = dates[i] }
      }

      if (!max_date || !min_date) {
        console.warn(`    [${id}] no valid values`)
        return null
      }

      return {
        max: Math.round(max),
        max_date,
        min: Math.round(min),
        min_date,
        updated_at: new Date().toISOString(),
      }
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
      console.log(`max ${result.max}°C (${result.max_date}), min ${result.min}°C (${result.min_date})`)
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
