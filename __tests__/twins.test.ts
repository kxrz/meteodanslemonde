import { describe, expect, it } from "vitest"
import { climate2050, findTwins2050, rankTwins, rmse, sameWeatherToday, similarityScore, smooth3, TWIN_MAX_RMSE, warming2050, type TwinClimate } from "@/lib/twins"
import climateFull from "@/data/climate-full.json"
import citiesFR from "@/data/cities-fr.json"
import citiesWorld from "@/data/cities-world.json"

const flat = (v: number) => Array(12).fill(v) as number[]
const sine = (mean: number, amp: number) => Array.from({ length: 12 }, (_, i) => mean - amp * Math.cos((2 * Math.PI * (i - 0.5)) / 12))

describe("smooth3", () => {
  it("est circulaire (décembre voisine janvier)", () => {
    const v = [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const s = smooth3(v)
    expect(s[0]).toBe(1)
    expect(s[1]).toBe(1)
    expect(s[11]).toBe(1)
    expect(s[5]).toBe(0)
  })
})

describe("warming2050", () => {
  it("lisse la projection sur 3 mois", () => {
    const proj = flat(1)
    proj[6] = 4
    const w = warming2050({ normal: flat(10), trend: flat(0), ssp245: { proj2050: proj } })
    expect(w[6]).toBe(2)
    expect(w[5]).toBe(2)
    expect(w[0]).toBe(1)
  })

  it("ne descend jamais sous la tendance observée lissée", () => {
    const w = warming2050({ normal: flat(10), trend: flat(2), ssp245: { proj2050: flat(0.5) } })
    expect(w.every((v) => v === 2)).toBe(true)
  })

  it("traite une projection manquante comme 0 avant le plancher", () => {
    const w = warming2050({ normal: flat(10), trend: flat(0.3), ssp245: { proj2050: Array(12).fill(null) } })
    expect(w.every((v) => Math.abs(v - 0.3) < 1e-9)).toBe(true)
  })

  it("climate2050 = normale + réchauffement", () => {
    const c = climate2050({ normal: flat(10), trend: flat(0), ssp245: { proj2050: flat(1.5) } })
    expect(c.every((v) => v === 11.5)).toBe(true)
  })
})

describe("rankTwins (synthétique)", () => {
  const world = [
    { id: "a", name: "Pareil", country: "X" },
    { id: "b", name: "Un peu plus chaud", country: "X" },
    { id: "c", name: "Sud", country: "Y" },
    { id: "d", name: "Tropiques", country: "Z" },
  ]
  const target = sine(15, 10)
  const climate: Record<string, TwinClimate> = {
    a: { normal: target.map((v) => v + 0.2), trend: flat(0) },
    b: { normal: target.map((v) => v + 1.5), trend: flat(0) },
    // hémisphère sud : même moyenne, saisons inversées
    c: { normal: sine(15, -10), trend: flat(0) },
    d: { normal: flat(32), trend: flat(0) },
  }

  it("classe par écart quadratique moyen et garde les 3 meilleurs", () => {
    const r = rankTwins(target, world, climate)
    expect(r.top.map((t) => t.id)).toEqual(["a", "b", "c"])
    expect(r.top[0].rmse).toBeCloseTo(0.2, 5)
    expect(r.top[0].bias).toBeCloseTo(0.2, 5)
    expect(r.top[0].score).toBe(similarityScore(0.2))
    expect(r.hasCloseTwin).toBe(true)
    expect(r.ranking).toHaveLength(4)
  })

  it("exclut naturellement l'hémisphère sud (saisons inversées)", () => {
    const r = rankTwins(target, world, climate)
    const south = r.ranking.find((x) => x.id === "c")!
    expect(south.rmse).toBeGreaterThan(TWIN_MAX_RMSE)
  })

  it("indique la saison la plus et la moins ressemblante", () => {
    const n = target.map((v) => v)
    // le jumeau est identique sauf en été (+3 °C)
    n[5] += 3; n[6] += 3; n[7] += 3
    const r = rankTwins(target, [{ id: "e", name: "E", country: "E" }], { e: { normal: n, trend: flat(0) } })
    expect(r.top[0].worst.season).toBe("ete")
    expect(r.top[0].worst.diff).toBeCloseTo(3, 5)
    expect(r.top[0].best.abs).toBe(0)
  })

  it("dit honnêtement quand aucun jumeau n'est proche", () => {
    const r = rankTwins(flat(-20), world, climate)
    expect(r.hasCloseTwin).toBe(false)
  })

  it("ignore les villes sans normale", () => {
    const r = rankTwins(target, [...world, { id: "z", name: "Sans données", country: "?" }], climate)
    expect(r.ranking.find((x) => x.id === "z")).toBeUndefined()
  })

  it("rmse est symétrique et nul pour deux courbes identiques", () => {
    expect(rmse(target, target)).toBe(0)
    expect(rmse(flat(1), flat(3))).toBe(2)
  })
})

describe("findTwins2050 (vraies données)", () => {
  const climate = climateFull as unknown as Record<string, TwinClimate>
  const latOf = (id: string) => (citiesWorld as { id: string; lat: number }[]).find((c) => c.id === id)!.lat

  it("Paris trouve un jumeau plus au sud, dans l'hémisphère nord", () => {
    const r = findTwins2050("paris", citiesWorld, climate)!
    expect(r.top).toHaveLength(3)
    expect(r.hasCloseTwin).toBe(true)
    const lat = latOf(r.top[0].id)
    expect(lat).toBeLessThan(48.85)
    expect(lat).toBeGreaterThan(0)
  })

  it("la cible 2050 de Paris est plus chaude que sa normale chaque mois", () => {
    const r = findTwins2050("paris", citiesWorld, climate)!
    const normal = climate.paris.normal
    r.target.forEach((v, i) => expect(v).toBeGreaterThan(normal[i]))
  })

  it("chaque ville française a un résultat et aucun jumeau de l'hémisphère sud", () => {
    for (const c of citiesFR) {
      const r = findTwins2050(c.id, citiesWorld, climate)
      expect(r, c.id).not.toBeNull()
      expect(latOf(r!.top[0].id), c.id).toBeGreaterThan(0)
    }
  })

  it("renvoie null pour une ville inconnue", () => {
    expect(findTwins2050("atlantide", citiesWorld, climate)).toBeNull()
  })
})

describe("sameWeatherToday", () => {
  it("garde les villes à ±4 °C, les plus proches d'abord", () => {
    const w = [{ id: "a", apparent_temp_max: 10 }, { id: "b", apparent_temp_max: 13 }, { id: "c", apparent_temp_max: 20 }, { id: "d", apparent_temp_max: 11 }]
    expect(sameWeatherToday(10, w).map((x) => x.id)).toEqual(["a", "d", "b"])
  })
})
