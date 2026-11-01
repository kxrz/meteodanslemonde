import { MYTHS } from "@/lib/myths"
import { storyImage } from "@/lib/story-image"

export const runtime = "nodejs"
export const revalidate = 86400

export function generateStaticParams() {
  return MYTHS.map((m) => ({ slug: m.slug }))
}

/** Image verticale 1080×1920 (story TikTok / Instagram) d'une idée reçue : affirmation barrée, réponse surlignée. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const myth = MYTHS.find((m) => m.slug === slug)
  if (!myth) return new Response("Idée reçue introuvable", { status: 404 })
  return storyImage({ eyebrow: "Idée reçue", struck: myth.claim, headline: myth.answer, highlight: myth.highlight, tone: "signal", footer: `cestchaud.fr/idees-recues/${myth.slug}` })
}
