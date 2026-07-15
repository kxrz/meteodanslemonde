// Source : NASA FIRMS — CSV public, sans clé API, mis à jour plusieurs fois/jour
// https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/
const FIRMS_7D = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Europe_7d.csv"

// Bounding box France métropolitaine + Corse
const FR = { latMin: 41.3, latMax: 51.2, lonMin: -5.2, lonMax: 9.6 }

function inFrance(lat: number, lon: number) {
  return lat >= FR.latMin && lat <= FR.latMax && lon >= FR.lonMin && lon <= FR.lonMax
}

type FirmsPoint = {
  lat: number
  lon: number
  date: string
  confidence: string  // "low" | "nominal" | "high"
  frp: number         // Fire Radiative Power (MW)
}

function parseFirmsCSV(csv: string): FirmsPoint[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []
  // colonnes: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight,type
  return lines.slice(1).flatMap(line => {
    const c = line.split(",")
    const lat = parseFloat(c[0])
    const lon = parseFloat(c[1])
    if (isNaN(lat) || isNaN(lon) || !inFrance(lat, lon)) return []
    return [{ lat, lon, date: c[5] ?? "", confidence: c[9] ?? "", frp: parseFloat(c[12] ?? "0") || 0 }]
  })
}

async function fetchFirmsPoints(): Promise<FirmsPoint[]> {
  try {
    const res = await fetch(FIRMS_7D, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    return parseFirmsCSV(await res.text())
  } catch {
    return []
  }
}

// ─── Types exportés ──────────────────────────────────────────────────────────

export type FireRiskLevel = "low" | "moderate" | "high" | "extreme"

export type FireRisk = {
  level: FireRiskLevel
  tempMax: number
  humMin: number
  windMax: number
  precip3d: number
}

export type FireSummary = {
  activeCount: number  // détections VIIRS sur 7j en France
  burnedHa: number     // non disponible via FIRMS points — toujours 0
}

// ─── Fonctions exportées ──────────────────────────────────────────────────────

function computeLevel(tempMax: number, humMin: number, windMax: number, precip3d: number): FireRiskLevel {
  if (precip3d > 10) return "low"
  if (tempMax > 35 && humMin < 25 && windMax > 30) return "extreme"
  if ((tempMax > 32 && humMin < 30) || (tempMax > 35 && humMin < 35)) return "high"
  if (tempMax > 27 && humMin < 50) return "moderate"
  return "low"
}

export async function fetchFireRisk(lat: number, lon: number): Promise<FireRisk | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max,precipitation_sum` +
      `&past_days=2&forecast_days=1`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const d = (await res.json()).daily
    const last = d.time.length - 1
    const tempMax: number = d.temperature_2m_max[last] ?? 20
    const humMin: number = d.relative_humidity_2m_min[last] ?? 60
    const windMax: number = d.wind_speed_10m_max[last] ?? 10
    const precip3d: number = (d.precipitation_sum as (number | null)[])
      .slice(-3).reduce((s: number, v) => s + (v ?? 0), 0)
    return { level: computeLevel(tempMax, humMin, windMax, precip3d), tempMax, humMin, windMax, precip3d }
  } catch {
    return null
  }
}

export async function fetchFireSummary(): Promise<FireSummary> {
  const points = await fetchFirmsPoints()
  return { activeCount: points.length, burnedHa: 0 }
}

export async function fetchFiresGeoJSON(): Promise<{ type: "FeatureCollection"; features: object[] }> {
  const points = await fetchFirmsPoints()
  return {
    type: "FeatureCollection",
    features: points.map(p => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: { _type: "active", firedate: p.date, confidence: p.confidence, frp: p.frp },
    })),
  }
}
