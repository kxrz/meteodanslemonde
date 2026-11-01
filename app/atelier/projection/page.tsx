import type { Metadata } from "next"
import Deck from "@/components/atelier/Deck"
import { loadPedagoContext } from "@/lib/pedago-data"
import { parseDeroule, workshopMyths } from "@/lib/pedago"

export const metadata: Metadata = {
  title: "Mode projection · Atelier cestchaud.fr",
  description: "Le diaporama plein écran de l'atelier : la météo du jour, la normale, le climat qui glisse, trois idées reçues et 2050, avec les chiffres de votre ville.",
  robots: { index: false },
}

export default async function ProjectionPage({ searchParams }: { searchParams: Promise<{ ville?: string | string[]; deroule?: string | string[] }> }) {
  const { ville, deroule } = await searchParams
  const ctx = await loadPedagoContext(ville)
  const myths = workshopMyths(ctx.season).map((m) => ({ slug: m.slug, claim: m.claim, answer: m.answer, highlight: m.highlight, explanation: m.explanation[0] }))
  return (
    <>
      <h1 className="sr-only">Atelier cestchaud.fr, mode projection : {ctx.city.name}</h1>
      <Deck data={{ city: ctx.city, cities: ctx.cities, month: ctx.month, deroule: parseDeroule(deroule), myths }} />
    </>
  )
}
