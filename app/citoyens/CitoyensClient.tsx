"use client"

import { useState, useMemo } from "react"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"
import Breadcrumb from "@/components/Breadcrumb"

interface Senator {
  id: string
  civilite: string
  nom: string
  prenom: string
  fullName: string
  email: string | null
  twitter: string | null
  facebook: string | null
  commissions: string[]
  fonction: string | null
  isEnvCommission: boolean
  dept: string | null
  deptName: string | null
}

const EMAIL_TEMPLATE = `Madame la Sénatrice, Monsieur le Sénateur,

Je vous écris en tant que citoyen(ne), pour vous alerter sur une réalité que les données scientifiques rendent désormais incontournable : le dérèglement climatique n'est plus une projection lointaine, il est mesurable aujourd'hui, dans nos villes, jour après jour.

Le site cestchaud.fr, qui s'appuie sur les données ERA5 de Copernicus (programme européen d'observation de la Terre) et les modèles CMIP6 du GIEC, permet de visualiser en temps réel les anomalies de température dans les grandes villes françaises. Les chiffres sont édifiants : des ressentis thermiques qui dépassent régulièrement la normale de 8 à 15°C, des records battus presque chaque été, et des projections qui annoncent entre +2°C et +4°C supplémentaires sur ces pics de chaleur d'ici 2050.

Ces écarts ne sont pas des abstractions statistiques. Ils représentent des nuits sans sommeil, des personnes âgées en danger, des travailleurs en plein air épuisés, des agriculteurs qui voient leurs récoltes brûler. La chaleur extrême tue davantage en France que tous les autres événements climatiques réunis.

En tant que représentant(e) de notre territoire au Sénat, vous avez le pouvoir d'agir sur les politiques d'adaptation, sur les normes de construction, sur la protection des espaces verts urbains, sur les plans de prévention canicule. Ces décisions se prennent maintenant, pour un impact dans dix ans.

Je vous encourage à prendre connaissance des données disponibles sur votre territoire via cestchaud.fr, et à faire de la résilience climatique un axe prioritaire de votre travail législatif.

Merci de l'attention que vous porterez à ce message.

Avec mes cordiales salutations,
[Votre prénom et nom]
[Votre ville]`

const COMMISSION_FILTERS = [
  { value: "all", label: "Toutes", short: "Toutes" },
  { value: "env", label: "Environnement & territoire", short: "Environnement" },
  { value: "eco", label: "Affaires économiques", short: "Économie" },
  { value: "fin", label: "Finances", short: "Finances" },
  { value: "lois", label: "Commission des lois", short: "Lois" },
  { value: "social", label: "Affaires sociales", short: "Social" },
  { value: "culture", label: "Culture & éducation", short: "Culture" },
  { value: "europe", label: "Affaires européennes", short: "Europe" },
  { value: "defense", label: "Défense & affaires étrangères", short: "Défense" },
]

const COMMISSION_KEYWORDS: Record<string, string> = {
  env: "aménagement du territoire",
  eco: "affaires économiques",
  fin: "finances",
  lois: "lois constitutionnelles",
  social: "affaires sociales",
  culture: "culture",
  europe: "affaires européennes",
  defense: "affaires étrangères",
}

const COMMISSION_SHORT: Record<string, string> = {
  "aménagement du territoire": "Environnement & territoire",
  "affaires économiques": "Affaires économiques",
  "affaires étrangères": "Défense & affaires étrangères",
  "affaires européennes": "Affaires européennes",
  "affaires sociales": "Affaires sociales",
  "culture": "Culture & éducation",
  "finances": "Finances",
  "lois constitutionnelles": "Commission des lois",
}

function shortCommission(c: string): string {
  const lower = c.toLowerCase()
  for (const [kw, short] of Object.entries(COMMISSION_SHORT)) {
    if (lower.includes(kw)) return short
  }
  const match = c.match(/Commission[^|]+/)
  return match ? match[0].trim() : c
}

function getRole(c: string): string {
  if (c.startsWith("Président") || c.startsWith("Présidente")) return "Président(e)"
  if (c.startsWith("Vice-Président")) return "Vice-Président(e)"
  return "Membre"
}

function buildMailto(senator: Senator, template: string): string {
  const subject = encodeURIComponent("Urgence climatique · données cestchaud.fr")
  const body = encodeURIComponent(template)
  return `mailto:${senator.email}?subject=${subject}&body=${body}`
}

function normStr(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export default function CitoyensClient({ senators }: { senators: Senator[] }) {
  const [search, setSearch] = useState("")
  const [commission, setCommission] = useState("all")
  const [dept, setDept] = useState("")
  const [template, setTemplate] = useState(EMAIL_TEMPLATE)
  const [showTemplate, setShowTemplate] = useState(false)
  const [copied, setCopied] = useState(false)

  // Build sorted département list from data
  const deptOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of senators) {
      if (s.dept && s.deptName) seen.set(s.dept, s.deptName)
    }
    return [...seen.entries()]
      .sort((a, b) => {
        const aNum = parseInt(a[0]) || 999
        const bNum = parseInt(b[0]) || 999
        return aNum - bNum
      })
      .map(([num, name]) => ({ num, name }))
  }, [senators])

  const filtered = useMemo(() => {
    let list = senators

    if (commission !== "all") {
      const kw = COMMISSION_KEYWORDS[commission]
      list = list.filter(s => s.commissions.some(c => c.toLowerCase().includes(kw)))
    }

    if (dept) {
      list = list.filter(s => s.dept === dept)
    }

    if (search.trim()) {
      const q = normStr(search)
      list = list.filter(s => normStr(s.fullName).includes(q))
    }

    return [...list].sort((a, b) => {
      if (a.isEnvCommission && !b.isEnvCommission) return -1
      if (!a.isEnvCommission && b.isEnvCommission) return 1
      return a.nom.localeCompare(b.nom, "fr")
    })
  }, [senators, search, commission, dept])

  const envCount = senators.filter(s => s.isEnvCommission).length
  const hasFilters = search || commission !== "all" || dept

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />
      <Breadcrumb crumbs={[{ label: "Écrire à vos élus" }]} />

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Left panel */}
        <div className="lg:w-[36%] shrink-0 p-5 lg:p-8 flex flex-col border-b lg:border-b-0 border-black/[0.06] lg:sticky lg:top-0 lg:h-screen">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                Action citoyenne
              </p>
              <h1 className="text-3xl font-black text-neutral-900 leading-tight">
                Écrire à vos élus
              </h1>
              <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
                Les données climatiques sont réelles. Vos représentants au Sénat ont le pouvoir d'agir. Écrivez-leur : un email citoyen compte.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-2xl font-black text-neutral-900">{senators.filter(s => s.email).length}</p>
                <p className="text-xs text-neutral-500 mt-0.5">sénateurs joignables</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <p className="text-2xl font-black text-orange-600">{envCount}</p>
                <p className="text-xs text-neutral-500 mt-0.5">commission environnement</p>
              </div>
            </div>

            {/* Template */}
            <div className="bg-neutral-950 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white">Modèle d'email</p>
                <button
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  {showTemplate ? "Masquer" : "Personnaliser →"}
                </button>
              </div>
              {showTemplate ? (
                <>
                  <textarea
                    value={template}
                    onChange={e => setTemplate(e.target.value)}
                    className="w-full text-[11px] text-white/80 bg-white/5 rounded-xl p-3 resize-none h-52 leading-relaxed focus:outline-none focus:bg-white/10 transition-colors"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(template)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="mt-2 text-[11px] text-white/60 hover:text-white transition-colors"
                  >
                    {copied ? "✓ Copié" : "Copier le texte"}
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3">
                  {template.substring(0, 160)}…
                </p>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              En cliquant sur "Écrire un email", votre messagerie s'ouvre avec l'objet et le corps pré-remplis. Vous gardez la main avant d'envoyer.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:overflow-y-auto">

          {/* Filters */}
          <div className="sticky top-0 bg-[#f5f4f0]/95 backdrop-blur-sm z-10 px-5 pt-4 pb-3 lg:px-8 border-b border-black/[0.06] space-y-3">

            {/* Search + Dept */}
            <div className="flex gap-2">
              <input
                type="search"
                placeholder="Rechercher par nom…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
              />
              <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer"
              >
                <option value="">Tous les départements</option>
                {deptOptions.map(d => (
                  <option key={d.num} value={d.num}>
                    {d.num} · {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Commission chips */}
            <div className="flex gap-1.5 flex-wrap">
              {COMMISSION_FILTERS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCommission(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    commission === opt.value
                      ? opt.value === "env"
                        ? "bg-orange-500 text-white"
                        : "bg-neutral-900 text-white"
                      : "bg-white text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {opt.short}
                </button>
              ))}
            </div>

            {/* Result count + reset */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-neutral-400">
                {filtered.length} sénateur{filtered.length > 1 ? "s" : ""}
                {dept && deptOptions.find(d => d.num === dept) && (
                  <span> · {deptOptions.find(d => d.num === dept)?.name}</span>
                )}
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setCommission("all"); setDept("") }}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="p-5 lg:p-8 pt-4">
            <div className="space-y-2">
              {filtered.map(senator => (
                <SenatorCard key={senator.id} senator={senator} template={template} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-neutral-400 text-sm">
                  Aucun résultat
                  {search && <span> pour "{search}"</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PageFooter className="px-5 py-3" />
    </div>
  )
}

function SenatorCard({ senator, template }: { senator: Senator; template: string }) {
  const [open, setOpen] = useState(false)

  const mainCommission = senator.commissions.find(c =>
    c.toLowerCase().includes("aménagement du territoire")
  ) || senator.commissions[0] || ""

  const commissionLabel = shortCommission(mainCommission)

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${
        senator.isEnvCommission ? "ring-1 ring-orange-200" : ""
      }`}
    >
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        onClick={() => setOpen(!open)}
      >
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${
            senator.isEnvCommission
              ? "bg-orange-100 text-orange-700"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {senator.prenom[0]}{senator.nom[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-neutral-900 truncate">
              {senator.fullName}
            </p>
            {senator.deptName && (
              <span className="text-[10px] bg-neutral-100 text-neutral-500 font-semibold px-1.5 py-0.5 rounded shrink-0">
                {senator.dept}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {commissionLabel}
            {senator.deptName && (
              <span className="text-neutral-400"> · {senator.deptName}</span>
            )}
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {senator.isEnvCommission && (
            <span className="hidden sm:inline text-[10px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              Env.
            </span>
          )}
          {senator.email && (
            <span className="text-[10px] bg-neutral-100 text-neutral-500 font-medium px-2 py-0.5 rounded-full hidden sm:inline">
              ✉
            </span>
          )}
          <svg
            className={`w-4 h-4 text-neutral-300 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-neutral-100">
          {/* Commissions */}
          <div className="mb-3 space-y-1">
            {senator.commissions.map((c, i) => (
              <p key={i} className="text-xs text-neutral-600 leading-relaxed">
                <span className="text-neutral-400">{getRole(c)} · </span>
                {shortCommission(c)}
              </p>
            ))}
            {senator.fonction && (
              <p className="text-xs font-semibold text-neutral-700 mt-1">{senator.fonction}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {senator.email ? (
              <a
                href={buildMailto(senator, template)}
                className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-neutral-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Écrire un email
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-400 text-xs px-4 py-2 rounded-xl">
                Email non public
              </span>
            )}

            {senator.twitter && (
              <a
                href={`https://x.com/${senator.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X/Twitter
              </a>
            )}

            {senator.facebook && (
              <a
                href={senator.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
