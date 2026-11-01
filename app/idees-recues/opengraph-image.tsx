import { MYTHS } from "@/lib/myths"
import { mythOgImage } from "@/lib/myth-image"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Il fait froid, donc… non. Les idées reçues sur le climat, démontées."

export default async function Image() {
  return mythOgImage(MYTHS[0])
}
