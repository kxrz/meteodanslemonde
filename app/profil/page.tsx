import Link from "next/link"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSql } from "@/lib/db"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import { updateFirstName, toggleBeta, regenerateToken, unsubscribeAll, deleteAccount } from "./actions"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Mon profil · cestchaud.fr", robots: "noindex" }

const ACTION_MESSAGES: Record<string, { text: string; style: "green" | "neutral" | "red" | "orange" }> = {
  confirmed:        { text: "Bienvenue ! Votre abonnement est actif. Premier briefing demain matin.", style: "green" },
  "city-removed":   { text: "", style: "neutral" },
  "city-not-found": { text: "Cette ville n'etait pas dans votre briefing.", style: "neutral" },
  "name-updated":   { text: "Prenom mis a jour.", style: "green" },
  "beta-updated":   { text: "Preference enregistree.", style: "green" },
  "token-regenerated": { text: "Nouveau lien genere. Bookmarkez cette page pour y revenir facilement.", style: "orange" },
  unsubscribed:     { text: "Vous ne recevrez plus le briefing. Vos donnees sont conservees. Vous pouvez vous reabonner depuis la page de votre ville.", style: "neutral" },
  error:            { text: "Une erreur est survenue. Reessayez ou contactez-nous.", style: "red" },
}

const STYLE_MAP = {
  green:   { wrap: "bg-green-50 border-green-200", icon: "text-green-500", title: "text-green-800", text: "text-green-700" },
  neutral: { wrap: "bg-neutral-100 border-neutral-200", icon: "text-neutral-400", title: "text-neutral-700", text: "text-neutral-500" },
  orange:  { wrap: "bg-orange-50 border-orange-200", icon: "text-orange-500", title: "text-orange-800", text: "text-orange-700" },
  red:     { wrap: "bg-red-50 border-red-200", icon: "text-red-500", title: "text-red-800", text: "text-red-700" },
}

interface SearchParams {
  token?: string
  action?: string
  city?: string
  confirm?: string
}

export default async function ProfilPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { token, action, city, confirm } = params

  if (!token) redirect("/notifications")

  const sql = getSql()
  const rows = await sql`
    SELECT s.id, s.email, s.first_name, s.confirmed_at, s.confirm_token,
           s.frequency, s.alert_threshold, s.beta_tester, s.created_at,
           json_agg(
             json_build_object('slug', sub.city_slug, 'name', sub.city_name)
             ORDER BY sub.created_at
           ) FILTER (WHERE sub.id IS NOT NULL) AS cities
    FROM subscribers s
    LEFT JOIN subscriptions sub ON sub.subscriber_id = s.id
    WHERE s.confirm_token = ${token}
    GROUP BY s.id
  ` as Array<{
    id: string
    email: string
    first_name: string
    confirmed_at: Date | null
    confirm_token: string
    frequency: string
    alert_threshold: number
    beta_tester: boolean
    created_at: Date
    cities: Array<{ slug: string; name: string }> | null
  }>

  if (!rows.length) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
        <SiteHeader asLink />
        <main className="max-w-xl mx-auto px-5 py-20 text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-black text-neutral-900 mb-3">Lien invalide ou expire</h1>
          <p className="text-sm text-neutral-500 leading-relaxed mb-6">
            Ce lien de profil n&apos;est pas valide. Retrouvez votre lien dans un email recapitulatif, ou reabonnez-vous depuis la page de votre ville.
          </p>
          <Link href="/r" className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-orange-600 transition-colors">
            Trouver ma ville
          </Link>
        </main>
        <PageFooter />
      </div>
    )
  }

  const sub = rows[0]
  const cities = sub.cities ?? []
  const isActive = !!sub.confirmed_at
  const isPending = !sub.confirmed_at

  // Callout d'action
  let callout: { text: string; style: "green" | "neutral" | "red" | "orange" } | null = null
  if (action && ACTION_MESSAGES[action]) {
    callout = action === "city-removed" && city
      ? { text: `${decodeURIComponent(city)} retire de votre briefing.`, style: "neutral" }
      : ACTION_MESSAGES[action]
  }

  // Ecran de confirmation desabonnement global
  const showUnsubConfirm = confirm === "unsub" && isActive
  // Ecran de confirmation suppression compte
  const showDeleteConfirm = confirm === "delete"

  const memberSince = new Date(sub.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f4f0]">
      <SiteHeader asLink />

      {/* Callout action */}
      {callout && (
        <div className={`border-b ${STYLE_MAP[callout.style].wrap}`}>
          <div className="max-w-3xl mx-auto px-5 py-4 flex items-start gap-3">
            <span className={`text-xl mt-0.5 ${STYLE_MAP[callout.style].icon}`}>
              {callout.style === "green" ? "✓" : callout.style === "red" ? "✕" : "ℹ"}
            </span>
            <p className={`text-sm ${STYLE_MAP[callout.style].text}`}>{callout.text}</p>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-5 py-10 w-full flex-1">

        {/* En-tete */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Mon profil</p>
          <h1 className="text-3xl font-black text-neutral-900 leading-tight mb-1">
            Bonjour, {sub.first_name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-neutral-400">{sub.email}</span>
            <span className="text-neutral-300">·</span>
            {isActive ? (
              <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Actif</span>
            ) : (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">En attente de confirmation</span>
            )}
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-400">Membre depuis {memberSince}</span>
          </div>
        </div>

        {/* Confirmation desabonnement */}
        {showUnsubConfirm && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-3xl p-5">
            <p className="font-semibold text-red-800 text-sm mb-1">Confirmer le desabonnement</p>
            <p className="text-xs text-red-700 leading-relaxed mb-4">
              Vous ne recevrez plus aucun briefing. Vos donnees restent conservees. Vous pouvez vous reabonner a tout moment depuis la page d&apos;une ville.
            </p>
            <div className="flex gap-3">
              <form action={unsubscribeAll.bind(null, token)}>
                <button type="submit" className="bg-red-600 text-white text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-red-700 transition-colors">
                  Oui, me desabonner
                </button>
              </form>
              <Link href={`/profil?token=${token}`} className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                Annuler
              </Link>
            </div>
          </div>
        )}

        {/* Confirmation suppression compte */}
        {showDeleteConfirm && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-3xl p-5">
            <p className="font-semibold text-red-800 text-sm mb-1">Supprimer mon compte definitivement</p>
            <p className="text-xs text-red-700 leading-relaxed mb-4">
              Toutes vos donnees seront supprimees (email, prenom, villes) de notre base et de Resend. Cette action est irreversible.
            </p>
            <div className="flex gap-3">
              <form action={deleteAccount.bind(null, token)}>
                <button type="submit" className="bg-red-600 text-white text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-red-700 transition-colors">
                  Supprimer definitivement
                </button>
              </form>
              <Link href={`/profil?token=${token}`} className="bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                Annuler
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Mes villes */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Mes villes</p>
              <Link href="/r" className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                + Ajouter une ville
              </Link>
            </div>
            {cities.length === 0 ? (
              <p className="text-sm text-neutral-400">Aucune ville suivie.{" "}
                <Link href="/r" className="text-orange-500 underline">Choisir une ville</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {cities.map(c => (
                  <div key={c.slug} className="flex items-center justify-between bg-neutral-50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">🏙️</span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{c.name}</p>
                        <Link href={`/a/${c.slug}`} className="text-[11px] text-neutral-400 hover:text-orange-500 transition-colors">
                          Voir la carte
                        </Link>
                      </div>
                    </div>
                    <Link
                      href={`/api/unsubscribe-city?token=${token}&city=${c.slug}`}
                      className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors font-medium"
                    >
                      Retirer
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prenom */}
          <div className="bg-white rounded-3xl p-6">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-4">Prenom</p>
            <form action={updateFirstName.bind(null, token)} className="flex flex-col gap-3">
              <input
                type="text"
                name="firstName"
                defaultValue={sub.first_name}
                required
                className="bg-neutral-100 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="submit" className="bg-neutral-900 text-white text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-700 transition-colors self-start">
                Enregistrer
              </button>
            </form>
          </div>

          {/* Beta */}
          <div className="bg-white rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Beta-testeur</p>
              <p className="text-xs text-neutral-500 leading-relaxed mt-1 mb-4">
                Acceptez d&apos;etre contacte pour tester les nouvelles fonctions en avant-premiere et partager vos retours.
              </p>
            </div>
            <form action={toggleBeta.bind(null, token, sub.beta_tester)}>
              <button type="submit" className={`text-xs font-semibold rounded-xl px-4 py-2.5 transition-colors ${sub.beta_tester ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
                {sub.beta_tester ? "Beta-testeur actif" : "Rejoindre les beta-testeurs"}
              </button>
            </form>
          </div>

          {/* Statut abonnement */}
          {isPending && (
            <div className="bg-amber-50 rounded-3xl p-6">
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mb-1">Abonnement en attente</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-1 mb-4">
                Vous n&apos;avez pas encore confirme votre email. Verifiez vos spam ou reabonnez-vous depuis la page de votre ville pour recevoir un nouveau lien.
              </p>
              <Link href="/r" className="text-xs font-semibold text-amber-700 underline">
                Choisir une ville et recevoir un nouveau lien
              </Link>
            </div>
          )}

          {/* Contact */}
          <div className="bg-neutral-900 text-white rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Une suggestion ?</p>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1 mb-4">
                Les meilleures ameliorations du site viennent des utilisateurs. Une donnee manquante, une erreur, une idee : ecrivez-nous.
              </p>
            </div>
            <a
              href="mailto:florent@leswww.com?subject=Retour cestchaud.fr"
              className="inline-flex items-center gap-2 bg-white text-neutral-900 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-100 transition-colors self-start"
            >
              Ecrire a l&apos;equipe
            </a>
          </div>

          {/* Securite — regenerer le token */}
          <div className="bg-white rounded-3xl p-6">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Securite du lien</p>
            <p className="text-xs text-neutral-500 leading-relaxed mt-1 mb-4">
              Si vous avez partage cet email ou ce lien, generez un nouveau lien pour revoquer l&apos;acces. L&apos;ancien lien ne fonctionnera plus.
            </p>
            <form action={regenerateToken.bind(null, token)}>
              <button type="submit" className="bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-200 transition-colors">
                Generer un nouveau lien
              </button>
            </form>
          </div>

          {/* RGPD */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Mes donnees (RGPD)</p>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1 mb-4">
              Donnees stockees : email, prenom, villes suivies, date d&apos;inscription. Conservees pendant la duree de l&apos;abonnement + 3 ans. Aucune revente, aucune publicite. Hebergement EU via Neon (Postgres) et Resend.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/profile/export?token=${token}`}
                className="bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-200 transition-colors"
              >
                Telecharger mes donnees
              </a>
              {isActive ? (
                <Link href={`/profil?token=${token}&confirm=unsub`} className="bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-neutral-200 transition-colors">
                  Me desabonner
                </Link>
              ) : (
                <Link href="/r" className="bg-orange-500 text-white text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-orange-600 transition-colors">
                  Me reabonner
                </Link>
              )}
              <Link href={`/profil?token=${token}&confirm=delete`} className="text-red-500 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors">
                Supprimer mon compte
              </Link>
            </div>
          </div>

        </div>
      </main>

      <div className="max-w-3xl mx-auto px-5 pb-8 w-full">
        <PageFooter />
      </div>
    </div>
  )
}
