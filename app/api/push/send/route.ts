import { NextRequest, NextResponse } from "next/server"
import { head } from "@vercel/blob"
import webpush from "web-push"
import { loadClimateMap } from "@/lib/climate"
import { slugify } from "@/lib/slugify"

const BLOB_KEY = "push-subscriptions.json"

type SubStore = Record<string, { subscription: PushSubscriptionJSON; cityId: string }>

const citiesFR = require("@/data/cities-fr.json") as Array<{ id: string; name: string; lat: number; lon: number }>
const citiesWorld = require("@/data/cities-world.json") as Array<{ id: string; name: string; lat: number; lon: number }>

async function load(): Promise<SubStore> {
  try {
    const existing = await head(BLOB_KEY).catch(() => null)
    if (!existing) return {}
    const res = await fetch(existing.url)
    return await res.json()
  } catch { return {} }
}

async function fetchTemp(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=apparent_temperature_max&forecast_days=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    return Math.round(data.daily.apparent_temperature_max[0])
  } catch { return null }
}

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

  const db = await load()
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

    // Jumeau mondial le plus proche en temp du jour
    const worldTemps = await Promise.all(
      citiesWorld.map(async (w) => {
        const t = await fetchTemp(w.lat, w.lon)
        return t !== null ? { name: w.name, diff: Math.abs(t - temp) } : null
      })
    )
    const twin = worldTemps.filter(Boolean).sort((a, b) => a!.diff - b!.diff)[0]

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
          url: `/a/${slugify(city.name)}`,
        })
      )
      sent++
    } catch { /* subscription expirée */ }
  }

  return NextResponse.json({ sent })
}
