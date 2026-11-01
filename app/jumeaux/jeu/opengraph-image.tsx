import { OG_SIZE, twinsOg } from "@/lib/twins-og"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Le jeu des jumeaux 2050 · cestchaud.fr"

export default function Image() {
  return twinsOg({
    eyebrow: "Le jeu · 5 questions · 1 minute",
    before: "Le jeu des",
    highlight: "jumeaux 2050",
    after: "",
    sub: "Quelle ville du monde vit déjà le climat de la vôtre en 2050 ? Nouvelle série chaque jour.",
  })
}
