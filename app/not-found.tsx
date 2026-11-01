import Link from "next/link"
import PageShell from "@/components/ui/PageShell"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import CitySearch from "@/components/CitySearch"
import { Arrow } from "@/components/ui/Button"
import { NAV_MAIN } from "@/components/nav"
import citiesFR from "@/data/cities-fr.json"

const SEARCH = citiesFR.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, region: c.region }))

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col gap-10 pt-4 sm:pt-10">
        <header className="flex max-w-3xl flex-col gap-4">
          <Eyebrow>Erreur 404</Eyebrow>
          <Title as="h1" size="hero" animate>
            Cette page <Hl tone="chaud">a fondu</Hl>.
          </Title>
          <p className="text-[18px] leading-snug text-ink-soft">
            Elle n&apos;existe pas, ou plus. Pas de panique : ce n&apos;est pas le climat, c&apos;est un lien cassé.
          </p>
        </header>

        <div className="flex max-w-xl flex-col gap-2">
          <label htmlFor="city-search-404" className="font-display text-[17px] font-bold">Vous cherchiez une ville&#8239;?</label>
          <CitySearch id="city-search-404" cities={SEARCH} />
        </div>

        <nav aria-labelledby="rubriques-404" className="flex flex-col gap-3">
          <h2 id="rubriques-404" className="font-display text-xl font-extrabold">Ou repartez d&apos;ici</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_MAIN.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="group flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] border-2 border-ink bg-white px-5 py-3 hover:bg-signal">
                  <span>
                    <span className="block font-display text-lg font-extrabold">{i.label}</span>
                    <span className="block text-[14px] text-ink-soft">{i.desc}</span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </PageShell>
  )
}
