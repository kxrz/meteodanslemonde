import { describe, it, expect } from "vitest"
import { briefingExample, exampleKind } from "@/lib/briefing-example"
import full from "@/data/climate-full.json"
import type { ClimateFull } from "@/lib/climate-season"

describe("exampleKind", () => {
  it("exemple d'hiver en novembre, d'été en juillet", () => {
    expect(exampleKind(10)).toBe("froid")
    expect(exampleKind(0)).toBe("froid")
    expect(exampleKind(6)).toBe("chaud")
    expect(exampleKind(4)).toBe("intersaison")
  })
})

describe("briefingExample", () => {
  const lyon = (full as unknown as Record<string, ClimateFull>).lyon

  it("part de la vraie normale du mois", () => {
    const ex = briefingExample("lyon", "Lyon", lyon, 10)!
    expect(ex.normal).toBe(lyon.normal[10])
    expect(ex.apparentTempMax).toBe(lyon.normal[10] + 4)
    expect(ex.tempMin).toBe(-1)
  })

  it("en juillet, pas de gel, et une projection d'été", () => {
    const ex = briefingExample("lyon", "Lyon", lyon, 6)!
    expect(ex.tempMin).toBeNull()
    expect(ex.projection?.year).toBe(2050)
    expect(ex.projection?.central).not.toBeNull()
  })

  it("null sans données", () => {
    expect(briefingExample("x", "X", undefined, 3)).toBeNull()
  })
})
