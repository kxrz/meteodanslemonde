// Source : NASA FIRMS — CSV public, sans clé API, mis à jour plusieurs fois/jour
// https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/
const FIRMS_7D = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Europe_7d.csv"

// Polygone simplifié France métropolitaine (ray-casting) — exclut UK, Belgique, Allemagne, Espagne, Italie
// Format : [lat, lon]
const FRANCE_POLY: [number, number][] = [
  [48.37, -4.78], [49.65, -1.56], [50.10, 1.60], [50.96, 1.82], [51.00, 2.52],
  [50.75, 3.12],  [50.25, 4.16],  [49.46, 6.37], [48.98, 7.63], [47.96, 8.23],
  [47.59, 7.60],  [46.43, 6.80],  [45.92, 7.05], [45.18, 6.90], [43.98, 7.68],
  [43.76, 7.52],  [43.10, 6.22],  [43.30, 4.64], [43.08, 3.08], [43.34, 1.78],
  [42.80, 0.70],  [43.37, -1.77], [47.68, -4.62],[48.37, -4.78],
]
// Corse (bbox simple)
const CORSE = { latMin: 41.3, latMax: 43.05, lonMin: 8.4, lonMax: 9.6 }

function pointInPolygon(lat: number, lon: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j]
    if (((yi > lat) !== (yj > lat)) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function inFrance(lat: number, lon: number) {
  if (lat >= CORSE.latMin && lat <= CORSE.latMax && lon >= CORSE.lonMin && lon <= CORSE.lonMax) return true
  return pointInPolygon(lat, lon, FRANCE_POLY)
}


function parseFirmsCSV(csv: string): FirmsPoint[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []
  // colonnes réelles : latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight
  // (pas de colonne "instrument" contrairement à la doc générique)
  return lines.slice(1).flatMap(line => {
    const c = line.trim().split(",")
    const lat = parseFloat(c[0])
    const lon = parseFloat(c[1])
    if (isNaN(lat) || isNaN(lon) || !inFrance(lat, lon)) return []
    const confidence = (c[8] ?? "").trim()  // "low" | "nominal" | "high"
    const frp = parseFloat((c[11] ?? "").trim()) || 0
    return [{ lat, lon, date: (c[5] ?? "").trim(), confidence, frp }]
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

export type FirmsPoint = {
  lat: number
  lon: number
  date: string
  confidence: string
  frp: number
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

export type FireZoneWeather = {
  aqi: number | null       // European AQI 0-500
  pm25: number | null      // µg/m³
  pm10: number | null      // µg/m³
  windSpeed: number | null // km/h
  windDir: number | null   // degrés 0-360
}

export async function fetchFireZoneWeather(lat: number, lon: number): Promise<FireZoneWeather> {
  const empty: FireZoneWeather = { aqi: null, pm25: null, pm10: null, windSpeed: null, windDir: null }
  try {
    const [aqRes, windRes] = await Promise.all([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
        `&current=european_aqi,pm10,pm2_5&domains=cams_europe`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=wind_speed_10m,wind_direction_10m`,
        { next: { revalidate: 3600 } }
      ),
    ])
    const aq = aqRes.ok ? (await aqRes.json()).current : {}
    const wind = windRes.ok ? (await windRes.json()).current : {}
    return {
      aqi: aq.european_aqi ?? null,
      pm25: aq.pm2_5 ?? null,
      pm10: aq.pm10 ?? null,
      windSpeed: wind.wind_speed_10m ?? null,
      windDir: wind.wind_direction_10m ?? null,
    }
  } catch {
    return empty
  }
}

export async function fetchFireSummary(): Promise<FireSummary> {
  const points = await fetchFirmsPoints()
  return { activeCount: points.length, burnedHa: 0 }
}

export async function fetchFirePoints(): Promise<FirmsPoint[]> {
  return fetchFirmsPoints()
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
