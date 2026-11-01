import { MYTHS } from "@/lib/myths"
import { mythOgImage } from "@/lib/myth-image"

export const runtime = "nodejs"
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Idée reçue sur le climat, et la réponse"

export function generateStaticParams() {
  return MYTHS.map((m) => ({ slug: m.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return mythOgImage(MYTHS.find((m) => m.slug === slug) ?? MYTHS[0])
}
