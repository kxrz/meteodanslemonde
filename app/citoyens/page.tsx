import { Metadata } from "next"
import CitoyensClient from "./CitoyensClient"
import senators from "@/data/senators.json"

export const metadata: Metadata = {
  title: "Écrire à vos élus · cestchaud.fr",
  description: "Contactez vos sénatrices et sénateurs sur le climat. 333 élus joignables, email pré-rédigé, filtrage par commission ou département.",
  alternates: { canonical: "https://www.cestchaud.fr/citoyens" },
  openGraph: {
    title: "Écrire à vos élus sur le climat · cestchaud.fr",
    description: "333 sénateurs joignables, dont 49 membres de la commission Environnement. Email pré-rédigé, données climatiques à l'appui.",
    url: "https://www.cestchaud.fr/citoyens",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "Écrire à vos élus · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Écrire à vos élus sur le climat · cestchaud.fr",
    description: "333 sénateurs joignables, dont 49 membres de la commission Environnement. Email pré-rédigé, données climatiques à l'appui.",
    images: ["/og/home.png"],
  },
}

export default function CitoyensPage() {
  return <CitoyensClient senators={senators as any} />
}
