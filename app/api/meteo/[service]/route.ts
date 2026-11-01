import { NextResponse } from "next/server"
import { METEO_SERVICES, meteoUrl, type MeteoService } from "@/lib/open-meteo"

// Relais vers Open-Meteo pour les composants client : la clé payante éventuelle reste sur le serveur,
// et la réponse est mise en cache par le CDN (une ville = un appel par jour, quel que soit le trafic).

const ALLOWED = new Set([
  "latitude", "longitude", "daily", "hourly", "current", "start_date", "end_date",
  "timezone", "forecast_days", "past_days", "models", "wind_speed_unit", "temperature_unit",
])

export async function GET(request: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params
  if (!METEO_SERVICES.includes(service as MeteoService)) {
    return NextResponse.json({ error: "Service inconnu" }, { status: 404 })
  }
  const incoming = new URL(request.url).searchParams
  const forwarded: Record<string, string> = {}
  for (const [k, v] of incoming) {
    if (!ALLOWED.has(k)) return NextResponse.json({ error: `Paramètre non autorisé : ${k}` }, { status: 400 })
    forwarded[k] = v
  }
  if (!forwarded.latitude || !forwarded.longitude) {
    return NextResponse.json({ error: "latitude et longitude sont requises" }, { status: 400 })
  }
  // Pas de listes de coordonnées par le relais : il sert des composants qui montrent une ville
  if (forwarded.latitude.includes(",") || forwarded.longitude.includes(",")) {
    return NextResponse.json({ error: "Une seule position par requête" }, { status: 400 })
  }

  try {
    const res = await fetch(meteoUrl(service as MeteoService, forwarded), { next: { revalidate: 3600 } })
    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": res.ok ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Open-Meteo ne répond pas" }, { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
