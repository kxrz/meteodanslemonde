/**
 * Normales de nuits de gel 1991-2020 pour chaque ville française.
 * Pour chaque ville : minimales quotidiennes ERA5 (API archive Open-Meteo, 1991-01-01 → 2020-12-31),
 * puis nombre moyen de nuits sous 0 °C par mois sur 30 ans.
 * Sortie : data/frost-normals.json  { generatedAt, period, cities: { [cityId]: number[12] } }
 *
 * Une requête de 30 ans pèse lourd dans le quota Open-Meteo : villes traitées une par une,
 * pause entre deux villes, reprise sur 429. Une ville en échec garde sa valeur précédente si elle existe.
 * Usage : npx tsx scripts/fetch-frost-normals.ts  (workflow manuel .github/workflows/frost-normals.yml)
 */
import fs from "fs"
import path from "path"
import { frostNormalsFromDaily, type FrostNormalsFile } from "../lib/frost"

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

const START = "1991-01-01"
const END = "2020-12-31"
const PERIOD = "1991-2020"
// 30 ans × 1 variable ≈ 80 « appels » au sens du quota gratuit (600/min, 5 000/h) : ~15 s entre villes.
const DELAY_MS = API_KEY ? 1_000 : 15_000
const MAX_ATTEMPTS = 5

const DATA_DIR = path.join(process.cwd(), "data")
const OUTPUT_PATH = path.join(DATA_DIR, "frost-normals.json")

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchCityNormals(id: string, lat: number, lon: number): Promise<number[] | null> {
  const url =
    `https://${ARCHIVE_HOST}/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${START}&end_date=${END}` +
    `&daily=temperature_2m_min&timezone=Europe%2FParis` + API_SUFFIX

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })

      if (res.status === 429) {
        const wait = (parseInt(res.headers.get("Retry-After") ?? "", 10) || 60 * attempt) * 1000
        console.warn(`    [429] pause ${Math.round(wait / 1000)} s`)
        await sleep(wait)
        continue
      }

      const data = (await res.json()) as { error?: boolean; reason?: string; daily?: { time?: string[]; temperature_2m_min?: (number | null)[] } }
      if (!res.ok || data.error) throw new Error(data.reason ?? `HTTP ${res.status}`)

      const normals = frostNormalsFromDaily(data.daily?.time ?? [], data.daily?.temperature_2m_min ?? [])
      if (!normals) throw new Error("série incomplète")
      return normals
    } catch (err) {
      console.warn(`    [${id}] essai ${attempt}/${MAX_ATTEMPTS} : ${err instanceof Error ? err.message : String(err)}`)
      if (attempt < MAX_ATTEMPTS) await sleep(15_000 * attempt)
    }
  }
  return null
}

async function main() {
  const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"), "utf-8")) as { id: string; name: string; lat: number; lon: number }[]

  let previous: FrostNormalsFile["cities"] = {}
  try {
    previous = (JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) as FrostNormalsFile).cities ?? {}
  } catch { /* premier calcul */ }

  console.log(`Normales de gel ${PERIOD} pour ${cities.length} villes\n`)
  const out: FrostNormalsFile["cities"] = {}
  let ok = 0

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i]
    process.stdout.write(`[${i + 1}/${cities.length}] ${c.name}… `)
    const normals = await fetchCityNormals(c.id, c.lat, c.lon)
    if (normals) {
      out[c.id] = normals
      ok++
      console.log(`${normals.reduce((a, b) => a + b, 0).toFixed(1)} nuits/an`)
    } else if (previous[c.id]) {
      out[c.id] = previous[c.id]
      console.log("échec, valeur précédente conservée")
    } else {
      console.log("échec")
    }
    if (i < cities.length - 1) await sleep(DELAY_MS)
  }

  if (ok === 0) {
    console.error("Aucune ville calculée : fichier non modifié.")
    process.exit(1)
  }

  const file: FrostNormalsFile = { generatedAt: new Date().toISOString(), period: PERIOD, cities: out }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(file, null, 2) + "\n")
  console.log(`\n✓ ${ok}/${cities.length} villes calculées → ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error("Erreur fatale :", err)
  process.exit(1)
})
