import { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import ContactForm from "@/components/ContactForm"
import PageFooter from "@/components/PageFooter"

export const metadata: Metadata = {
  title: "Contact · cestchaud.fr",
  description: "Contactez l'équipe cestchaud.fr — questions, suggestions, partenariats.",
  alternates: { canonical: "https://cestchaud.fr/contact" },
}

const LINKEDIN_URL = "https://www.linkedin.com/company/leswww"

export default function ContactPage() {
  return (
    <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">
      <SiteHeader asLink />
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-1 gap-3 pb-4">

            <div className="bg-white rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-500 mb-2">Contact</p>
              <h2 className="text-2xl font-black text-neutral-900 leading-tight">Écrivez-nous</h2>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Une question, une suggestion ou un partenariat ? On est joignables ici ou directement sur LinkedIn.
              </p>
            </div>

            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#0A66C2] hover:bg-[#004182] transition-colors rounded-3xl px-6 py-5 group">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70 mb-1">Contact direct</p>
                <p className="text-base font-black text-white">LesWWW sur LinkedIn</p>
              </div>
              <svg className="w-8 h-8 text-white/80 group-hover:text-white transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <ContactForm />

            <PageFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
