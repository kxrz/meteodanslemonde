import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Button, { ButtonLink } from "@/components/ui/Button"
import ProfileState from "../ProfileState"
import { loadProfile } from "../data"
import { removeCity, unsubscribeAll } from "../actions"
import { RETENTION } from "@/lib/subscription"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Se désabonner · cestchaud.fr", robots: "noindex" }

// Page d'atterrissage des liens « Se désabonner » et « Retirer cette ville » des emails.
// Un GET n'agit pas : c'est le bouton (POST, action serveur) qui désabonne.
export default async function DesabonnementPage({ searchParams }: { searchParams: Promise<{ token?: string; city?: string }> }) {
  const { token, city: citySlug } = await searchParams
  const sub = await loadProfile(token)

  if (typeof sub === "string" || !token) {
    return (
      <PageShell width="text" crumbs={[{ label: "Se désabonner" }]}>
        <ProfileState kind={sub === "unavailable" ? "unavailable" : "invalid"} />
      </PageShell>
    )
  }

  const city = citySlug ? sub.cities.find((c) => c.slug === citySlug) : undefined
  const profil = `/profil?token=${token}`

  return (
    <PageShell width="text" crumbs={[{ label: "Se désabonner" }]}>
      <div className="flex flex-col items-start gap-5 py-8">
        {city && sub.cities.length > 1 ? (
          <>
            <Title as="h1" size="xl">Retirer <Hl>{city.name}</Hl> de votre briefing&#8239;?</Title>
            <p className="text-[17px] text-ink-soft">Vous continuerez à recevoir vos autres villes.</p>
            <div className="flex flex-wrap gap-2">
              <form action={removeCity.bind(null, token, city.slug)}><Button type="submit" variant="chaud">Retirer {city.name}</Button></form>
              <ButtonLink href={profil} variant="ghost">Annuler</ButtonLink>
            </div>
          </>
        ) : !sub.confirmed_at ? (
          <>
            <Title as="h1" size="xl">Vous êtes <Hl>déjà désabonné</Hl>.</Title>
            <p className="text-[17px] text-ink-soft">Aucun email ne part vers {sub.email}. {RETENTION.short}</p>
            <ButtonLink href={profil} variant="ghost">Ouvrir mon profil</ButtonLink>
          </>
        ) : (
          <>
            <Title as="h1" size="xl">Plus de briefing <Hl>le matin</Hl>&#8239;?</Title>
            <p className="text-[17px] text-ink-soft">
              Un clic et plus aucun email ne part vers <strong className="break-all text-ink">{sub.email}</strong>. {RETENTION.short}
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={unsubscribeAll.bind(null, token)}><Button type="submit" variant="chaud">Me désabonner</Button></form>
              <ButtonLink href={profil} variant="ghost">Gérer mes villes plutôt</ButtonLink>
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}
