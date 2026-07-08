import { Metadata } from "next"
import CitoyensClient from "./CitoyensClient"
import senators from "@/data/senators.json"

export const metadata: Metadata = {
  title: "Écrire à vos élus · cestchaud.fr",
  description: "Contactez vos sénatrices et sénateurs sur le climat. Templates prêts à envoyer, filtrage par commission ou département.",
  alternates: { canonical: "https://cestchaud.fr/citoyens" },
}

export default function CitoyensPage() {
  return <CitoyensClient senators={senators as any} />
}
