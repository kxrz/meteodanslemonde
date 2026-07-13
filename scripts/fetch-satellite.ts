/**
 * Génère les images satellite avant/après pour la page /sol.
 * Utilise l'API Process de Copernicus Data Space (Sentinel-2 L2A, vraie couleur).
 *
 * Prérequis : COPERNICUS_CLIENT_ID et COPERNICUS_CLIENT_SECRET dans .env.local
 * Usage : npx tsx scripts/fetch-satellite.ts
 */

import * as fs from "fs"
import * as path from "path"

// Charge .env.local manuellement (dotenv n'est pas une dépendance du projet)
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

// Une image JPEG valide (1000×700, vraie couleur) fait >50 KB.
// En dessous de ce seuil : données manquantes, nuages totaux, ou zone noire.
const MIN_VALID_BYTES = 50_000

type DateRange = { from: string; to: string }

const ZONES: Array<{
  id: string
  label: string
  bbox: number[]
  before: DateRange
  beforeFallbacks: DateRange[]
  after: DateRange
  afterFallbacks: DateRange[]
}> = [
  {
    id: "landes",
    label: "Les Landes — Incendies 2022",
    bbox: [-0.85, 44.55, -0.35, 44.85],
    before: { from: "2021-07-01", to: "2021-08-31" },
    beforeFallbacks: [
      { from: "2020-07-01", to: "2020-08-31" },
      { from: "2019-07-01", to: "2019-08-31" },
    ],
    after: { from: "2022-08-15", to: "2022-09-30" },
    afterFallbacks: [
      { from: "2022-09-01", to: "2022-10-31" },
    ],
  },
  {
    id: "montbel",
    label: "Lac de Montbel — Sécheresse 2022",
    bbox: [1.76, 42.86, 1.97, 42.99],
    before: { from: "2019-07-01", to: "2019-08-31" },
    beforeFallbacks: [
      { from: "2018-07-01", to: "2018-08-31" },
      { from: "2017-07-01", to: "2017-08-31" },
    ],
    after: { from: "2022-07-15", to: "2022-09-15" },
    afterFallbacks: [
      { from: "2022-08-01", to: "2022-10-01" },
    ],
  },
  {
    id: "camargue",
    label: "Camargue — Assèchement",
    bbox: [4.20, 43.30, 4.80, 43.70],
    before: { from: "2016-07-01", to: "2016-08-31" },
    beforeFallbacks: [
      { from: "2017-06-01", to: "2017-07-31" },
      { from: "2018-06-01", to: "2018-07-31" },
      { from: "2019-06-01", to: "2019-07-31" },
    ],
    after: { from: "2022-07-01", to: "2022-08-31" },
    afterFallbacks: [
      { from: "2022-06-01", to: "2022-09-30" },
      { from: "2023-07-01", to: "2023-08-31" },
    ],
  },
]

// Vraie couleur Sentinel-2 légèrement boostée (gain 3.5)
const EVALSCRIPT = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B04", "B03", "B02"] }], output: { bands: 3 } }
}
function evaluatePixel(s) {
  return [3.5 * s.B04, 3.5 * s.B03, 3.5 * s.B02]
}`

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

async function fetchImage(token: string, bbox: number[], timeRange: DateRange): Promise<Buffer> {
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: {
          timeRange: {
            from: `${timeRange.from}T00:00:00Z`,
            to: `${timeRange.to}T23:59:59Z`,
          },
          mosaickingOrder: "leastCC",
        },
      }],
    },
    output: {
      width: 1000,
      height: 700,
      responses: [{ identifier: "default", format: { type: "image/jpeg", quality: 92 } }],
    },
    evalscript: EVALSCRIPT,
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

// Tente la date principale puis les fallbacks jusqu'à obtenir une image valide
async function fetchWithFallback(
  token: string,
  bbox: number[],
  primary: DateRange,
  fallbacks: DateRange[],
  label: string
): Promise<{ buffer: Buffer; usedRange: DateRange } | null> {
  for (const range of [primary, ...fallbacks]) {
    process.stdout.write(`    essai ${range.from} → ${range.to} ... `)
    try {
      const buf = await fetchImage(token, bbox, range)
      if (buf.length < MIN_VALID_BYTES) {
        console.log(`⚠  image suspecte (${buf.length} bytes < ${MIN_VALID_BYTES}), on essaie la suivante`)
        continue
      }
      console.log(`✓  ${buf.length} bytes`)
      return { buffer: buf, usedRange: range }
    } catch (err) {
      console.log(`✗  ${err}`)
    }
  }
  return null
}

async function main() {
  console.log("Obtention du token Copernicus...")
  const token = await getToken()
  console.log("Token OK\n")

  const outDir = path.join(process.cwd(), "public/satellite")
  fs.mkdirSync(outDir, { recursive: true })

  // Manifest : indique quelles images sont disponibles (pour le front)
  const manifest: Record<string, { before: boolean; after: boolean; beforeDate?: string; afterDate?: string }> = {}

  for (const zone of ZONES) {
    console.log(`[${zone.id}] ${zone.label}`)
    manifest[zone.id] = { before: false, after: false }

    for (const [key, primary, fallbacks] of [
      ["before", zone.before, zone.beforeFallbacks],
      ["after",  zone.after,  zone.afterFallbacks],
    ] as const) {
      const result = await fetchWithFallback(token, zone.bbox, primary, fallbacks, key)
      if (result) {
        const filename = `${zone.id}-${key}.jpg`
        fs.writeFileSync(path.join(outDir, filename), result.buffer)
        manifest[zone.id][key] = true
        manifest[zone.id][`${key}Date`] = result.usedRange.from.slice(0, 7)
      } else {
        console.log(`    ✗ aucune image valide pour ${zone.id}/${key} — non affiché dans le front`)
      }
    }
    console.log()
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  )
  console.log("manifest.json écrit.")
  console.log("Terminé. Commite public/satellite/ pour déployer les images.")
}

main().catch((e) => { console.error(e); process.exit(1) })
