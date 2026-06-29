import type { ClimateEntry } from "./types"

export interface ClimateValues {
  normal: number | null
  anomaly: number | null
  trend: number | null
  proj2030: number | null
  proj2040: number | null
  proj2050: number | null
}

export function getClimateValues(
  entry: ClimateEntry | null | undefined,
  month: number, // 1-12
  currentApparentTempMax: number
): ClimateValues {
  if (!entry) {
    return { normal: null, anomaly: null, trend: null, proj2030: null, proj2040: null, proj2050: null }
  }
  const i = month - 1
  const normal = entry.normal[i] ?? null
  return {
    normal,
    anomaly: normal !== null ? Math.round(currentApparentTempMax - normal) : null,
    trend: entry.trend[i] ?? null,
    proj2030: entry.proj2030[i] ?? null,
    proj2040: entry.proj2040[i] ?? null,
    proj2050: entry.proj2050[i] ?? null,
  }
}
