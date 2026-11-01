import { OG_SIZE, twinsOg } from "@/lib/twins-og"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Jumeaux 2050 : votre ville en 2050 existe déjà · cestchaud.fr"

export default function Image() {
  return twinsOg({
    eyebrow: "Jumeaux 2050",
    before: "Votre ville en 2050",
    highlight: "existe déjà",
    after: ".",
    sub: "62 villes françaises comparées mois par mois aux normales de 67 villes du monde.",
  })
}
