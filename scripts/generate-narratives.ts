/**
 * Run LOCALLY to generate data/narratives.json.
 * Requires ANTHROPIC_API_KEY in env (or .env.local).
 *
 * Usage:  npm run generate-narratives
 * Then:   git add data/narratives.json && git commit -m "chore: update narratives" && git push
 *
 * Resume-safe: already-generated cities are skipped.
 * Relance possible à tout moment.
 */
import Anthropic from "@anthropic-ai/sdk"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const NARRATIVES_PATH = path.join(DATA_DIR, "narratives.json")
const BETWEEN_MS = 500

interface CityFR {
  id: string
  name: string
  region: string
  lat: number
  lon: number
}

interface ClimateEntry {
  normal: (number | null)[]
  trend: (number | null)[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
}

function hotMonth(entry: ClimateEntry): { month: number; normal: number; trend: number | null; p2040: number | null; p2050: number | null } {
  let best = 0
  let bestVal = -Infinity
  for (let i = 0; i < 12; i++) {
    const v = entry.normal[i]
    if (v != null && v > bestVal) { bestVal = v; best = i }
  }
  return {
    month: best + 1,
    normal: Math.round(bestVal),
    trend: entry.trend[best] ?? null,
    p2040: entry.proj2040[best] ?? null,
    p2050: entry.proj2050[best] ?? null,
  }
}

const MONTH_NAMES = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]

function buildPrompt(city: CityFR, entry: ClimateEntry): string {
  const h = hotMonth(entry)
  const monthName = MONTH_NAMES[h.month - 1]
  const trendStr = h.trend !== null ? `+${h.trend}°C depuis 1990` : "tendance non disponible"
  const p2040Str = h.p2040 !== null ? `+${Math.max(0, h.p2040)}°C supplémentaires vers 2040` : null
  const p2050Str = h.p2050 !== null ? `+${Math.max(0, h.p2050)}°C supplémentaires vers 2050` : null
  const projStr = [p2040Str, p2050Str].filter(Boolean).join(", ")

  return `Tu écris un court texte percutant pour le site cestchaud.fr, une page dédiée à la ville de ${city.name} (${city.region}).

Données réelles pour ${city.name} :
- Ressenti normal en ${monthName} (1991–2020) : ${h.normal}°C
- Évolution observée : ${trendStr} en ${monthName}
${projStr ? `- Projections CMIP6 (GIEC AR6) : ${projStr} en ${monthName}` : ""}

Consignes strictes :
1. 2 phrases maximum, en français, ton direct et concret
2. Commence par un élément local réel et reconnaissable de ${city.name} (monument, fleuve, quartier, place, marché…)
3. Ancre le chiffre de projection dans une image concrète du quotidien
4. Termine par une phrase courte qui frappe et qui rappelle qu'on ne peut pas y échapper — pas de morale, juste un constat dur
5. Ne dis jamais « réchauffement climatique » ni « changement climatique », parle de faits
6. Zéro hashtag, zéro guillemets, zéro emojis

Exemple de ton attendu (pour une autre ville) :
« La Garonne à Toulouse, en 2050, ce sera 8 semaines par an au-dessus de 40°C de ressenti sur les quais — et la térasse du Wilson, même à l’ombre, ne sera plus un refuge. »

Répond uniquement avec le texte, sans introduction ni explication.`
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY. Add it to .env.local or export it.")
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cities-fr.json"), "utf-8")) as CityFR[]

  let climateMap: Record<string, ClimateEntry> = {}
  try {
    climateMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "climate.json"), "utf-8"))
  } catch {
    console.error("data/climate.json not found. Run 'npm run fetch-climate' first.")
    process.exit(1)
  }

  const existing: Record<string, string> = fs.existsSync(NARRATIVES_PATH)
    ? JSON.parse(fs.readFileSync(NARRATIVES_PATH, "utf-8"))
    : {}

  const todo = cities.filter((c) => !existing[c.id] && climateMap[c.id])
  const noClimate = cities.filter((c) => !climateMap[c.id])

  if (noClimate.length > 0) {
    console.warn(`Skipping ${noClimate.length} cities with no climate data: ${noClimate.map((c) => c.name).join(", ")}`)
  }

  if (todo.length === 0) {
    console.log(`All ${cities.length} cities already have narratives. Nothing to do.`)
    return
  }

  const skipped = cities.length - todo.length - noClimate.length
  if (skipped > 0) console.log(`Resuming: ${skipped} already done, ${todo.length} remaining.\n`)
  else console.log(`Generating ${todo.length} narratives...\n`)

  const narratives = { ...existing }

  for (let i = 0; i < todo.length; i++) {
    const city = todo[i]
    const entry = climateMap[city.id]
    process.stdout.write(`  [${i + 1}/${todo.length}] ${city.name}... `)

    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: buildPrompt(city, entry) }],
      })
      const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : ""
      narratives[city.id] = text
      fs.writeFileSync(NARRATIVES_PATH, JSON.stringify(narratives, null, 2))
      console.log("ok")
    } catch (err) {
      console.warn(`FAIL: ${(err as Error).message}`)
    }

    if (i < todo.length - 1) {
      await new Promise((r) => setTimeout(r, BETWEEN_MS))
    }
  }

  const done = Object.keys(narratives).length
  console.log(`\n✓ ${done}/${cities.length} narratives générés`)
  console.log(`✓ Wrote ${NARRATIVES_PATH}`)
  console.log("\nNext step:")
  console.log("  git add data/narratives.json && git commit -m 'chore: update narratives' && git push")
}

main().catch((err) => {
  console.error("Fatal:", err.message)
  process.exit(1)
})
