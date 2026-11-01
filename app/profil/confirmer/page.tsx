import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import Button from "@/components/ui/Button"
import ProfileState from "../ProfileState"
import { loadProfile } from "../data"
import { confirmSubscription } from "../actions"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Confirmer mon inscription · cestchaud.fr", robots: "noindex" }

// Le lien de l'email ouvre cette page ; seul le bouton (POST) confirme.
// Un scanner d'emails qui suit le lien ne peut donc pas inscrire quelqu'un à sa place.
export default async function ConfirmerPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const sub = await loadProfile(token)

  if (typeof sub === "string" || !token) {
    return (
      <PageShell width="text" crumbs={[{ label: "Confirmer mon inscription" }]}>
        <ProfileState kind={sub === "unavailable" ? "unavailable" : "invalid"} />
      </PageShell>
    )
  }

  const city = sub.cities[0]?.name
  return (
    <PageShell width="text" crumbs={[{ label: "Confirmer mon inscription" }]}>
      <div className="flex flex-col items-start gap-5 py-8">
        <Eyebrow>Dernière étape</Eyebrow>
        <Title as="h1" size="xl">
          Un clic, et c&apos;est <Hl tone="chaud">parti</Hl>.
        </Title>
        <p className="text-[18px] text-ink-soft">
          {sub.confirmed_at ? "Votre inscription est déjà confirmée." : <>Confirmez pour recevoir chaque matin le chiffre du jour{city ? <> de <strong className="text-ink">{city}</strong></> : null}.</>}
        </p>
        <form action={confirmSubscription.bind(null, token)}>
          <Button type="submit" variant="chaud" className="min-h-14 px-8 text-[17px]">
            {sub.confirmed_at ? "Ouvrir mon profil" : "Confirmer mon inscription"}
          </Button>
        </form>
        <p className="text-[14px] text-mute">Envoyé à {sub.email}. Ce n&apos;est pas vous&#8239;? Fermez simplement cette page : rien ne sera envoyé.</p>
      </div>
    </PageShell>
  )
}
