"use client"

import { useState, useEffect, useRef } from "react"

export interface ClimateData {
  normal: number | null
  anomaly: number | null
  trend: number | null
  proj2030: number | null
  proj2040: number | null
  proj2050: number | null
  loading: boolean
  error: boolean
}

function monthAvg(
  dates: string[],
  values: (number | null)[],
  month: number,
  y1: number,
  y2: number
): number | null {
  const vals: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const v = values[i]
    if (v === null || v === undefined || isNaN(v as number)) continue
    const parts = dates[i].split("-")
    const y = +parts[0]
    const m = +parts[1]
    if (m === month && y >= y1 && y <= y2) vals.push(v as number)
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const empty: ClimateData = {
  normal: null, anomaly: null, trend: null,
  proj2030: null, proj2040: null, proj2050: null,
  loading: false, error: false,
}

export function useClimateData(
  lat: number,
  lon: number,
  currentApparentTempMax: number,
  enabled: boolean
): ClimateData {
  const [data, setData] = useState<ClimateData>(empty)
  const ctrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) {
      setData(empty)
      return
    }

    ctrlRef.current?.abort()
    ctrlRef.current = new AbortController()
    const sig = ctrlRef.current.signal
    const month = new Date().getMonth() + 1

    setData({ ...empty, loading: true })

    ;(async () => {
      const [archRes, climRes] = await Promise.all([
        fetch(
          `https://archive-api.open-meteo.com/v1/archive` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=1991-01-01&end_date=2024-12-31` +
          `&daily=apparent_temperature_max&timezone=auto`,
          { signal: sig }
        ),
        fetch(
          `https://climate-api.open-meteo.com/v1/climate` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=2000-01-01&end_date=2050-12-31` +
          `&models=MRI_AGCM3_2_S&daily=temperature_2m_max`,
          { signal: sig }
        ),
      ])

      if (!archRes.ok || !climRes.ok) throw new Error("API error")

      const arch = await archRes.json()
      const clim = await climRes.json()

      const ad: string[] = arch.daily.time
      const av: (number | null)[] = arch.daily.apparent_temperature_max
      const cd: string[] = clim.daily.time
      const cv: (number | null)[] = clim.daily.temperature_2m_max

      const normalRaw = monthAvg(ad, av, month, 1991, 2020)
      const normal = normalRaw !== null ? Math.round(normalRaw) : null
      const anomaly = normal !== null ? Math.round(currentApparentTempMax - normal) : null

      const baseline = monthAvg(ad, av, month, 1991, 2000)
      const recent = monthAvg(ad, av, month, 2015, 2024)
      const trend =
        baseline !== null && recent !== null
          ? Math.round((recent - baseline) * 10) / 10
          : null

      // Projections : delta interne au modèle CMIP6 (évite les biais de métriques)
      const climBase = monthAvg(cd, cv, month, 2000, 2020)
      const c2030 = monthAvg(cd, cv, month, 2028, 2032)
      const c2040 = monthAvg(cd, cv, month, 2038, 2042)
      const c2050 = monthAvg(cd, cv, month, 2048, 2050) // modèle couvre jusqu'à 2050

      setData({
        normal,
        anomaly,
        trend,
        proj2030: climBase !== null && c2030 !== null ? Math.round((c2030 - climBase) * 10) / 10 : null,
        proj2040: climBase !== null && c2040 !== null ? Math.round((c2040 - climBase) * 10) / 10 : null,
        proj2050: climBase !== null && c2050 !== null ? Math.round((c2050 - climBase) * 10) / 10 : null,
        loading: false,
        error: false,
      })
    })().catch((err) => {
      if (err.name !== "AbortError") setData({ ...empty, error: true })
    })

    return () => ctrlRef.current?.abort()
  }, [lat, lon, currentApparentTempMax, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return data
}
