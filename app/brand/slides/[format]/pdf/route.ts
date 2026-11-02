import { PDFDocument } from "pdf-lib"
import { renderSlide, SLIDE_COUNT, SLIDE_FORMATS, type SlideFormat } from "@/lib/brand-slides"

export const runtime = "nodejs"
export const revalidate = 86400

export function generateStaticParams() {
  return Object.keys(SLIDE_FORMATS).map((format) => ({ format }))
}

/** Les 7 slides dans un seul PDF : le format attendu par LinkedIn pour un carrousel. */
export async function GET(_req: Request, { params }: { params: Promise<{ format: string }> }) {
  const { format } = await params
  if (!(format in SLIDE_FORMATS)) return new Response("Format inconnu", { status: 404 })
  const { width, height } = SLIDE_FORMATS[format as SlideFormat]
  const pdf = await PDFDocument.create()
  pdf.setTitle("cestchaud.fr : le concept en 7 slides")
  pdf.setAuthor("cestchaud.fr · LesWWW")
  for (let i = 0; i < SLIDE_COUNT; i++) {
    const png = await (await renderSlide(i, format as SlideFormat)).arrayBuffer()
    const img = await pdf.embedPng(png)
    pdf.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height })
  }
  const bytes = await pdf.save()
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cestchaud-concept-${format}.pdf"`,
    },
  })
}
