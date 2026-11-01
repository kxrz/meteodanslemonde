import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import ContactForm from "@/components/ContactForm"

export const revalidate = 604800

export const metadata: Metadata = {
  title: "Contact · cestchaud.fr",
  description: "Une erreur de chiffre, une question sur les données, une idée : écrivez à cestchaud.fr.",
  alternates: { canonical: "https://www.cestchaud.fr/contact" },
}

export default function ContactPage() {
  return (
    <PageShell crumbs={[{ label: "Contact" }]}>
      <div className="grid gap-10 pt-2 sm:pt-6 lg:grid-cols-[1fr_1.1fr]">
        <header className="flex flex-col gap-4">
          <Eyebrow>Contact</Eyebrow>
          <Title as="h1" size="hero" animate>
            Un chiffre <Hl tone="chaud">vous étonne</Hl>&#8239;?
          </Title>
          <p className="max-w-md text-[18px] leading-snug text-ink-soft">
            Dites-le-nous. Une erreur, une question sur les données, une idée ou une demande presse : tout arrive au même endroit.
          </p>
          <a
            href="https://linkedin.com/in/florentbertiaux"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-[15px] font-semibold underline underline-offset-2"
          >
            Ou sur LinkedIn<span className="sr-only"> (nouvel onglet)</span>
          </a>
        </header>
        <div className="max-w-xl">
          <ContactForm />
        </div>
      </div>
    </PageShell>
  )
}
