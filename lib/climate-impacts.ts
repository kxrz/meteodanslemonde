const impacts = require("@/data/climate-impacts.json") as Impact[]

export interface Impact {
  id: string
  regions: string[]   // empty = national
  months: number[] | null  // 1-12, null = all year
  anomaly_min: number
  theme: string
  fait: string
  pourquoi: string
  implication: string
  source: string
  source_url: string
}

export function getImpacts({
  regionSlug,
  month,
  count = 1,
  seed = 0,
}: {
  regionSlug: string | null
  month: number  // 1-12
  count?: number
  seed?: number
}): Impact[] {
  const eligible = impacts.filter((impact) => {
    const regionOk =
      impact.regions.length === 0 ||
      (regionSlug !== null && impact.regions.includes(regionSlug))
    const monthOk = impact.months === null || impact.months.includes(month)
    return regionOk && monthOk
  })

  if (eligible.length === 0) return []

  // Deterministic selection by seed (day of year + city hash)
  const picks: Impact[] = []
  const used = new Set<number>()
  for (let i = 0; i < count && picks.length < eligible.length; i++) {
    const idx = (seed + i * 7) % eligible.length
    // spread if already used
    let j = idx
    while (used.has(j)) j = (j + 1) % eligible.length
    used.add(j)
    picks.push(eligible[j])
  }

  return picks
}
