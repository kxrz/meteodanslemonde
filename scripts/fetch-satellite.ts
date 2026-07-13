/**
 * Génère les images satellite avant/après pour la page /terrain.
 * Utilise l'API Process de Copernicus Data Space (Sentinel-2 L2A, vraie couleur).
 *
 * Prérequis : COPERNICUS_CLIENT_ID et COPERNICUS_CLIENT_SECRET dans .env.local
 * Usage : npx tsx scripts/fetch-satellite.ts
 */

import * as fs from "fs"
import * as path from "path"

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
}

const CLIENT_ID = process.env.COPERNICUS_CLIENT_ID
const CLIENT_SECRET = process.env.COPERNICUS_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("COPERNICUS_CLIENT_ID et COPERNICUS_CLIENT_SECRET requis dans .env.local")
  process.exit(1)
}

const MIN_VALID_BYTES = 50_000

type DateRange = { from: string; to: string }

// Evalscript vraie couleur Sentinel-2, gain 3.5
const TRUE_COLOR = `//VERSION=3
function setup() { return { input: [{ bands: ["B04","B03","B02"] }], output: { bands: 3 } } }
function evaluatePixel(s) { return [3.5*s.B04, 3.5*s.B03, 3.5*s.B02] }`

// Evalscript fausses couleurs infrarouges : végétation = rouge vif, béton = cyan/gris
// Parfait pour montrer l'îlot de chaleur et la canopée
const FALSE_COLOR_URBAN = `//VERSION=3
function setup() { return { input: [{ bands: ["B08","B04","B03"] }], output: { bands: 3 } } }
function evaluatePixel(s) { return [2.5*s.B08, 2.5*s.B04, 2.5*s.B03] }`

const ZONES: Array<{
  id: string
  label: string
  bbox: number[]
  evalscript: string
  before: DateRange
  beforeFallbacks: DateRange[]
  after: DateRange
  afterFallbacks: DateRange[]
}> = [
  // ── Zones temporelles (avant/après événement) ───────────────────────────
  {
    id: "landes",
    label: "Les Landes — Incendies 2022",
    bbox: [-0.85, 44.55, -0.35, 44.85],
    evalscript: TRUE_COLOR,
    before: { from: "2021-07-01", to: "2021-08-31" },
    beforeFallbacks: [{ from: "2020-07-01", to: "2020-08-31" }],
    after:  { from: "2022-08-15", to: "2022-09-30" },
    afterFallbacks: [{ from: "2022-09-01", to: "2022-10-31" }],
  },
  {
    id: "serre-poncon",
    label: "Lac de Serre-Ponçon — Sécheresse 2022",
    bbox: [6.15, 44.42, 6.58, 44.72],
    evalscript: TRUE_COLOR,
    before: { from: "2019-08-01", to: "2019-09-30" },
    beforeFallbacks: [{ from: "2018-08-01", to: "2018-09-30" }],
    after:  { from: "2022-08-01", to: "2022-09-30" },
    afterFallbacks: [{ from: "2022-07-01", to: "2022-10-31" }],
  },
  {
    id: "mer-de-glace",
    label: "Mer de Glace — Recul glaciaire",
    bbox: [6.88, 45.86, 7.06, 45.98],
    evalscript: TRUE_COLOR,
    before: { from: "2016-08-01", to: "2016-09-15" },
    beforeFallbacks: [{ from: "2017-08-01", to: "2017-09-15" }],
    after:  { from: "2023-08-01", to: "2023-09-15" },
    afterFallbacks: [{ from: "2022-08-01", to: "2022-09-15" }],
  },
  {
    id: "loire",
    label: "Loire à Nevers — Étiage record 2022",
    bbox: [2.95, 46.95, 3.25, 47.15],
    evalscript: TRUE_COLOR,
    before: { from: "2019-08-01", to: "2019-09-30" },
    beforeFallbacks: [{ from: "2018-08-01", to: "2018-09-30" }],
    after:  { from: "2022-08-01", to: "2022-09-30" },
    afterFallbacks: [{ from: "2022-07-15", to: "2022-10-15" }],
  },

  // ── Zones urbaines (canopée vs béton, même date récente) ────────────────
  // "Avant" = quartier vert, "Après" = quartier béton — même période
  {
    id: "paris-bois",
    label: "Paris — Bois de Vincennes (canopée)",
    bbox: [2.41, 48.80, 2.48, 48.85],
    evalscript: FALSE_COLOR_URBAN,
    before: { from: "2023-07-01", to: "2023-08-31" },
    beforeFallbacks: [{ from: "2022-07-01", to: "2022-08-31" }],
    after:  { from: "2023-07-01", to: "2023-08-31" },
    afterFallbacks: [{ from: "2022-07-01", to: "2022-08-31" }],
  },
  {
    id: "paris-dalle",
    label: "Paris — La Défense (béton)",
    bbox: [2.22, 48.88, 2.27, 48.92],
    evalscript: FALSE_COLOR_URBAN,
    before: { from: "2023-07-01", to: "2023-08-31" },
    beforeFallbacks: [{ from: "2022-07-01", to: "2022-08-31" }],
    after:  { from: "2023-07-01", to: "2023-08-31" },
    afterFallbacks: [{ from: "2022-07-01", to: "2022-08-31" }],
  },
]

async function getToken(): Promise<string> {
  const res = await fetch(
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        grant_type: "client_credentials",
      }),
    }
  )
  if (!res.ok) throw new Error(`Token error ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function fetchImage(token: string, bbox: number[], timeRange: DateRange, evalscript: string): Promise<Buffer> {
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: {
          timeRange: { from: `${timeRange.from}T00:00:00Z`, to: `${timeRange.to}T23:59:59Z` },
          mosaickingOrder: "leastCC",
        },
      }],
    },
    output: {
      width: 1000,
      height: 700,
      responses: [{ identifier: "default", format: { type: "image/jpeg", quality: 92 } }],
    },
    evalscript,
  }

  const res = await fetch("https://sh.dataspace.copernicus.eu/api/v1/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Process API ${res.status}: ${text.slice(0, 300)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

async function fetchWithFallback(
  token: string,
  zone: typeof ZONES[0],
  key: "before" | "after"
): Promise<{ buffer: Buffer; usedRange: DateRange } | null> {
  const primary = zone[key]
  const fallbacks = zone[`${key}Fallbacks`]

  for (const range of [primary, ...fallbacks]) {
    process.stdout.write(`    ${key} ${range.from.slice(0, 7)} ... `)
    try {
      const buf = await fetchImage(token, zone.bbox, range, zone.evalscript)
      if (buf.length < MIN_VALID_BYTES) {
        console.log(`⚠  trop petit (${buf.length} bytes), essai suivant`)
        continue
      }
      console.log(`✓  ${Math.round(buf.length / 1024)} KB`)
      return { buffer: buf, usedRange: range }
    } catch (err) {
      console.log(`✗  ${err}`)
    }
  }
  return null
}

async function main() {
  console.log("Token Copernicus...")
  const token = await getToken()
  console.log("OK\n")

  const outDir = path.join(process.cwd(), "public/satellite")
  fs.mkdirSync(outDir, { recursive: true })

  const manifest: Record<string, {
    before: boolean; after: boolean
    beforeDate?: string; afterDate?: string
    label: string
  }> = {}

  for (const zone of ZONES) {
    console.log(`[${zone.id}] ${zone.label}`)
    manifest[zone.id] = { before: false, after: false, label: zone.label }

    for (const key of ["before", "after"] as const) {
      const result = await fetchWithFallback(token, zone, key)
      if (result) {
        fs.writeFileSync(path.join(outDir, `${zone.id}-${key}.jpg`), result.buffer)
        manifest[zone.id][key] = true
        manifest[zone.id][`${key}Date`] = result.usedRange.from.slice(0, 7)
      } else {
        console.log(`    ✗ aucune image valide — ignoré dans le front`)
      }
    }
    console.log()
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2))
  console.log("manifest.json écrit.")
  console.log("\nCommite public/satellite/ pour déployer.")
}

main().catch((e) => { console.error(e); process.exit(1) })
