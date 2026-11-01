import { describe, it, expect } from "vitest"
import { seasonalProjections, seasonShiftDays, type ClimateFull } from "@/lib/climate-season"
import { seasonalMean, seasonOf, deMonth } from "@/lib/season"
import { fmt, fmtDelta, fmtTemp } from "@/lib/format"
import { anomalyStep } from "@/lib/anomaly"

const bordeaux: ClimateFull = {
  normal: [7, 8, 12, 15, 20, 25, 27, 28, 23, 18, 12, 8],
  trend: [-0.3, 0.8, -0.4, 1.7, -0.4, 2.4, 1.5, 0.4, 1.9, 2.2, 1.5, 1.1],
  ssp245: {
    proj2030: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    proj2040: [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3], // hiver 2040 = 3
    proj2050: [1.5, 0.6, 1.2, 1.1, 2.4, 2, 2.4, 2.1, 2.3, 1.5, 0.9, 1.5], // hiver 2050 = 1.2 < 2040
  },
  ssp585: {
    proj2030: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    proj2040: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    proj2050: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  },
}

describe("format français", () => {
  it("virgule, vrai moins, pas de décimale inutile", () => {
    expect(fmt(12)).toBe("12")
    expect(fmt(12.34)).toBe("12,3")
    expect(fmt(-3.2)).toBe("−3,2")
    expect(fmtDelta(1.5)).toBe("+1,5")
    expect(fmtDelta(-0.3)).toBe("−0,3")
    expect(fmtDelta(0.04)).toBe("0")
    expect(fmtTemp(8)).toBe("8 °C")
    expect(fmt(null)).toBe("–")
  })
})

describe("saisons", () => {
  it("saisons météorologiques", () => {
    expect(seasonOf(11)).toBe("hiver")
    expect(seasonOf(0)).toBe("hiver")
    expect(seasonOf(5)).toBe("ete")
    expect(seasonOf(10)).toBe("automne")
  })
  it("moyenne saisonnière déc-jan-fév", () => {
    expect(seasonalMean(bordeaux.normal, "hiver")).toBe(7.7)
  })
  it("élision des mois", () => {
    expect(deMonth(3)).toBe("d'avril")
    expect(deMonth(0)).toBe("de janvier")
    expect(deMonth(7)).toBe("d'août")
  })
})

describe("projections saisonnières", () => {
  it("ne redescend jamais d'un horizon au suivant et donne une fourchette", () => {
    const p = seasonalProjections(bordeaux, "hiver")
    expect(p.map((x) => x.year)).toEqual([2030, 2040, 2050])
    expect(p[1].central).toBe(3)
    expect(p[2].central).toBe(3) // 1.2 brut, relevé à 3 pour rester monotone
    expect(p[2].low).toBeLessThanOrEqual(p[2].central!)
    expect(p[2].high).toBeGreaterThanOrEqual(p[2].central!)
  })
})

describe("glissement des saisons", () => {
  it("novembre +1,5 °C à Bordeaux ≈ une semaine de recul", () => {
    const d = seasonShiftDays(bordeaux.normal, 10, 1.5)!
    expect(d).toBeGreaterThan(5)
    expect(d).toBeLessThan(12)
  })
  it("courbe plate (été) : pas de calcul", () => {
    expect(seasonShiftDays(bordeaux.normal, 6, 1.5)).toBeNull()
  })
})

describe("échelle d'anomalie", () => {
  it("bornes", () => {
    expect(anomalyStep(0)?.key).toBe("0")
    expect(anomalyStep(4)?.key).toBe("p3")
    expect(anomalyStep(-7)?.key).toBe("m4")
    expect(anomalyStep(null)).toBeNull()
  })
})
