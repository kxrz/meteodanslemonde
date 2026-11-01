import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import CitoyensClient, { type Senator } from "./CitoyensClient"
import senators from "@/data/senators.json"
import citiesFR from "@/data/cities-fr.json"
import { loadClimateFull } from "@/lib/climate-season"
import { letterFacts } from "@/lib/elus-letter"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Écrire à vos élus · cestchaud.fr",
  description: "Une lettre à votre sénatrice ou sénateur avec les vrais chiffres climatiques de votre ville : normale, tendance sur 30 ans, projection 2050. Vous gardez la main avant d'envoyer.",
  alternates: { canonical: "https://www.cestchaud.fr/citoyens" },
  openGraph: {
    title: "Écrire à vos élus sur le climat · cestchaud.fr",
    description: "Les chiffres de votre ville, une lettre prête, 333 sénateurs joignables.",
    url: "https://www.cestchaud.fr/citoyens",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "Écrire à vos élus · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Écrire à vos élus sur le climat · cestchaud.fr",
    description: "Les chiffres de votre ville, une lettre prête, 333 sénateurs joignables.",
    images: ["/og/home.png"],
  },
}

export default function CitoyensPage() {
  const month = new Date().getMonth()
  const full = loadClimateFull()
  const cities = citiesFR
    .map((c) => ({ id: c.id, name: c.name, facts: letterFacts(c.name, full[c.id], month) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
  return (
    <PageShell crumbs={[{ label: "Écrire à vos élus" }]}>
      <CitoyensClient senators={senators as Senator[]} cities={cities} />
    </PageShell>
  )
}
