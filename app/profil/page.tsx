import { Metadata } from "next"
import PageShell from "@/components/ui/PageShell"
import ProfileView from "./ProfileView"
import ProfileState from "./ProfileState"
import { loadProfile } from "./data"
import { updateFirstName, toggleBeta, regenerateToken, unsubscribeAll, deleteAccount, removeCity } from "./actions"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Mon profil · cestchaud.fr", robots: "noindex" }

interface SearchParams {
  token?: string
  action?: string
  city?: string
  confirm?: string
}

export default async function ProfilPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { token, action, city, confirm } = await searchParams
  const sub = await loadProfile(token)

  if (sub === "invalid" || sub === "unavailable" || !token) {
    return (
      <PageShell width="text" crumbs={[{ label: "Mon profil" }]}>
        <ProfileState kind={sub === "unavailable" ? "unavailable" : "invalid"} />
      </PageShell>
    )
  }

  return (
    <PageShell width="text" crumbs={[{ label: "Mon profil" }]}>
      <ProfileView
        sub={sub}
        token={token}
        action={action}
        city={city}
        confirm={confirm}
        actions={{
          updateFirstName: updateFirstName.bind(null, token),
          toggleBeta: toggleBeta.bind(null, token, sub.beta_tester),
          regenerateToken: regenerateToken.bind(null, token),
          unsubscribeAll: unsubscribeAll.bind(null, token),
          deleteAccount: deleteAccount.bind(null, token),
          removeCity: (slug: string) => removeCity.bind(null, token, slug),
        }}
      />
    </PageShell>
  )
}
