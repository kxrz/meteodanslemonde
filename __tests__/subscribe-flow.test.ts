import { describe, it, expect } from "vitest"

// Tests sur les validations du flow d'abonnement (logique pure, sans DB)

describe("email validation", () => {
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  it("accepts a standard email", () => {
    expect(isValidEmail("marie@example.com")).toBe(true)
  })

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false)
  })

  it("rejects email without @", () => {
    expect(isValidEmail("marieatexample.com")).toBe(false)
  })

  it("rejects email without TLD", () => {
    expect(isValidEmail("marie@example")).toBe(false)
  })
})

describe("firstName normalization", () => {
  function normalizeFirstName(s: string) {
    return s.trim()
  }

  it("trims whitespace", () => {
    expect(normalizeFirstName("  Paul  ")).toBe("Paul")
  })

  it("returns empty string when only spaces", () => {
    expect(normalizeFirstName("   ")).toBe("")
  })
})

describe("UDID token format", () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  it("validates UUID v4 format", () => {
    expect(UUID_RE.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })

  it("rejects non-UUID strings", () => {
    expect(UUID_RE.test("not-a-uuid")).toBe(false)
    expect(UUID_RE.test("")).toBe(false)
    expect(UUID_RE.test("unsub")).toBe(false)
  })
})
