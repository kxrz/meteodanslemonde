import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import { ButtonLink } from "@/components/ui/Button"

/** États explicites des pages /profil : lien invalide ou base injoignable. */
export default function ProfileState({ kind }: { kind: "invalid" | "unavailable" }) {
  return (
    <div className="flex flex-col items-start gap-5 py-10">
      {kind === "invalid" ? (
        <>
          <Title as="h1" size="xl">Ce lien ne mène <Hl>nulle part</Hl>.</Title>
          <p className="text-[17px] text-ink-soft">
            Il est incomplet, ou un nouveau lien a été créé depuis. Utilisez celui de votre dernier email, ou réinscrivez-vous : on vous renverra un lien.
          </p>
        </>
      ) : (
        <>
          <Title as="h1" size="xl">Votre profil est <Hl>momentanément</Hl> inaccessible.</Title>
          <p className="text-[17px] text-ink-soft">Notre base de données ne répond pas. Réessayez dans quelques minutes : votre lien reste valable.</p>
        </>
      )}
      <ButtonLink href="/notifications" variant="chaud">Aller au briefing</ButtonLink>
    </div>
  )
}
