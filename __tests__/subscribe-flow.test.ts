import { describe, it, expect } from "vitest"
import { isValidEmail, normalizeFirstName, isToken, resolveBriefingCity, subscribeErrorMessage, RETENTION } from "@/lib/subscription"
import citiesFR from "@/data/cities-fr.json"

// Logique pure du parcours d'abonnement (sans base de données)

describe("isValidEmail", () => {
  it("accepte une adresse standard", () => {
    expect(isValidEmail("marie@example.com")).toBe(true)
    expect(isValidEmail("  marie@example.com ")).toBe(true)
  })
  it("refuse vide, sans @ ou sans domaine", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail("marieatexample.com")).toBe(false)
    expect(isValidEmail("marie@example")).toBe(false)
  })
})

describe("normalizeFirstName", () => {
  it("retire les espaces superflus", () => {
    expect(normalizeFirstName("  Jean   Paul  ")).toBe("Jean Paul")
  })
  it("chaîne vide si seulement des espaces", () => {
    expect(normalizeFirstName("   ")).toBe("")
    expect(normalizeFirstName(null)).toBe("")
  })
  it("tronque à 80 caractères", () => {
    expect(normalizeFirstName("a".repeat(200))).toHaveLength(80)
  })
})

describe("isToken", () => {
  it("accepte un UUID", () => {
    expect(isToken("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })
  it("refuse le reste (évite une erreur Postgres sur un jeton malformé)", () => {
    expect(isToken("not-a-uuid")).toBe(false)
    expect(isToken("")).toBe(false)
    expect(isToken(null)).toBe(false)
    expect(isToken("unsub")).toBe(false)
  })
})

describe("resolveBriefingCity", () => {
  it("retrouve une ville par son slug d'inscription", () => {
    expect(resolveBriefingCity("lyon", citiesFR)?.id).toBe("lyon")
  })
  it("relie le slug « clermont-ferrand » à l'identifiant de données « clermont »", () => {
    expect(resolveBriefingCity("clermont-ferrand", citiesFR)?.id).toBe("clermont")
  })
  it("gère les accents (Saint-Étienne)", () => {
    const c = citiesFR.find((x) => x.name.startsWith("Saint-É"))
    if (c) expect(resolveBriefingCity("saint-etienne", citiesFR)?.id).toBe(c.id)
  })
  it("refuse une commune hors liste", () => {
    expect(resolveBriefingCity("trifouilly-les-oies", citiesFR)).toBeNull()
  })
  it("couvre les 62 villes suivies", () => {
    expect(citiesFR).toHaveLength(62)
  })
})

describe("subscribeErrorMessage", () => {
  it("reformule les erreurs serveur en français clair", () => {
    expect(subscribeErrorMessage(400, "invalid-email")).toMatch(/adresse email/)
    expect(subscribeErrorMessage(502, "email-failed")).toMatch(/pas parti/)
    expect(subscribeErrorMessage(500)).toMatch(/ne répond pas/)
    expect(subscribeErrorMessage(429)).toMatch(/minute/)
  })
})

describe("RETENTION", () => {
  it("décrit ce que fait le code : rien n'est effacé au désabonnement, tout l'est à la suppression", () => {
    expect(RETENTION.long).toMatch(/restent dans notre base/)
    expect(RETENTION.long).toMatch(/supprimiez votre compte/)
    expect(RETENTION.long).not.toMatch(/3 ans|30 jours/)
  })
})
