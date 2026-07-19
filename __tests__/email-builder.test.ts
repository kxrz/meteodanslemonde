import { describe, it, expect } from "vitest"
import { buildDailyEmailHtml } from "@/lib/email-builder"
import { confirmationEmailHtml, welcomeEmailHtml } from "@/lib/resend"

// ── buildDailyEmailHtml ────────────────────────────────────────────────────────

describe("buildDailyEmailHtml", () => {
  const base = {
    firstName: "Marie",
    dateLabel: "lundi 1 juillet",
    month: 6,
    cities: [],
    unsubToken: "test-token-123",
  }

  it("contains the subscriber first name", () => {
    const html = buildDailyEmailHtml(base)
    expect(html).toContain("Marie")
  })

  it("contains the date label", () => {
    const html = buildDailyEmailHtml(base)
    expect(html).toContain("lundi 1 juillet")
  })

  it("links to /profil not /api/confirm for unsubscribe", () => {
    const html = buildDailyEmailHtml(base)
    expect(html).not.toContain("/api/confirm")
    expect(html).toContain("/profil?token=test-token-123")
  })

  it("includes city block for each city", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "bordeaux", name: "Bordeaux", apparentTempMax: 35, anomaly: 3, proj2050: 2.5, normal: 32, caniculeStreak: 0 },
      ],
    })
    expect(html).toContain("Bordeaux")
    expect(html).toContain("35")
  })

  it("shows canicule alert when streak >= 3", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "lyon", name: "Lyon", apparentTempMax: 38, anomaly: 5, proj2050: 3, normal: 33, caniculeStreak: 4 },
      ],
    })
    expect(html).toContain("Alerte canicule")
    expect(html).toContain("4 jour")
  })

  it("does not show canicule alert when streak < 3", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "lyon", name: "Lyon", apparentTempMax: 36, anomaly: 2, proj2050: 3, normal: 34, caniculeStreak: 1 },
      ],
    })
    expect(html).not.toContain("Alerte canicule")
  })

  it("shows climate twin when provided", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "paris", name: "Paris", apparentTempMax: 32, anomaly: 4, proj2050: 2, normal: 28, climateTwin: { name: "Madrid", country: "Espagne" } },
      ],
    })
    expect(html).toContain("Madrid")
    expect(html).toContain("Espagne")
  })

  it("includes profil management link in each city block", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "nice", name: "Nice", apparentTempMax: 34, anomaly: 2, proj2050: null, normal: 32 },
      ],
    })
    expect(html).toContain("Gerer mon profil")
    expect(html).toContain("/profil?token=test-token-123")
  })

  it("renders fallback message when apparentTempMax is null", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "brest", name: "Brest", apparentTempMax: null, anomaly: null, proj2050: null, normal: null },
      ],
    })
    expect(html).toContain("Brest")
    expect(html).toContain("Données météo indisponibles")
  })

  it("handles multiple cities", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [
        { slug: "bordeaux", name: "Bordeaux", apparentTempMax: 36, anomaly: 3, proj2050: 2, normal: 33 },
        { slug: "lille", name: "Lille", apparentTempMax: 28, anomaly: 1, proj2050: 1.5, normal: 27 },
      ],
    })
    expect(html).toContain("Bordeaux")
    expect(html).toContain("Lille")
    expect(html).toContain("vos 2 villes")
  })
})

// ── confirmationEmailHtml ─────────────────────────────────────────────────────

describe("confirmationEmailHtml", () => {
  it("contains the first name and city", () => {
    const html = confirmationEmailHtml({ firstName: "Paul", cityName: "Nantes", confirmUrl: "https://example.com/confirm" })
    expect(html).toContain("Paul")
    expect(html).toContain("Nantes")
  })

  it("contains the confirmation URL", () => {
    const url = "https://cestchaud.fr/api/confirm?token=abc"
    const html = confirmationEmailHtml({ firstName: "Paul", cityName: "Nantes", confirmUrl: url })
    expect(html).toContain(url)
  })

  it("does not contain em dashes", () => {
    const html = confirmationEmailHtml({ firstName: "Paul", cityName: "Nantes", confirmUrl: "https://example.com" })
    expect(html).not.toContain("—")
  })
})

// ── welcomeEmailHtml ──────────────────────────────────────────────────────────

describe("welcomeEmailHtml", () => {
  it("contains first name and profil URL", () => {
    const html = welcomeEmailHtml({ firstName: "Sophie", cityName: "Lyon", profilUrl: "https://cestchaud.fr/profil?token=xyz" })
    expect(html).toContain("Sophie")
    expect(html).toContain("https://cestchaud.fr/profil?token=xyz")
  })

  it("mentions the 5 briefing perks", () => {
    const html = welcomeEmailHtml({ firstName: "Sophie", cityName: "Lyon", profilUrl: "https://example.com" })
    expect(html).toContain("ressenti max")
    expect(html).toContain("anomalie")
    expect(html).toContain("canicule")
    expect(html).toContain("jumeau climatique")
    expect(html).toContain("GIEC")
  })

  it("links to the profil page", () => {
    const html = welcomeEmailHtml({ firstName: "Sophie", cityName: "Lyon", profilUrl: "https://cestchaud.fr/profil?token=xyz" })
    expect(html).toContain("profil")
  })
})
