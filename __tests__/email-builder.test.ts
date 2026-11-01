import { describe, it, expect } from "vitest"
import { buildDailyEmailHtml, dailyAdvice, anomalyColor, type CityEmailData } from "@/lib/email-builder"
import { confirmationEmailHtml, welcomeEmailHtml } from "@/lib/resend"
import { escapeHtml } from "@/lib/email-layout"
import { mythOfTheDay } from "@/lib/myths"

// ── buildDailyEmailHtml ────────────────────────────────────────────────────────

const city = (over: Partial<CityEmailData>): CityEmailData => ({
  slug: "lyon",
  name: "Lyon",
  apparentTempMax: 16,
  normal: 12,
  anomaly: 4.1,
  ...over,
})

describe("buildDailyEmailHtml", () => {
  const base = {
    firstName: "Marie",
    dateLabel: "dimanche 1 novembre",
    month: 10,
    cities: [] as CityEmailData[],
    unsubToken: "550e8400-e29b-41d4-a716-446655440000",
    date: new Date("2026-11-01T06:00:00Z"),
  }

  it("contient le prénom et la date", () => {
    const html = buildDailyEmailHtml(base)
    expect(html).toContain("Marie")
    expect(html).toContain("Dimanche 1 novembre")
  })

  it("échappe le prénom (pas d'injection HTML)", () => {
    const html = buildDailyEmailHtml({ ...base, firstName: "<b>Marie</b>" })
    expect(html).not.toContain("<b>Marie</b>")
    expect(html).toContain("&lt;b&gt;Marie&lt;/b&gt;")
  })

  it("les liens d'action mènent à des pages de confirmation, jamais à une API qui agit en GET", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({})] })
    expect(html).not.toContain("/api/confirm")
    expect(html).not.toContain("/api/unsubscribe")
    expect(html).toContain(`/profil/desabonnement?token=${base.unsubToken}`)
    expect(html).toContain(`/profil/desabonnement?token=${base.unsubToken}&amp;city=lyon`)
    expect(html).toContain(`/profil?token=${base.unsubToken}`)
  })

  it("formate les nombres à la française et parle de normale 1991-2020", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({ anomaly: 4.1, normal: 12 })] })
    expect(html).toContain("+4,1 °C par rapport à un novembre normal (12 °C)")
    expect(html).toContain("nettement au-dessus de la normale")
    expect(html).toContain("1991")
    expect(html).not.toContain("1981")
  })

  it("n'emploie pas de vocabulaire de chaleur pour un écart positif en hiver", () => {
    const html = buildDailyEmailHtml({ ...base, month: 0, cities: [city({ apparentTempMax: 9, normal: 6, anomaly: 3 })] })
    expect(html).not.toMatch(/chaleur/i)
    expect(html).not.toMatch(/canicule/i)
  })

  it("ne cite plus ERA5 « de la veille » ni l'UTCI", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({})] })
    expect(html).not.toContain("de la veille")
    expect(html).not.toContain("UTCI")
    expect(html).toContain("prévision Open-Meteo")
  })

  it("n'utilise pas display:flex (Outlook)", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({ climateTwin: { name: "Tunis", country: "Tunisie" } })] })
    expect(html).not.toContain("display:flex")
  })

  it("affiche la tendance et la projection saisonnière avec fourchette", () => {
    const html = buildDailyEmailHtml({
      ...base,
      cities: [city({ trend: 0.9, projection: { year: 2050, central: 1.4, low: 1.1, high: 1.9 } })],
    })
    expect(html).toContain("la normale de novembre a déjà bougé de <strong>+0,9 °C</strong>")
    expect(html).toContain("L'automne 2050 à Lyon : <strong>+1,4 °C</strong>")
    expect(html).toContain("entre +1,1 °C et +1,9 °C selon les scénarios")
  })

  it("signale une nuit de gel en saison froide", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({ apparentTempMax: 4, anomaly: -2, normal: 6, tempMin: -2 })] })
    expect(html).toContain("Nuit de gel")
  })

  it("affiche « chaleur qui dure » quand le ressenti ≥ 35 °C depuis 3 jours", () => {
    const html = buildDailyEmailHtml({ ...base, month: 6, cities: [city({ apparentTempMax: 38, normal: 30, anomaly: 8, caniculeStreak: 4 })] })
    expect(html).toContain("Chaleur qui dure")
    expect(html).toContain("4 jours")
    expect(html).toContain("vigilance.meteofrance.fr")
  })

  it("pas de bloc chaleur sous 3 jours", () => {
    const html = buildDailyEmailHtml({ ...base, month: 6, cities: [city({ apparentTempMax: 31, normal: 29, anomaly: 2, caniculeStreak: 1 })] })
    expect(html).not.toContain("Chaleur qui dure")
  })

  it("affiche le jumeau du jour", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({ climateTwin: { name: "Madrid", country: "Espagne" } })] })
    expect(html).toContain("Madrid")
    expect(html).toContain("Espagne")
  })

  it("un ressenti de 0 °C est une vraie valeur, pas une donnée manquante", () => {
    const html = buildDailyEmailHtml({ ...base, month: 0, cities: [city({ apparentTempMax: 0, normal: 4, anomaly: -4 })] })
    expect(html).not.toContain("Relevé indisponible")
    expect(html).toContain("0°")
  })

  it("état explicite quand le relevé manque", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({ slug: "brest", name: "Brest", apparentTempMax: null, anomaly: null, normal: null })] })
    expect(html).toContain("Brest")
    expect(html).toContain("Relevé indisponible")
  })

  it("plusieurs villes", () => {
    const html = buildDailyEmailHtml({ ...base, cities: [city({}), city({ slug: "lille", name: "Lille" })] })
    expect(html).toContain("Lyon")
    expect(html).toContain("Lille")
    expect(html).toContain("vos 2 villes")
  })

  it("contient l'idée reçue du jour avec son lien", () => {
    const html = buildDailyEmailHtml(base)
    const myth = mythOfTheDay("automne", base.date)
    expect(html).toContain("Idée reçue du jour")
    expect(html).toContain(`/idees-recues#${myth.slug}`)
  })
})

describe("dailyAdvice", () => {
  it("rien un jour ordinaire", () => {
    expect(dailyAdvice({ apparentTempMax: 14, tempMin: 6 })).toBeNull()
  })
  it("chaleur forte à 35 °C", () => {
    expect(dailyAdvice({ apparentTempMax: 35, tempMin: 20 })?.title).toBe("Forte chaleur")
  })
  it("gel quand la minimale passe sous 0", () => {
    expect(dailyAdvice({ apparentTempMax: 5, tempMin: -1 })?.title).toBe("Nuit de gel")
  })
  it("froid marqué sous −5 °C ressenti", () => {
    expect(dailyAdvice({ apparentTempMax: -7, tempMin: null })?.title).toBe("Froid marqué")
  })
})

describe("anomalyColor", () => {
  it("rouge au-dessus, bleu en dessous, encre autour de la normale", () => {
    expect(anomalyColor(2)).toBe("#e3261b")
    expect(anomalyColor(-2)).toBe("#1d4ed8")
    expect(anomalyColor(0.2)).toBe("#111111")
  })
})

describe("escapeHtml", () => {
  it("échappe les caractères HTML", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;")
  })
})

// ── confirmationEmailHtml ─────────────────────────────────────────────────────

describe("confirmationEmailHtml", () => {
  it("contient le prénom, la ville et l'URL", () => {
    const url = "https://cestchaud.fr/profil/confirmer?token=abc"
    const html = confirmationEmailHtml({ firstName: "Paul", cityName: "Nantes", confirmUrl: url })
    expect(html).toContain("Paul")
    expect(html).toContain("Nantes")
    expect(html).toContain(url)
  })

  it("ne promet pas une expiration que le code n'applique pas", () => {
    const html = confirmationEmailHtml({ firstName: "Paul", cityName: "Nantes", confirmUrl: "https://example.com" })
    expect(html).not.toContain("expire")
    expect(html).not.toContain("—")
  })
})

// ── welcomeEmailHtml ──────────────────────────────────────────────────────────

describe("welcomeEmailHtml", () => {
  it("contient le prénom et le lien du profil", () => {
    const html = welcomeEmailHtml({ firstName: "Sophie", cityName: "Lyon", profilUrl: "https://cestchaud.fr/profil?token=xyz" })
    expect(html).toContain("Sophie")
    expect(html).toContain("https://cestchaud.fr/profil?token=xyz")
  })

  it("décrit le contenu réel du briefing, avec la bonne période de référence", () => {
    const html = welcomeEmailHtml({ firstName: "Sophie", cityName: "Lyon", profilUrl: "https://example.com" })
    expect(html).toContain("ressenti maximal")
    expect(html).toContain("1991-2020")
    expect(html).toContain("GIEC")
    expect(html).toContain("idée reçue")
    expect(html).not.toContain("1981")
    expect(html).not.toContain("UTCI")
  })
})
