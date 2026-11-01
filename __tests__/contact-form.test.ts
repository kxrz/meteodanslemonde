import { describe, it, expect } from "vitest"
import { validateContact } from "@/components/ContactForm"

describe("validateContact", () => {
  it("aucune erreur pour un message complet", () => {
    expect(validateContact({ name: "Paul", email: "paul@example.com", message: "Bonjour" })).toEqual({})
  })
  it("une erreur par champ manquant ou invalide", () => {
    const e = validateContact({ name: " ", email: "paul@", message: "" })
    expect(e.name).toBeTruthy()
    expect(e.email).toMatch(/valide/)
    expect(e.message).toBeTruthy()
  })
  it("refuse un message trop long", () => {
    expect(validateContact({ name: "P", email: "p@x.fr", message: "a".repeat(5001) }).message).toMatch(/trop long/)
  })
})
