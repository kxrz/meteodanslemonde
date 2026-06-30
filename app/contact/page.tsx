import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import ContactForm from "@/components/ContactForm"

export const metadata: Metadata = {
  title: "Contact · cestchaud.fr",
  description: "Contactez l'équipe cestchaud.fr — questions, données, partenariats.",
  alternates: { canonical: "https://cestchaud.fr/contact" },
}

const LINKEDIN_URL = "https://www.linkedin.com/company/leswww"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />

      <div className="flex-1 p-3 lg:p-4">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-1 gap-3 pb-4">

            <div className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-2">
                Contact
              </p>
              <h1 className="text-2xl font-black text-neutral-900 mb-2">
                On est là.
              </h1>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Questions sur les données, les projections GIEC, ou envie de collaborer ? Écrivez-nous.
              </p>
            </div>

            <ContactForm />

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#0958a8] transition-colors text-white font-bold rounded-3xl px-6 py-5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Contacter sur LinkedIn
            </a>

            <PageFooter />

          </div>
        </div>
      </div>
    </div>
  )
}
