import { MYTHS } from "@/lib/myths"
import { mythStoryImage } from "@/lib/myth-image"

export const runtime = "nodejs"
export const revalidate = 86400

export function generateStaticParams() {
  return MYTHS.map((m) => ({ slug: m.slug }))
}

/** Image verticale 1080×1920 (format story TikTok / Instagram) d'une idée reçue. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const myth = MYTHS.find((m) => m.slug === slug)
  if (!myth) return new Response("Idée reçue introuvable", { status: 404 })
  return mythStoryImage(myth)
}
