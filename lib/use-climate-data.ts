import { useState, useEffect } from "react"

interface ClimateData {
  normal: number | null
  anomaly: number | null
  trend: number | null
  proj2030: number | null
  proj2040: number | null
  proj2050: number | null
  loading: boolean
  error: boolean
}

export function useClimateData(
  lat: number,
  lon: number,
  currentTemp: number,
  enabled: boolean
): ClimateData {
  const [data, setData] = useState<ClimateData>({
    normal: null, anomaly: null, trend: null,
    proj2030: null, proj2040: null, proj2050: null,
    loading: false, error: false,
  })

  useEffect(() => {
    if (!enabled || lat === 0) return
    let cancelled = false
    setData((d) => ({ ...d, loading: true, error: false }))

    async function load() {
      try {
        const month = new Date().getMonth() + 1
        const monthStr = String(month).padStart(2, "0")
        const startNormal = `1991-${monthStr}-01`
        const endNormal = `2020-${monthStr}-28`
        const startTrend = `1990-${monthStr}-01`
        const endTrend = `2020-${monthStr}-28`

        const archiveUrl =
          `https://archive-api.open-meteo.com/v1/archive` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=${startNormal}&end_date=${endNormal}` +
          `&monthly=apparent_temperature_max`

        const trendUrl =
          `https://archive-api.open-meteo.com/v1/archive` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=${startTrend}&end_date=${endTrend}` +
          `&monthly=apparent_temperature_max`

        const climateUrl =
          `https://climate-api.open-meteo.com/v1/climate` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=2030-01-01&end_date=2050-12-31` +
          `&models=MRI_AGCM3_2_S` +
          `&monthly=apparent_temperature_max`

        const [archRes, trendRes, climRes] = await Promise.all([
          fetch(archiveUrl).then((r) => r.json()),
          fetch(trendUrl).then((r) => r.json()),
          fetch(climateUrl).then((r) => r.json()),
        ])

        if (cancelled) return

        const normalTemps: number[] = archRes.monthly?.apparent_temperature_max ?? []
        const normal = normalTemps.length > 0
          ? Math.round(normalTemps.reduce((a: number, b: number) => a + b, 0) / normalTemps.length * 10) / 10
          : null
        const anomaly = normal !== null ? Math.round((currentTemp - normal) * 10) / 10 : null

        const trendTemps: number[] = trendRes.monthly?.apparent_temperature_max ?? []
        let trend: number | null = null
        if (trendTemps.length >= 2) {
          const first5 = trendTemps.slice(0, 5)
          const last5 = trendTemps.slice(-5)
          const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
          trend = Math.round((avg(last5) - avg(first5)) * 10) / 10
        }

        const climTemps: number[] = climRes.monthly?.apparent_temperature_max ?? []
        const baselineTemps = climTemps.slice(0, 24)
        const baseline = baselineTemps.length > 0
          ? baselineTemps.reduce((a: number, b: number) => a + b, 0) / baselineTemps.length
          : null

        function projDelta(yearIndex: number) {
          if (baseline === null || climTemps.length < yearIndex + 12) return null
          const slice = climTemps.slice(yearIndex, yearIndex + 12)
          const avg = slice.reduce((a: number, b: number) => a + b, 0) / slice.length
          return Math.round((avg - baseline) * 10) / 10
        }

        setData({
          normal, anomaly, trend,
          proj2030: projDelta(0),
          proj2040: projDelta(120),
          proj2050: projDelta(240),
          loading: false, error: false,
        })
      } catch {
        if (!cancelled) setData((d) => ({ ...d, loading: false, error: true }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [lat, lon, currentTemp, enabled])

  return data
}
