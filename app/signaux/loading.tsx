import PageShell from "@/components/ui/PageShell"
import Eyebrow from "@/components/ui/Eyebrow"
import Title from "@/components/ui/Title"

/** Affiché pendant le premier calcul des pages /signaux (relevés des dernières semaines, satellite). */
export default function Loading() {
  return (
    <PageShell crumbs={[{ label: "Signaux du mois" }]}>
      <div className="flex flex-col gap-6 pt-4 sm:pt-8" role="status" aria-live="polite">
        <Eyebrow>Signaux du mois</Eyebrow>
        <Title as="p" size="xl">On rassemble les relevés, ville par ville…</Title>
        <p className="max-w-2xl text-[17px] text-ink-soft">Les données des derniers jours arrivent de l&apos;archive météo et des satellites. Quelques secondes.</p>
        <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-[var(--radius-card)] bg-paper-deep" />)}
        </div>
      </div>
    </PageShell>
  )
}
