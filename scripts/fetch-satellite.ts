/**
 * Génère les images satellite avant/après pour la page /sol.
 * Utilise l'API Process de Copernicus Data Space (Sentinel-2 L2A, vraie couleur).
 *
 * Prérequis : COPERNICUS_CLIENT_ID et COPERNICUS_CLIENT_SECRET dans .env.local
 * Usage : npx tsx scripts/fetch-satellite.ts
 */

import * as fs from "fs"
import * as path from "path"
import { config } from "dotenv"

config({ path: ".env.local" })

const CLIENT_ID = process.env.COPERNICUS_CLIENT_ID
const CLIENT_SECRET = process.env.COPERNICUS_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("COPERNICUS_CLIENT_ID et COPERNICUS_CLIENT_SECRET requis dans .env.local")
  process.exit(1)
}

// Zones : bbox = [lon_min, lat_min, lon_max, lat_max]
const ZONES = [
  {
    id: "landes",
    label: "Les Landes — Incendies 2022",
    bbox: [-0.85, 44.55, -0.35, 44.85],
    before: { from: "2021-07-01", to: "2021-08-31" },
    after:  { from: "2022-08-15", to: "2022-09-30" },
  },
  {
    id: "montbel",
    label: "Lac de Montbel — Sécheresse 2022",
    bbox: [1.76, 42.86, 1.97, 42.99],
    before: { from: "2019-07-01", to: "2019-08-31" },
    after:  { from: "2022-07-15", to: "2022-09-15" },
  },
  {
    id: "camargue",
    label: "Camargue — Assèchement",
    bbox: [4.20, 43.30, 4.80, 43.70],
    before: { from: "2012-07-01", to: "2012-08-31" },
    after:  { from: "2022-07-01", to: "2022-08-31" },
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

async function fetchImage(
  token: string,
  bbox: number[],
  timeRange: { from: string; to: string }
): Promise<Buffer> {
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
          mosaickingOrder: "leastCC", // image la moins nuageuse de la période
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
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Process API ${res.status}: ${text.slice(0, 300)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  console.log("Obtention du token Copernicus...")
  const token = await getToken()
  console.log("Token OK\n")

  const outDir = path.join(process.cwd(), "public/satellite")
  fs.mkdirSync(outDir, { recursive: true })

  for (const zone of ZONES) {
    console.log(`[${zone.id}] ${zone.label}`)

    for (const [key, range] of [["before", zone.before], ["after", zone.after]] as const) {
      const filename = `${zone.id}-${key}.jpg`
      const outPath = path.join(outDir, filename)
      process.stdout.write(`  ${key} (${range.from} → ${range.to}) ... `)
      try {
        const img = await fetchImage(token, zone.bbox, range)
        fs.writeFileSync(outPath, img)
        console.log(`✓  ${img.length} bytes → public/satellite/${filename}`)
      } catch (err) {
        console.log(`✗  ${err}`)
      }
    }
    console.log()
  }

  console.log("Terminé. Vérifie public/satellite/ et commite les images.")
}

main().catch((e) => { console.error(e); process.exit(1) })
