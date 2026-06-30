export type ClimateEntry = {
  normal: number[]
  trend: number[]
  proj2030: (number | null)[]
  proj2040: (number | null)[]
  proj2050: (number | null)[]
} | null

export function loadClimateMap(): Record<string, unknown> {
  try {
    return require("@/data/climate.json")
  } catch {
    return {}
  }
}
