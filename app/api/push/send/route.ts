import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import webpush from "web-push"
import { loadClimateMap } from "@/lib/climate"

const FILE = join(process.cwd(), "data/subscriptions.json")
const citiesWorld = require("@/data/cities-world.json") as Array<{ id: string; name: string }>

function load(): Record<string, { subscription: PushSubscriptionJSON; cityId: string }> {
  try { return JSON.parse(readFileSync(FILE, "utf8")) } catch { return {} }
}

async function fetchTemp(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=apparent_temperature_max&forecast_days=1`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Math.round(data.daily.apparent_temperature_max[0])
  } catch { return null }
}

const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number }>

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-push-secret")
  if (secret !== process.env.PUSH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const db = load()
  const climateMap = loadClimateMap()
  const m = new Date().getMonth()
  let sent = 0

  for (const [, entry] of Object.entries(db)) {
    const { subscription, cityId } = entry
    const city = citiesFR.find((c) => c.id === cityId)
    if (!city) continue

    const temp = await fetchTemp(city.lat, city.lon)
    if (temp === null) continue

    const normal = climateMap[cityId]?.normal?.[m] ?? null
    const anomaly = normal !== null ? Math.round((temp - normal) * 10) / 10 : null
    const sign = anomaly !== null && anomaly > 0 ? "+" : ""

    // Trouver jumeau mondial le plus proche en temp du jour
    const allWorldTemps = await Promise.all(
      citiesWorld.slice(0, 5).map(async (w) => {
        const wCity = (require("@/data/cities-world.json") as Array<{ id: string; name: string; lat: number; lon: number }>).find((c) => c.id === w.id)
        if (!wCity) return null
        const t = await fetchTemp(wCity.lat, wCity.lon)
        return t !== null ? { name: w.name, diff: Math.abs(t - temp) } : null
      })
    )
    const twin = allWorldTemps.filter(Boolean).sort((a, b) => a!.diff - b!.diff)[0]

    const body = [
      `${temp}°C ressenti max`,
      anomaly !== null ? `${sign}${anomaly}°C vs normale` : null,
      twin ? `Jumeau : ${twin.name}` : null,
    ].filter(Boolean).join(" · ")

    try {
      await webpush.sendNotification(
        subscription as Parameters<typeof webpush.sendNotification>[0],
        JSON.stringify({
          title: `🌡 ${city.name} aujourd'hui`,
          body,
          url: `/a/${city.name.toLowerCase().replace(/\s+/g, "-")}`,
        })
      )
      sent++
    } catch {
      // subscription expirée — on la nettoie pas ici pour simplifier
    }
  }

  return NextResponse.json({ sent })
}
