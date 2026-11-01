import { describe, it, expect } from "vitest"
import {
  deckFor, expectedFrostSeason, expectedFrostToDate, mythsInPageOrder, nextPos, parseDeroule, prevPos,
  resolveCitySlug, slideFromHash, splitHighlight, workshopMyths,
} from "@/lib/pedago"
import { MYTHS } from "@/lib/myths"
import { mythFact, mythShareText } from "@/lib/myth-facts"

describe("chiffre partageable", () => {
  const base = { cityName: "Paris", month: 10, trend: 1.8, shiftDays: 12, frost: null, extremesMin: -4, aboveCount: 40, totalCities: 62, summer2050: 1.6 }
  const bySlug = (s: string) => MYTHS.find((m) => m.slug === s)!
  it("une phrase avec le chiffre de la ville", () => {
    expect(mythFact(bySlug("il-gele-donc"), base)).toBe("À Paris, la normale de novembre a déjà pris +1,8\u202f°C en 30 ans.")
    expect(mythFact(bySlug("un-degre-cest-rien"), base)).toBe("À Paris, novembre a glissé de 12 jours en 30 ans.")
    expect(mythFact(bySlug("vague-de-froid-preuve"), base)).toContain("−4\u202f°C")
  })
  it("donnée absente : pas de chiffre inventé", () => {
    expect(mythFact(bySlug("pas-de-gel-tant-mieux"), base)).toBeNull()
    expect(mythFact(bySlug("il-a-neige"), base)).toBeNull()
    expect(mythShareText(bySlug("il-a-neige"), null)).toContain("l'enneigement moyen")
    expect(mythShareText(bySlug("il-gele-donc"), "X.")).toBe("« Il gèle ce matin. Le réchauffement, c'est du flan. » En vrai : X.")
  })
})

const cities = [
  { id: "lille", name: "Lille" },
  { id: "paris", name: "Paris" },
  { id: "saint-etienne", name: "Saint-Étienne" },
]

describe("choix de ville", () => {
  it("par identifiant, par nom, sinon Paris", () => {
    expect(resolveCitySlug(cities, "lille").id).toBe("lille")
    expect(resolveCitySlug(cities, "Saint-Étienne").id).toBe("saint-etienne")
    expect(resolveCitySlug(cities, ["saint-etienne", "lille"]).id).toBe("saint-etienne")
    expect(resolveCitySlug(cities, "atlantide").id).toBe("paris")
    expect(resolveCitySlug(cities, undefined).id).toBe("paris")
  })
})

describe("surlignage de la réponse", () => {
  it("découpe autour du passage", () => {
    expect(splitHighlight("Oui. Mais ils sont devenus la règle, pas l'exception.", "la règle")).toEqual([
      { text: "Oui. Mais ils sont devenus ", hl: false },
      { text: "la règle", hl: true },
      { text: ", pas l'exception.", hl: false },
    ])
  })
  it("passage en fin de phrase ou absent", () => {
    expect(splitHighlight("Le climat de votre ville existe déjà", "existe déjà").map((p) => p.hl)).toEqual([false, true])
    expect(splitHighlight("Rien à surligner.", "absent")).toEqual([{ text: "Rien à surligner.", hl: false }])
  })
  it("chaque idée reçue contient bien son passage surligné", () => {
    for (const m of MYTHS) expect(m.answer.includes(m.highlight), m.slug).toBe(true)
  })
})

describe("ordre des idées reçues", () => {
  it("saison d'abord, toutes présentes une seule fois", () => {
    for (const s of ["hiver", "printemps", "ete", "automne"] as const) {
      const { current, others } = mythsInPageOrder(s)
      expect(current.every((m) => m.seasons.includes(s))).toBe(true)
      expect(current.length + others.length).toBe(MYTHS.length)
      expect(new Set([...current, ...others]).size).toBe(MYTHS.length)
    }
  })
  it("trois idées reçues pour l'atelier, sans le jumeau, en toute saison", () => {
    for (const s of ["hiver", "printemps", "ete", "automne"] as const) {
      const list = workshopMyths(s)
      expect(list).toHaveLength(3)
      expect(list.some((m) => m.module === "twins")).toBe(false)
      expect(new Set(list).size).toBe(3)
    }
    expect(workshopMyths("hiver").every((m) => m.seasons.includes("hiver"))).toBe(true)
  })
})

describe("nuits de gel attendues", () => {
  const monthly = [10, 8, 4, 1, 0, 0, 0, 0, 0, 1, 4, 8] // 36 par saison
  it("cumul depuis le 1er août, mois en cours au prorata", () => {
    expect(expectedFrostToDate(monthly, new Date(2026, 7, 15))).toBe(0)
    expect(expectedFrostToDate(monthly, new Date(2026, 9, 31))).toBe(1)
    expect(expectedFrostToDate(monthly, new Date(2026, 10, 15))).toBe(3) // 1 + 4 × 15/30
    expect(expectedFrostToDate(monthly, new Date(2027, 0, 31))).toBe(23)
    expect(expectedFrostToDate(monthly, new Date(2027, 6, 31))).toBe(36)
  })
  it("total de la saison", () => {
    expect(expectedFrostSeason(monthly)).toBe(36)
  })
})

describe("déroulé du mode projection", () => {
  it("45 min = 10 diapos, 15 min = 6 diapos", () => {
    expect(deckFor("45", true)).toHaveLength(10)
    expect(deckFor("15", true)).toHaveLength(6)
    expect(deckFor("15", true)[0].kind).toBe("today")
    expect(deckFor("15", true).at(-1)?.kind).toBe("act")
    expect(parseDeroule("15")).toBe("15")
    expect(parseDeroule(undefined)).toBe("45")
    expect(parseDeroule("90")).toBe("45")
  })
  it("sans relevé du jour, pas de révélation de l'écart", () => {
    expect(deckFor("45", false)[1].steps).toBe(2)
  })
  it("suivant révèle d'abord, puis change de diapo ; précédent revient sur la diapo révélée", () => {
    const deck = deckFor("45", true)
    let pos = { slide: 0, step: 0 }
    pos = nextPos(deck, pos)
    expect(pos).toEqual({ slide: 0, step: 1 })
    pos = nextPos(deck, pos)
    expect(pos).toEqual({ slide: 1, step: 0 })
    expect(prevPos(deck, pos)).toEqual({ slide: 0, step: 1 })
    expect(prevPos(deck, { slide: 0, step: 0 })).toEqual({ slide: 0, step: 0 })
    const last = { slide: deck.length - 1, step: 0 }
    expect(nextPos(deck, last)).toEqual(last)
  })
  it("diapo dans le hash", () => {
    expect(slideFromHash("#d3", 10)).toBe(2)
    expect(slideFromHash("d1", 10)).toBe(0)
    expect(slideFromHash("#d99", 6)).toBe(5)
    expect(slideFromHash("", 6)).toBe(0)
    expect(slideFromHash("#truc", 6)).toBe(0)
  })
})
