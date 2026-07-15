export type FireRiskLevel = "low" | "moderate" | "high" | "extreme"

export type FireRisk = {
  level: FireRiskLevel
  tempMax: number
  humMin: number
  windMax: number
  precip3d: number
}

export type FireSummary = {
  activeCount: number   // feux actifs VIIRS (7 derniers jours)
  burnedCount: number   // périmètres MODIS (30 derniers jours)
  burnedHa: number      // superficie brûlée totale (ha)
}

const EFFIS = "https://ies-ows.jrc.ec.europa.eu/effis"

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
    const data = await res.json()
    const d = data.daily
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

function dateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

export async function fetchFireSummary(): Promise<FireSummary> {
  const now = new Date()
  const past30 = new Date(now); past30.setDate(past30.getDate() - 30)
  const past7 = new Date(now); past7.setDate(past7.getDate() - 7)

  const burnedFilter = encodeURIComponent(`country='FR' AND firedate>='${dateStr(past30)}'`)
  const activeFilter = encodeURIComponent(`country='FR' AND firedate>='${dateStr(past7)}'`)

  const [burnedRes, activeRes] = await Promise.allSettled([
    fetch(
      `${EFFIS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:modis.ba.poly` +
      `&outputFormat=application/json&CQL_FILTER=${burnedFilter}&COUNT=200`,
      { next: { revalidate: 86400 } }
    ),
    fetch(
      `${EFFIS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:viirs.inpe` +
      `&outputFormat=application/json&CQL_FILTER=${activeFilter}&COUNT=200`,
      { next: { revalidate: 86400 } }
    ),
  ])

  const burned = burnedRes.status === "fulfilled" && burnedRes.value.ok
    ? await burnedRes.value.json().catch(() => null) : null
  const active = activeRes.status === "fulfilled" && activeRes.value.ok
    ? await activeRes.value.json().catch(() => null) : null

  const burnedFeatures: Record<string, unknown>[] = burned?.features ?? []
  const activeFeatures: Record<string, unknown>[] = active?.features ?? []

  const burnedHa = burnedFeatures.reduce((s, f) => {
    const props = (f as { properties?: { areaha?: number } }).properties
    return s + (props?.areaha ?? 0)
  }, 0)

  return {
    activeCount: activeFeatures.length,
    burnedCount: burnedFeatures.length,
    burnedHa: Math.round(burnedHa),
  }
}

// Retourne le GeoJSON complet pour la carte (périmètres + points feux actifs)
export async function fetchFiresGeoJSON(): Promise<{
  type: "FeatureCollection"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[]
}> {
  const now = new Date()
  const past30 = new Date(now); past30.setDate(past30.getDate() - 30)
  const past7 = new Date(now); past7.setDate(past7.getDate() - 7)

  const burnedFilter = encodeURIComponent(`country='FR' AND firedate>='${dateStr(past30)}'`)
  const activeFilter = encodeURIComponent(`country='FR' AND firedate>='${dateStr(past7)}'`)

  const [burnedRes, activeRes] = await Promise.allSettled([
    fetch(
      `${EFFIS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:modis.ba.poly` +
      `&outputFormat=application/json&CQL_FILTER=${burnedFilter}&COUNT=100`,
      { next: { revalidate: 86400 } }
    ),
    fetch(
      `${EFFIS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:viirs.inpe` +
      `&outputFormat=application/json&CQL_FILTER=${activeFilter}&COUNT=100`,
      { next: { revalidate: 86400 } }
    ),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const burned: any = burnedRes.status === "fulfilled" && burnedRes.value.ok
    ? await burnedRes.value.json().catch(() => null) : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active: any = activeRes.status === "fulfilled" && activeRes.value.ok
    ? await activeRes.value.json().catch(() => null) : null

  const burnedFeatures = (burned?.features ?? []).map((f: Record<string, unknown>) => ({
    ...f,
    properties: { ...(f.properties as object), _type: "burned" },
  }))
  const activeFeatures = (active?.features ?? []).map((f: Record<string, unknown>) => ({
    ...f,
    properties: { ...(f.properties as object), _type: "active" },
  }))

  return { type: "FeatureCollection", features: [...burnedFeatures, ...activeFeatures] }
}
