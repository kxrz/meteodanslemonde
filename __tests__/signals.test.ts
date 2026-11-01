import { describe, it, expect } from "vitest"
import { frostNormalsFromDaily, expectedFrostNights } from "@/lib/frost"
import { signalWindow, summarizeSeries, lastValidDate, dateRange, addDays, parisISODate } from "@/lib/signals"
import { computeYearExtremes } from "@/lib/year-extremes"

/** Série quotidienne complète sur des années entières, avec une minimale donnée par une fonction. */
function series(years: number[], minOf: (date: string) => number | null) {
  const dates = years.flatMap((y) => dateRange(`${y}-01-01`, `${y}-12-31`))
  return { dates, mins: dates.map(minOf) }
}

describe("normales de nuits de gel", () => {
  it("moyenne par mois sur les années présentes, arrondie à 0,1", () => {
    // 1991 : 3 nuits de gel en janvier ; 1992 : 0 ; 1993 : 4 → (3+0+4)/3 = 2,333 → 2,3
    const frost: Record<string, true> = {
      "1991-01-02": true, "1991-01-03": true, "1991-01-20": true,
      "1993-01-05": true, "1993-01-06": true, "1993-01-07": true, "1993-01-31": true,
      "1992-12-25": true,
    }
    const { dates, mins } = series([1991, 1992, 1993], (d) => (frost[d] ? -2 : 5))
    const n = frostNormalsFromDaily(dates, mins)!
    expect(n).toHaveLength(12)
    expect(n[0]).toBe(2.3)
    expect(n[11]).toBe(0.3) // 1 nuit sur 3 décembres
    expect(n[6]).toBe(0)
  })

  it("0 °C pile n'est pas une nuit de gel (strictement sous 0)", () => {
    const { dates, mins } = series([2000], (d) => (d === "2000-02-10" ? 0 : d === "2000-02-11" ? -0.1 : 3))
    expect(frostNormalsFromDaily(dates, mins)![1]).toBe(1)
  })

  it("ignore les jours vides et renvoie null si un mois manque", () => {
    const { dates, mins } = series([2000], (d) => (d.startsWith("2000-03") ? null : -1))
    expect(frostNormalsFromDaily(dates, mins)).toBeNull()
    const partial = series([2000], (d) => (d === "2000-04-01" ? null : -1))
    expect(frostNormalsFromDaily(partial.dates, partial.mins)![3]).toBe(29)
  })

  it("nuits attendues = normale × fraction du mois", () => {
    const normals = [12, 9, 5, 2, 0, 0, 0, 0, 0, 1, 6, 9]
    expect(expectedFrostNights(normals, dateRange("2026-11-01", "2026-11-10"))).toBe(2) // 6 × 10/30
    expect(expectedFrostNights(normals, dateRange("2026-11-01", "2026-11-30"))).toBe(6)
    // à cheval sur deux mois : 21 jours d'octobre (1 × 21/31) + 9 de novembre (6 × 9/30)
    expect(expectedFrostNights(normals, dateRange("2026-10-11", "2026-11-09"))).toBe(2.5)
  })
})

describe("fenêtre d'observation", () => {
  it("depuis le 1er du mois dès 7 jours de recul", () => {
    const w = signalWindow("2026-11-12", "2026-11-14")
    expect(w.kind).toBe("month")
    expect(w.start).toBe("2026-11-01")
    expect(w.days).toHaveLength(12)
  })

  it("30 derniers jours en tout début de mois", () => {
    const w = signalWindow("2026-10-30", "2026-11-01")
    expect(w.kind).toBe("rolling")
    expect(w.start).toBe("2026-10-01")
    expect(w.days).toHaveLength(30)
    expect(signalWindow("2026-11-04", "2026-11-06").kind).toBe("rolling")
  })

  it("dates utilitaires", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(parisISODate(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01")
  })
})

describe("signaux d'une ville", () => {
  const dates = dateRange("2026-07-01", "2026-07-10")
  const s = {
    dates,
    mins: [18, 20, 21, 19.9, 22, 23, -1, 20, null, null],
    apparentMax: [36, 35, 34, 37, 38, 39, 30, 35, 36, null],
  }

  it("compte gel, nuits tropicales (≥ 20 °C) et séries de ressenti ≥ 35 °C", () => {
    const r = summarizeSeries(s, { start: "2026-07-01", end: "2026-07-08" })
    expect(r.frostNights).toBe(1)
    expect(r.tropicalNights).toBe(5) // 20, 21, 22, 23, 20
    expect(r.heatStreakLongest).toBe(3) // 4 → 6 juillet
    expect(r.heatStreakCurrent).toBe(1) // le 8
    expect(r.validDays).toBe(8)
  })

  it("dernière date renseignée", () => {
    expect(lastValidDate(s)).toBe("2026-07-08")
    expect(lastValidDate({ dates: ["2026-01-01"], mins: [null], apparentMax: [null] })).toBeNull()
  })
})

describe("extrêmes de l'année", () => {
  it("garde les champs historiques et ajoute le vrai minimum", () => {
    const r = computeYearExtremes(
      ["2026-01-05", "2026-01-06", "2026-07-20"],
      [1.4, -0.6, 38.6],
      [-7.84, -9.26, 21],
      "t",
    )!
    expect(r).toMatchObject({ max: 39, max_date: "2026-07-20", min: -1, min_date: "2026-01-06", minTempLow: -9.3, minTempLowDate: "2026-01-06" })
  })

  it("sans minimales, pas de champ minTempLow", () => {
    const r = computeYearExtremes(["2026-01-05"], [3], undefined, "t")!
    expect(r.minTempLow).toBeUndefined()
    expect(computeYearExtremes(["2026-01-05"], [null], [1], "t")).toBeNull()
  })
})
