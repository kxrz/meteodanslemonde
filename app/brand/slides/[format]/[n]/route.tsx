import { renderSlide, SLIDE_COUNT, SLIDE_FORMATS, type SlideFormat } from "@/lib/brand-slides"

export const runtime = "nodejs"
export const revalidate = 86400

export function generateStaticParams() {
  return (Object.keys(SLIDE_FORMATS) as SlideFormat[]).flatMap((format) =>
    Array.from({ length: SLIDE_COUNT }, (_, i) => ({ format, n: `${i + 1}.png` })),
  )
}

/** /brand/slides/16x9/1.png … /brand/slides/linkedin/7.png */
export async function GET(_req: Request, { params }: { params: Promise<{ format: string; n: string }> }) {
  const { format, n } = await params
  const index = parseInt(n, 10) - 1
  if (!(format in SLIDE_FORMATS) || !Number.isInteger(index) || index < 0 || index >= SLIDE_COUNT) {
    return new Response("Slide introuvable", { status: 404 })
  }
  return renderSlide(index, format as SlideFormat)
}
