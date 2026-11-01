import type { NextRequest } from "next/server"
import { storyImage } from "@/lib/story-image"

export const runtime = "nodejs"

/** Story verticale du score : /jumeaux/jeu/story?r=10110 (1 = bonne réponse, 0 = ratée). */
export async function GET(req: NextRequest) {
  const r = (req.nextUrl.searchParams.get("r") ?? "").replace(/[^01]/g, "").slice(0, 10)
  const total = r.length
  const score = r.split("").filter((c) => c === "1").length
  if (!total) {
    return storyImage({ eyebrow: "Le jeu des jumeaux 2050", headline: "Votre ville en 2050 existe déjà ailleurs.", highlight: "existe déjà", tone: "signal", footer: "cestchaud.fr/jumeaux/jeu" })
  }
  const label = `${score}/${total}`
  const size = Math.min(150, Math.floor(860 / total) - 20)
  return storyImage({
    eyebrow: "Le jeu des jumeaux 2050",
    headline: `J'ai fait ${label} au jeu des jumeaux 2050.`,
    highlight: label,
    tone: score >= Math.ceil(total * 0.6) ? "signal" : "chaud",
    sub: "Quelle ville du monde vit déjà le climat de la vôtre en 2050 ? À vous de jouer.",
    footer: "cestchaud.fr/jumeaux/jeu",
    visual: (
      <div style={{ display: "flex", gap: 20 }}>
        {r.split("").map((c, i) => (
          <div key={i} style={{ display: "flex", width: size, height: size, borderRadius: 28, background: c === "1" ? "#111111" : "#ebe9e2", border: "8px solid #111111" }} />
        ))}
      </div>
    ),
  })
}
