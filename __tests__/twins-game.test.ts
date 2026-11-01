import { describe, expect, it } from "vitest"
import { anomalyCategory, anomalyChoices, buildQuiz, daySeed, DISTRACTOR_MIN_GAP, QUIZ_LENGTH, rng, type GameCity } from "@/lib/twins-game"
import { findTwins2050, type TwinClimate } from "@/lib/twins"
import climateFull from "@/data/climate-full.json"
import citiesFR from "@/data/cities-fr.json"
import citiesWorld from "@/data/cities-world.json"

const climate = climateFull as unknown as Record<string, TwinClimate>

function pool(withToday: boolean, month = 10): GameCity[] {
  return citiesFR.map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: c.id,
    ranking: findTwins2050(c.id, citiesWorld, climate)!.ranking,
    today: withToday ? { temp: climate[c.id].normal[month] + ((i % 9) - 3), normal: climate[c.id].normal[month] } : null,
  }))
}

describe("rng / daySeed", () => {
  it("est reproductible", () => {
    const a = rng(42), b = rng(42)
    for (let i = 0; i < 5; i++) expect(a()).toBe(b())
  })
  it("daySeed lit la date UTC", () => {
    expect(daySeed(new Date("2026-11-01T06:00:00Z"))).toBe(20261101)
  })
})

describe("anomalyCategory", () => {
  it("découpe aux bonnes bornes", () => {
    expect(anomalyCategory(-2)).toBe(0)
    expect(anomalyCategory(-1.5)).toBe(1)
    expect(anomalyCategory(0)).toBe(1)
    expect(anomalyCategory(1.5)).toBe(1)
    expect(anomalyCategory(2)).toBe(2)
    expect(anomalyCategory(4.4)).toBe(2)
    expect(anomalyCategory(4.5)).toBe(3)
  })
  it("parle de « doux » en hiver et de « chaud » en été", () => {
    expect(anomalyChoices(10)[2]).toContain("doux")
    expect(anomalyChoices(0)[3]).toContain("doux")
    expect(anomalyChoices(6)[2]).toContain("chaud")
  })
})

describe("buildQuiz", () => {
  const world = citiesWorld.map((w) => ({ id: w.id, name: w.name, country: w.country }))

  it("est déterministe pour une même graine et change avec la graine", () => {
    const a = buildQuiz(pool(true), world, 20261101, 10)
    const b = buildQuiz(pool(true), world, 20261101, 10)
    const c = buildQuiz(pool(true), world, 20261102, 10)
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(c))
  })

  it("donne toujours 5 questions, en mêlant jumeaux et écarts du jour", () => {
    const q = buildQuiz(pool(true), world, 1, 10)
    expect(q).toHaveLength(QUIZ_LENGTH)
    expect(q.map((x) => x.kind)).toEqual(["twin", "anomaly", "twin", "anomaly", "twin"])
    expect(new Set(q.map((x) => x.city.id)).size).toBe(QUIZ_LENGTH)
  })

  it("reste jouable sans relevé du jour (5 questions de jumeaux)", () => {
    const q = buildQuiz(pool(false), world, 7, 1)
    expect(q).toHaveLength(QUIZ_LENGTH)
    expect(q.every((x) => x.kind === "twin")).toBe(true)
  })

  it("fonctionne en toute saison (même en janvier et en juillet)", () => {
    for (const m of [0, 6, 10]) expect(buildQuiz(pool(true, m), world, 3, m)).toHaveLength(QUIZ_LENGTH)
  })

  it("le bon jumeau est le premier du classement et les distracteurs sont nettement plus loin", () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const q of buildQuiz(pool(true), world, seed, 10)) {
        if (q.kind !== "twin") continue
        expect(q.choices).toHaveLength(4)
        const right = q.choices[q.answer]
        const rank = findTwins2050(q.city.id, citiesWorld, climate)!.ranking
        expect(right.id).toBe(rank[0].id)
        q.choices.forEach((c, i) => {
          if (i !== q.answer) expect(c.rmse).toBeGreaterThanOrEqual(right.rmse + DISTRACTOR_MIN_GAP)
        })
        expect(new Set(q.choices.map((c) => c.id)).size).toBe(4)
      }
    }
  })

  it("la réponse à l'écart du jour correspond à la catégorie", () => {
    for (const q of buildQuiz(pool(true), world, 11, 10)) {
      if (q.kind !== "anomaly") continue
      expect(q.anomaly).toBeCloseTo(q.temp - q.normal, 5)
      expect(q.answer).toBe(anomalyCategory(q.anomaly))
      expect(q.choices).toHaveLength(4)
    }
  })
})
