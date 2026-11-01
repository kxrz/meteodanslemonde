import { describe, it, expect } from "vitest"
import { meteoUrl, meteoClientUrl } from "@/lib/open-meteo"

describe("Open-Meteo : clé payante facultative", () => {
  it("sans clé : API gratuite, aucune clé dans l'URL", () => {
    const u = meteoUrl("forecast", { latitude: "48.85,43.3", longitude: "2.35,5.37", daily: "apparent_temperature_max" }, "")
    expect(u.startsWith("https://api.open-meteo.com/v1/forecast?")).toBe(true)
    expect(u).toContain("latitude=48.85,43.3")
    expect(u).not.toContain("apikey")
  })
  it("avec clé : hôte client et apikey", () => {
    const u = meteoUrl("archive", { latitude: 1, longitude: 2, start_date: "2026-01-01" }, "SECRET")
    expect(u.startsWith("https://customer-archive-api.open-meteo.com/v1/archive?")).toBe(true)
    expect(u).toContain("apikey=SECRET")
  })
  it("paramètres vides ignorés", () => {
    expect(meteoUrl("forecast", { latitude: 1, longitude: 2, past_days: undefined }, "")).not.toContain("past_days")
  })
  it("URL client : relais interne, jamais de clé", () => {
    expect(meteoClientUrl("archive", { latitude: 1, longitude: 2 })).toBe("/api/meteo/archive?latitude=1&longitude=2")
  })
})
