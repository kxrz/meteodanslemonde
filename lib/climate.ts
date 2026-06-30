type ScenarioProjection = {
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
}

type ClimateFullEntry = {
  normal: number[]
  trend: number[]
  ssp245?: ScenarioProjection
  ssp585?: ScenarioProjection
}

export type ClimateEntry = {
  normal: (number | null)[]
  trend: (number | null)[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
  ssp585?: ScenarioProjection
} | null

function normalizeFull(entry: ClimateFullEntry): NonNullable<ClimateEntry> {
  const ssp = entry.ssp245 ?? entry.ssp585
  return {
    normal: entry.normal,
    trend: entry.trend,
    proj2030: ssp?.proj2030 ?? Array(12).fill(null),
    proj2040: ssp?.proj2040 ?? Array(12).fill(null),
    proj2050: ssp?.proj2050 ?? Array(12).fill(null),
    ...(entry.ssp585 ? { ssp585: entry.ssp585 } : {}),
  }
}

export function loadClimateMap(): Record<string, NonNullable<ClimateEntry>> {
  let full: Record<string, ClimateFullEntry> = {}
  let base: Record<string, NonNullable<ClimateEntry>> = {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    full = require("@/data/climate-full.json")
  } catch { /* file not yet generated */ }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    base = require("@/data/climate.json")
  } catch { /* not available */ }

  const result: Record<string, NonNullable<ClimateEntry>> = { ...base }
  for (const [id, entry] of Object.entries(full)) {
    result[id] = normalizeFull(entry)
  }
  return result
}
