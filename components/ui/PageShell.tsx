import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"
import { cn } from "@/lib/cn"

/** Gabarit commun : en-tête, fil d'Ariane, contenu centré (max 80rem), pied de page. */
export default function PageShell({ children, crumbs, className, width = "wide" }: {
  children: React.ReactNode
  crumbs?: { label: string; href?: string }[]
  className?: string
  width?: "wide" | "text"
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      {crumbs && crumbs.length > 0 && (
        <div className="mx-auto w-full max-w-7xl"><Breadcrumb crumbs={crumbs} /></div>
      )}
      <main className={cn("mx-auto w-full flex-1 px-4 pb-8 pt-4 sm:px-6", width === "wide" ? "max-w-7xl" : "max-w-3xl", className)}>
        {children}
      </main>
      <PageFooter />
    </div>
  )
}
