import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-4">Erreur 404</p>
        <h1 className="text-4xl font-black text-neutral-900 leading-tight mb-3">Page introuvable</h1>
        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-8">
          Cette ville ou cette page n&apos;existe pas. Cherchez une ville directement depuis l&apos;accueil.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white font-black text-sm rounded-2xl px-5 py-3"
        >
          Retour à l&apos;accueil &rarr;
        </Link>
      </main>
      <PageFooter className="px-5 py-3" />
    </div>
  )
}
