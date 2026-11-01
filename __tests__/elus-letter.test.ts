import { describe, it, expect } from "vitest"
import { buildLetter, letterFacts, theSeason } from "@/lib/elus-letter"
import full from "@/data/climate-full.json"
import type { ClimateFull } from "@/lib/climate-season"

const lyon = (full as unknown as Record<string, ClimateFull>).lyon

describe("buildLetter", () => {
  it("reprend les vrais chiffres de la ville et parle de l'automne en novembre", () => {
    const text = buildLetter(letterFacts("Lyon", lyon, 10))
    expect(text).toContain("à Lyon")
    expect(text).toContain(`la normale de novembre à Lyon (1991-2020) est de ${lyon.normal[10]} °C`)
    expect(text).toContain("l'automne")
    expect(text).toContain("d'ici 2050, l'automne pourrait y gagner encore")
    expect(text).not.toMatch(/canicule|8 à 15/)
  })

  it("affiche la fourchette seulement si elle n'est pas dégénérée", () => {
    const base = { city: "X", month: 6, season: "ete" as const, normalMonth: 27, trendSeason: 1.2 }
    expect(buildLetter({ ...base, proj2050: { central: 2, low: 1.5, high: 2.6 } })).toContain("selon les trajectoires")
    expect(buildLetter({ ...base, proj2050: { central: 2, low: 2, high: 2 } })).not.toContain("selon les trajectoires")
  })

  it("parle de chaleur en juillet seulement", () => {
    expect(buildLetter(letterFacts("Lyon", lyon, 6))).toContain("La chaleur est en France")
    expect(buildLetter(letterFacts("Lyon", lyon, 0))).not.toContain("La chaleur est en France")
  })

  it("sans ville : pas de chiffre inventé, une consigne", () => {
    const text = buildLetter(null)
    expect(text).toContain("[Choisissez votre ville")
    expect(text).not.toMatch(/°C/)
  })
})

describe("theSeason", () => {
  it("article correct", () => {
    expect(theSeason("printemps")).toBe("le printemps")
    expect(theSeason("ete")).toBe("l'été")
    expect(theSeason("hiver")).toBe("l'hiver")
  })
})
