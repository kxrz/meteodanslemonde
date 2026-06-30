import Link from "next/link"
import { Metadata } from "next"
import { slugify } from "@/lib/slugify"
import { getWeatherData } from "@/lib/weather-data"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "La chaleur en France · cestchaud.fr",
  description: "Vue d’ensemble de la chaleur en France : ressenti actuel, anomalies, tendances ERA5 et projections GIEC CMIP6 pour les 36 principales villes françaises.",
  alternates: { canonical: "https://cestchaud.fr/en/france" },
  openGraph: {
    title: "La chaleur en France · cestchaud.fr",
    description: "Températures, anomalies et projections climatiques pour 36 villes françaises.",
    url: "https://cestchaud.fr/en/france",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "La chaleur en France",
  url: "https://cestchaud.fr/en/france",
  description: "Vue d’ensemble climatique : ressenti actuel et projections GIEC pour les 36 principales villes de France.",
  about: {
    "@type": "Country",
    name: "France",
    sameAs: "https://www.wikidata.org/wiki/Q142",
  },
}

export default async function FrancePage() {
  const { citiesFR, fetchedAt } = await getWeatherData()

  const sorted = [...citiesFR].sort((a, b) => b.apparent_temp_max - a.apparent_temp_max)
  const now = new Date()
  const dayName = now.toLocaleDateString("fr-FR", { weekday: "long" })
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const dataLabel = new Date(fetchedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const avgTemp = Math.round(citiesFR.reduce((s, c) => s + c.apparent_temp_max, 0) / citiesFR.length)
  const hottest = sorted[0]
  const coolest = sorted[sorted.length - 1]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="h-screen flex flex-col bg-[#f5f4f0] overflow-hidden">

        {/* Header */}
        <header className="shrink-0 px-5 pt-4 pb-3 border-b border-black/5 bg-[#f5f4f0]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/"
                className="text-3xl font-black tracking-tight text-neutral-900 leading-none hover:opacity-70 transition-opacity"
              >
                ← En vrai, c’est chaud.
              </Link>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Nous sommes le {dayNameCap} {dateLabel}. La chaleur en France, ville par ville.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-neutral-500">{dataLabel}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-3 pb-4">

              {/* Ressenti moyen */}
              <div className="bg-[#dbeafe] rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-800/60 mb-3">
                  Ressenti moyen France
                </p>
                <div className="text-5xl font-black text-blue-900 leading-none">{avgTemp}°C</div>
                <p className="text-xs text-blue-700/60 mt-2">moy. {citiesFR.length} villes</p>
              </div>

              {/* Plus chaud */}
              <div className="bg-[#f4a27a]/50 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-900/50 mb-3">
                  Plus chaud
                </p>
                <div className="text-4xl font-black text-orange-900 leading-none">{hottest.apparent_temp_max}°C</div>
                <p className="text-sm font-bold text-orange-900/80 mt-1.5">{hottest.name}</p>
                <p className="text-xs text-orange-900/40">{hottest.region}</p>
              </div>

              {/* Toutes les villes */}
              <div className="col-span-2 bg-white rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-4">
                  Toutes les villes · du plus chaud au plus frais
                </p>
                <div className="space-y-0.5">
                  {sorted.map((city, i) => (
                    <Link
                      key={city.id}
                      href={`/a/${slugify(city.name)}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-neutral-50 transition-colors group"
                    >
                      <span className="text-[10px] font-mono text-neutral-300 w-5 shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-neutral-800 group-hover:text-neutral-900">{city.name}</span>
                        <span className="text-xs text-neutral-400 ml-2 hidden sm:inline">{city.region}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-sm text-neutral-700">{city.apparent_temp_max}°C</span>
                        <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Plus frais */}
              <div className="col-span-2 bg-[#a8c4d4]/40 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-900/50 mb-3">
                  Plus frais
                </p>
                <div className="flex items-baseline gap-3">
                  <div className="text-4xl font-black text-blue-900 leading-none">{coolest.apparent_temp_max}°C</div>
                  <div>
                    <p className="text-sm font-bold text-blue-900/80">{coolest.name}</p>
                    <p className="text-xs text-blue-900/40">{coolest.region}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="col-span-2 text-center text-xs text-neutral-400 pb-1">
                cestchaud.fr · Open-Meteo ·{" "}
                <a href="https://leswww.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600">© LesWWW</a>
                {" · "}
                <a href="https://leswww.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-600">Mentions légales</a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
