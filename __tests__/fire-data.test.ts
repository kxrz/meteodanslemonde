import { describe, it, expect } from "vitest"
import { clusterFirePoints, parseFirmsCSV, isIndustrialZone } from "@/lib/fire-data"
import type { FirmsPoint } from "@/lib/fire-data"

// ── parseFirmsCSV ──────────────────────────────────────────────────────────────

const FIRMS_HEADER = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight"

describe("parseFirmsCSV", () => {
  it("returns empty for header-only input", () => {
    expect(parseFirmsCSV(FIRMS_HEADER)).toEqual([])
  })

  it("parses a valid point inside France", () => {
    const csv = `${FIRMS_HEADER}\n44.0,2.0,310.5,0.4,0.4,2024-07-01,1200,NPP,high,2.0NRT,295.3,45.2,D`
    const result = parseFirmsCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ lat: 44.0, lon: 2.0, date: "2024-07-01", confidence: "high", frp: 45.2 })
  })

  it("filters out points outside France", () => {
    // London
    const csv = `${FIRMS_HEADER}\n51.5,-0.1,300,0.4,0.4,2024-07-01,1200,NPP,high,2.0NRT,290,10.0,D`
    expect(parseFirmsCSV(csv)).toHaveLength(0)
  })

  it("accepts points in Corsica", () => {
    const csv = `${FIRMS_HEADER}\n42.0,9.0,315,0.4,0.4,2024-07-01,1200,NPP,nominal,2.0NRT,295,20.0,D`
    expect(parseFirmsCSV(csv)).toHaveLength(1)
  })

  it("sets frp to 0 when column is missing or NaN", () => {
    const csv = `${FIRMS_HEADER}\n44.0,2.0,310,0.4,0.4,2024-07-01,1200,NPP,low,2.0NRT,295,,D`
    const result = parseFirmsCSV(csv)
    expect(result[0].frp).toBe(0)
  })

  it("skips malformed lines", () => {
    const csv = `${FIRMS_HEADER}\n,,,,,,,,,,,,,\n44.0,2.0,310,0.4,0.4,2024-07-01,1200,NPP,high,2.0NRT,295,30.0,D`
    const result = parseFirmsCSV(csv)
    expect(result).toHaveLength(1)
  })
})

// ── isIndustrialZone ───────────────────────────────────────────────────────────

describe("isIndustrialZone", () => {
  it("identifies Fos-sur-Mer as industrial", () => {
    expect(isIndustrialZone(43.41, 4.94)).toBe(true)
  })

  it("identifies Dunkerque as industrial", () => {
    expect(isIndustrialZone(51.04, 2.67)).toBe(true)
  })

  it("returns false for a point far from any industrial zone", () => {
    expect(isIndustrialZone(45.0, 2.0)).toBe(false)
  })

  it("returns false just outside the exclusion radius", () => {
    // Fos-sur-Mer at (43.41, 4.94) — radius is 0.03°
    expect(isIndustrialZone(43.41 + 0.04, 4.94)).toBe(false)
  })

  it("returns true just inside the exclusion radius", () => {
    expect(isIndustrialZone(43.41 + 0.02, 4.94)).toBe(true)
  })
})

// ── clusterFirePoints ──────────────────────────────────────────────────────────

function pt(lat: number, lon: number, confidence = "nominal", frp = 0, date = "2024-07-01"): FirmsPoint {
  return { lat, lon, confidence, frp, date }
}

describe("clusterFirePoints", () => {
  it("returns empty for no points", () => {
    expect(clusterFirePoints([])).toEqual([])
  })

  it("ignores clusters with fewer than 3 points", () => {
    const result = clusterFirePoints([pt(44, 2), pt(44.01, 2.01)])
    expect(result).toHaveLength(0)
  })

  it("groups nearby points into a single cluster", () => {
    const pts = [pt(44.0, 2.0), pt(44.02, 2.01), pt(44.01, 1.99)]
    const result = clusterFirePoints(pts)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(3)
  })

  it("separates distant points into different clusters", () => {
    const cluster1 = [pt(44.0, 2.0), pt(44.01, 2.01), pt(44.02, 2.02)]
    const cluster2 = [pt(47.0, 5.0), pt(47.01, 5.01), pt(47.02, 5.02)]
    const result = clusterFirePoints([...cluster1, ...cluster2])
    expect(result).toHaveLength(2)
  })

  it("marks isMajor when highConf >= 8 and not industrial/permanent", () => {
    const pts = Array.from({ length: 10 }, (_, i) =>
      pt(44.0 + i * 0.001, 2.0, "high", 50, "2024-07-01")
    )
    const result = clusterFirePoints(pts)
    expect(result[0].isMajor).toBe(true)
    expect(result[0].highConf).toBe(10)
  })

  it("does not mark isMajor for industrial zones", () => {
    // Fos-sur-Mer — points near 43.41, 4.94
    const pts = Array.from({ length: 20 }, (_, i) =>
      pt(43.41 + i * 0.001, 4.94, "high", 100, "2024-07-01")
    )
    const result = clusterFirePoints(pts)
    expect(result[0].isIndustrial).toBe(true)
    expect(result[0].isMajor).toBe(false)
  })

  it("marks isPermanent when active on 5+ distinct days", () => {
    const dates = ["2024-07-01","2024-07-02","2024-07-03","2024-07-04","2024-07-05"]
    const pts = dates.map(d => pt(44.0, 2.0, "high", 30, d))
    const result = clusterFirePoints(pts)
    expect(result[0].isPermanent).toBe(true)
    expect(result[0].isMajor).toBe(false)
  })

  it("does not mark isPermanent with only 4 distinct days", () => {
    const dates = ["2024-07-01","2024-07-02","2024-07-03","2024-07-04"]
    const pts = dates.map(d => pt(44.0, 2.0, "high", 30, d))
    const result = clusterFirePoints(pts)
    expect(result[0].isPermanent).toBe(false)
  })

  it("computes frpMax correctly", () => {
    const pts = [
      pt(44.0, 2.0, "high", 10),
      pt(44.01, 2.0, "high", 99),
      pt(44.02, 2.0, "high", 42),
    ]
    const result = clusterFirePoints(pts)
    expect(result[0].frpMax).toBe(99)
  })

  it("sets frpMax to 0 when all frp are 0", () => {
    const pts = [pt(44.0, 2.0, "nominal", 0), pt(44.01, 2.0, "nominal", 0), pt(44.02, 2.0, "nominal", 0)]
    const result = clusterFirePoints(pts)
    expect(result[0].frpMax).toBe(0)
  })

  it("sorts clusters by count descending", () => {
    const big = Array.from({ length: 5 }, (_, i) => pt(44.0 + i * 0.001, 2.0))
    const small = Array.from({ length: 3 }, (_, i) => pt(47.0 + i * 0.001, 5.0))
    const result = clusterFirePoints([...small, ...big])
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count)
  })
})
