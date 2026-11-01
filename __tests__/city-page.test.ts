import { describe, it, expect } from "vitest"
import {
  countDays, expectedNights, extremesView, hasLiveData, impactStatus, inSeason, isSummerNarrative, mean1,
  regionCrop, signalPeriod, theSeason, trailingStreak,
} from "@/lib/city-page"
import { REGIONS, regionDescription } from "@/lib/regions"

describe("hasLiveData", () => {
  it("détecte le relevé factice (tout à zéro)", () => {
    expect(hasLiveData([{ apparent_temp_max: 0, temp_min: 0 }, { apparent_temp_max: 0, temp_min: 0 }])).toBe(false)
    expect(hasLiveData([{ apparent_temp_max: 0, temp_min: 0 }, { apparent_temp_max: 12, temp_min: 4 }])).toBe(true)
  })
})

describe("signalPeriod", () => {
  it("en cours de mois : du 1er à J-2", () => {
    const p = signalPeriod(new Date("2026-11-20T10:00:00Z"))
    expect(p).toEqual({ start: "2026-11-01", end: "2026-11-18", month: 10, days: 18, daysInMonth: 30 })
  })
  it("le 1er novembre : archive jusqu'au 30 octobre", () => {
    const p = signalPeriod(new Date("2026-11-01T10:00:00Z"))
    expect(p.month).toBe(9)
    expect(p.start).toBe("2026-10-01")
    expect(p.end).toBe("2026-10-30")
  })
  it("début de mois (< 5 jours) : mois précédent complet", () => {
    const p = signalPeriod(new Date("2026-12-04T10:00:00Z"))
    expect(p).toEqual({ start: "2026-11-01", end: "2026-11-30", month: 10, days: 30, daysInMonth: 30 })
  })
  it("passage d'année", () => {
    const p = signalPeriod(new Date("2027-01-03T10:00:00Z"))
    expect(p.start).toBe("2026-12-01")
    expect(p.end).toBe("2026-12-31")
    expect(p.month).toBe(11)
  })
})

describe("expectedNights", () => {
  const period = { start: "2026-11-01", end: "2026-11-15", month: 10, days: 15, daysInMonth: 30 }
  it("prorata de la normale mensuelle", () => {
    const normals = Array(12).fill(0)
    normals[10] = 6
    expect(expectedNights(normals, period)).toBe(3)
  })
  it("sans normale : null (jamais zéro)", () => {
    expect(expectedNights(undefined, period)).toBeNull()
  })
})

describe("comptages", () => {
  it("countDays ignore les valeurs nulles", () => {
    expect(countDays([-1, null, 2, -3], (v) => v < 0)).toBe(2)
  })
  it("trailingStreak compte la série finale", () => {
    expect(trailingStreak([36, 30, 35, 37, 38], (v) => v >= 35)).toBe(3)
    expect(trailingStreak([36, 37, null], (v) => v >= 35)).toBe(0)
  })
})

describe("impactStatus : le climat, pas la météo", () => {
  it("tendance de saison au-dessus du seuil", () => {
    expect(impactStatus(2.1, 1.5)).toBe("tendance")
  })
  it("tendance sous le seuil : en approche", () => {
    expect(impactStatus(0.8, 1.5)).toBe("approche")
  })
  it("impact national sans seuil", () => {
    expect(impactStatus(3, 0)).toBe("france")
  })
})

describe("extremesView", () => {
  const base = { max: 42, max_date: "2026-06-24", min: -4, min_date: "2026-01-05" }
  it("le « min » est le plus froid des ressentis maximaux", () => {
    const v = extremesView(base)
    expect(v.cold.label).toBe("Journée la plus froide")
    expect(v.cold.detail).toMatch(/ressenti maximal/)
    expect(v.cold.value).toBe(-4)
  })
  it("utilise le vrai minimum nocturne s'il existe", () => {
    const v = extremesView({ ...base, minTempLow: -9, minTempLowDate: "2026-01-06" })
    expect(v.cold.label).toBe("Nuit la plus froide")
    expect(v.cold.value).toBe(-9)
    expect(v.cold.date).toBe("2026-01-06")
  })
})

describe("textes", () => {
  it("isSummerNarrative", () => {
    expect(isSummerNarrative("Sur la Grand-Place en juillet, on était à 22°C")).toBe(true)
    expect(isSummerNarrative("En plein été, le port…")).toBe(true)
    expect(isSummerNarrative("La société locale s'adapte")).toBe(false)
  })
  it("saisons", () => {
    expect(theSeason("ete")).toBe("l'été")
    expect(inSeason("printemps")).toBe("au printemps")
  })
  it("mean1", () => {
    expect(mean1([1, null, 2])).toBe(1.5)
    expect(mean1([null, undefined])).toBeNull()
  })
})

describe("regionDescription", () => {
  it("13 régions, phrase d'hiver en novembre et d'été en juillet", () => {
    expect(Object.keys(REGIONS)).toHaveLength(13)
    for (const slug of Object.keys(REGIONS)) {
      expect(regionDescription(slug, 10)).toBe(REGIONS[slug].winter)
      expect(regionDescription(slug, 6)).toBe(REGIONS[slug].summer)
      expect(REGIONS[slug].winter).not.toMatch(/canicule|vague de chaleur/i)
    }
  })
  it("région inconnue", () => {
    expect(regionDescription("atlantide", 0)).toBeNull()
  })
})

describe("regionCrop", () => {
  const opts = { minSpan: 100, ratio: 4 / 3, maxW: 700, maxH: 640 }
  it("une seule ville : cadre minimal au bon rapport", () => {
    const c = regionCrop([[300, 300]], opts)
    expect(c.w).toBe(100)
    expect(c.h).toBe(75)
    expect(c.x).toBe(250)
  })
  it("reste dans la carte", () => {
    const c = regionCrop([[5, 5], [40, 30]], opts)
    expect(c.x).toBeGreaterThanOrEqual(0)
    expect(c.y).toBeGreaterThanOrEqual(0)
  })
})
