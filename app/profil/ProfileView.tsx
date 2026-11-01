import Link from "next/link"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import Card from "@/components/ui/Card"
import Button, { ButtonLink } from "@/components/ui/Button"
import BriefingCta from "@/components/briefing/BriefingCta"
import { PROCESSORS, RETENTION } from "@/lib/subscription"
import type { Profile } from "./data"

/** Les actions serveur sont injectées : la vue reste testable sans base de données. */
export interface ProfileActions {
  updateFirstName: (formData: FormData) => void | Promise<void>
  toggleBeta: () => void | Promise<void>
  regenerateToken: () => void | Promise<void>
  unsubscribeAll: () => void | Promise<void>
  deleteAccount: () => void | Promise<void>
  removeCity: (slug: string) => () => void | Promise<void>
}

const MESSAGES: Record<string, { text: string; tone: "ok" | "info" | "error" }> = {
  confirmed: { text: "C'est confirmé. Votre premier briefing arrive demain matin.", tone: "ok" },
  "city-not-found": { text: "Cette ville n'était pas (ou plus) dans votre briefing.", tone: "info" },
  "name-updated": { text: "Prénom enregistré.", tone: "ok" },
  "name-empty": { text: "Le prénom ne peut pas être vide.", tone: "error" },
  "beta-updated": { text: "Préférence enregistrée.", tone: "ok" },
  "token-regenerated": { text: "Nouveau lien créé. L'ancien ne fonctionne plus : gardez cette page dans vos favoris, ou utilisez le lien de votre prochain email.", tone: "info" },
  unsubscribed: { text: "C'est fait : vous ne recevrez plus le briefing. Vos données restent enregistrées tant que vous ne supprimez pas votre compte (plus bas).", tone: "info" },
  error: { text: "Une erreur est survenue. Réessayez, ou écrivez-nous via la page Contact.", tone: "error" },
}

const field = "min-h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 text-[16px] text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-froid/30"

export default function ProfileView({ sub, token, action, city, confirm, actions }: {
  sub: Profile
  token: string
  action?: string
  city?: string
  confirm?: string
  actions: ProfileActions
}) {
  const isActive = !!sub.confirmed_at
  const callout = action === "city-removed" && city
    ? { text: `${city} ne fait plus partie de votre briefing.`, tone: "ok" as const }
    : action ? MESSAGES[action] : undefined
  const memberSince = new Date(sub.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col gap-8">
      <div role="status" aria-live="polite">
        {callout && (
          <p className={`rounded-[var(--radius-card)] border-2 p-4 text-[16px] font-semibold ${callout.tone === "error" ? "border-chaud bg-white text-chaud-deep" : callout.tone === "ok" ? "border-ink bg-signal text-ink" : "border-ink bg-white text-ink"}`}>
            {callout.text}
          </p>
        )}
      </div>

      <header className="flex flex-col gap-3">
        <Eyebrow>Mon profil · membre depuis {memberSince}</Eyebrow>
        <Title as="h1" size="xl">
          {sub.first_name ? <>Bonjour, <Hl>{sub.first_name}</Hl>.</> : <>Votre <Hl>briefing</Hl>.</>}
        </Title>
        <p className="flex flex-wrap items-center gap-2 text-[15px] text-ink-soft">
          <span className="break-all">{sub.email}</span>
          {isActive ? (
            <span className="rounded-full bg-ink px-3 py-0.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-paper">Actif</span>
          ) : (
            <span className="rounded-full bg-signal px-3 py-0.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-ink">Inactif</span>
          )}
        </p>
        {!isActive && (
          <p className="max-w-xl text-[15px] text-ink-soft">
            Aucun email ne part vers cette adresse : l&apos;inscription n&apos;a pas été confirmée, ou vous vous êtes désabonné. Pour (re)commencer, réinscrivez-vous : un nouveau lien de confirmation vous sera envoyé.
          </p>
        )}
      </header>

      {confirm === "unsub" && isActive && (
        <Card tone="outline" className="flex flex-col gap-3 border-chaud">
          <h2 className="font-display text-xl font-extrabold">Vous désabonner de tout&#8239;?</h2>
          <p className="text-[15px] text-ink-soft">Plus aucun briefing. {RETENTION.short}</p>
          <div className="flex flex-wrap gap-2">
            <form action={actions.unsubscribeAll}><Button type="submit" variant="chaud">Oui, me désabonner</Button></form>
            <ButtonLink href={`/profil?token=${token}`} variant="ghost">Annuler</ButtonLink>
          </div>
        </Card>
      )}

      {confirm === "delete" && (
        <Card tone="outline" className="flex flex-col gap-3 border-chaud">
          <h2 className="font-display text-xl font-extrabold">Supprimer votre compte pour de bon&#8239;?</h2>
          <p className="text-[15px] text-ink-soft">Email, prénom et villes sont effacés de notre base et des listes de notre outil d&apos;envoi (Resend). C&apos;est immédiat et irréversible.</p>
          <div className="flex flex-wrap gap-2">
            <form action={actions.deleteAccount}><Button type="submit" variant="chaud">Supprimer définitivement</Button></form>
            <ButtonLink href={`/profil?token=${token}`} variant="ghost">Annuler</ButtonLink>
          </div>
        </Card>
      )}

      {/* Mes villes */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold">Mes villes</h2>
          <BriefingCta label={isActive ? "Ajouter une ville" : "Me réinscrire"} variant="ghost" className="min-h-11 px-5 text-[15px]" />
        </div>
        {sub.cities.length === 0 ? (
          <p className="text-[15px] text-ink-soft">Aucune ville suivie pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sub.cities.map((c) => (
              <li key={c.slug} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-2">
                <Link href={`/a/${c.slug}`} className="min-h-11 content-center font-display text-[17px] font-bold underline-offset-2 hover:underline">{c.name}</Link>
                <form action={actions.removeCity(c.slug)}>
                  <button type="submit" className="min-h-11 rounded-full px-4 text-[14px] font-semibold text-chaud-deep underline underline-offset-2 hover:bg-white">
                    Retirer<span className="sr-only"> {c.name}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Prénom */}
        <Card className="flex flex-col gap-3">
          <h2 id="prenom" className="scroll-mt-24 font-display text-xl font-extrabold">Prénom</h2>
          <form action={actions.updateFirstName} className="flex flex-col gap-3">
            <label htmlFor="profil-prenom" className="text-[15px] font-semibold">Le prénom utilisé dans vos emails</label>
            <input id="profil-prenom" type="text" name="firstName" defaultValue={sub.first_name} autoComplete="given-name" required className={field} />
            <div className="flex items-center gap-3">
              <Button type="submit">Enregistrer</Button>
              {action === "name-updated" && <span className="text-[15px] font-semibold text-ink">Enregistré ✓</span>}
            </div>
          </form>
        </Card>

        {/* Bêta */}
        <Card className="flex flex-col gap-3">
          <h2 id="beta" className="scroll-mt-24 font-display text-xl font-extrabold">Bêta-testeur</h2>
          <p className="text-[15px] text-ink-soft">Acceptez-vous d&apos;être contacté pour tester les nouveautés en avant-première&#8239;?</p>
          <form action={actions.toggleBeta}>
            <Button type="submit" variant={sub.beta_tester ? "ink" : "ghost"} aria-pressed={sub.beta_tester}>
              {sub.beta_tester ? "Oui, je teste les nouveautés" : "Rejoindre les bêta-testeurs"}
            </Button>
          </form>
          {action === "beta-updated" && <p className="text-[15px] font-semibold">Enregistré ✓</p>}
        </Card>

        {/* Sécurité */}
        <Card className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-extrabold">Sécurité du lien</h2>
          <p className="text-[15px] text-ink-soft">Ce lien ouvre votre profil sans mot de passe. Vous l&apos;avez partagé (en transférant un email, par exemple)&#8239;? Créez-en un nouveau : l&apos;ancien cessera de fonctionner.</p>
          <form action={actions.regenerateToken}><Button type="submit" variant="ghost">Créer un nouveau lien</Button></form>
        </Card>

        {/* Suggestion */}
        <Card tone="ink" className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-extrabold text-paper">Une idée, une erreur&#8239;?</h2>
          <p className="text-[15px] text-paper/85">Une donnée manquante, un chiffre qui vous étonne : dites-le-nous.</p>
          <ButtonLink href="/contact" variant="paper" className="self-start">Nous écrire</ButtonLink>
        </Card>
      </div>

      {/* Données */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-extrabold">Mes données</h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Nous enregistrons votre email, votre prénom s&apos;il est renseigné, vos villes, la date d&apos;inscription et votre choix bêta-testeur. Aucune revente, aucune publicité. {RETENTION.long}
        </p>
        <p className="text-[14px] leading-relaxed text-mute">{PROCESSORS.neon} {PROCESSORS.resend} <Link href="/confidentialite" className="font-semibold text-ink underline underline-offset-2">Politique de confidentialité</Link></p>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/profile/export?token=${token}`} download className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-ink px-5 py-2.5 font-display text-[15px] font-bold tracking-tight hover:bg-ink hover:text-paper">Télécharger mes données</a>
          {isActive && <ButtonLink href={`/profil?token=${token}&confirm=unsub`} variant="ghost">Me désabonner</ButtonLink>}
          <ButtonLink href={`/profil?token=${token}&confirm=delete`} variant="ghost" className="border-chaud text-chaud-deep hover:bg-chaud hover:text-white">Supprimer mon compte</ButtonLink>
        </div>
      </Card>
    </div>
  )
}
