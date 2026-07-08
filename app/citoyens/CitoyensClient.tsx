"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import SiteHeader from "@/components/SiteHeader"
import PageFooter from "@/components/PageFooter"

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

En tant que citoyen(ne), je souhaitais vous écrire au sujet d'une réalité que les données climatiques rendent désormais incontestable.

Le site cestchaud.fr — qui s'appuie sur les données ERA5 de Copernicus et les projections du GIEC — permet de visualiser les anomalies de température dans les grandes villes françaises. Ce que nous observons est préoccupant : des ressentis qui dépassent régulièrement les normales de 10 à 15°C, des records historiques battus chaque été, et des projections à 2050 qui annoncent +2 à +4°C supplémentaires sur ces pics de chaleur.

Ces données ne sont pas des projections abstraites. Elles concernent la santé, la qualité de vie, et l'économie de nos territoires dès aujourd'hui.

Je vous encourage vivement à :
— Soutenir des mesures ambitieuses d'adaptation au changement climatique à l'échelle locale et nationale
— Favoriser la transparence des données climatiques accessibles à tous les citoyens
— Porter ces enjeux comme une priorité dans vos travaux au Sénat

Vous pouvez consulter les données pour votre territoire sur cestchaud.fr.

Avec mes cordiales salutations,
[Votre prénom et nom]
[Votre ville]`

const COMMISSIONS_SHORT: Record<string, string> = {
  "Commission de l'aménagement du territoire et du développement durable": "Environnement & territoire",
  "Commission des affaires économiques": "Affaires économiques",
  "Commission des affaires étrangères, de la défense et des forces armées": "Défense & affaires étrangères",
  "Commission des affaires européennes": "Affaires européennes",
  "Commission des affaires sociales": "Affaires sociales",
  "Commission de la culture, de l'éducation, de la communication et du sport": "Culture & éducation",
  "Commission des finances": "Finances",
  "Commission des lois constitutionnelles, de législation, du suffrage universel, du Règlement et d'administration générale": "Commission des lois",
}

function shortCommission(c: string): string {
  for (const [long, short] of Object.entries(COMMISSIONS_SHORT)) {
    if (c.includes(long) || long.includes(c.replace("Membre de la ", "").replace("Vice-Président  de la ", "").replace("Vice-Présidente de la ", "").replace("Président de la ", "").replace("Présidente de la ", ""))) {
      return short
    }
  }
  // Extract the commission name from "Membre de la Commission..."
  const match = c.match(/Commission[^|]+/)
  return match ? match[0].trim() : c
}

function getRole(c: string): string {
  if (c.startsWith("Président") || c.startsWith("Présidente")) return "Président(e)"
  if (c.startsWith("Vice-Président")) return "Vice-Président(e)"
  return "Membre"
}

function buildMailto(senator: Senator, template: string): string {
  const subject = encodeURIComponent("Urgence climatique — données cestchaud.fr")
  const body = encodeURIComponent(template)
  return `mailto:${senator.email}?subject=${subject}&body=${body}`
}

const FILTER_OPTIONS = [
  { value: "all", label: "Tous les sénateurs" },
  { value: "env", label: "Commission Environnement" },
]

export default function CitoyensClient({ senators }: { senators: Senator[] }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [template, setTemplate] = useState(EMAIL_TEMPLATE)
  const [showTemplate, setShowTemplate] = useState(false)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    let list = senators
    if (filter === "env") list = list.filter(s => s.isEnvCommission)
    if (search.trim()) {
      const q = search.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      list = list.filter(s => {
        const name = s.fullName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        const dept = (s.deptName || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        return name.includes(q) || dept.includes(q) || (s.dept || "").includes(q)
      })
    }
    // Put env commission first
    return [...list].sort((a, b) => {
      if (a.isEnvCommission && !b.isEnvCommission) return -1
      if (!a.isEnvCommission && b.isEnvCommission) return 1
      return a.nom.localeCompare(b.nom, "fr")
    })
  }, [senators, search, filter])

  const envCount = senators.filter(s => s.isEnvCommission).length

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <SiteHeader asLink />

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Left panel */}
        <div className="lg:w-[38%] shrink-0 p-5 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 border-black/[0.06] lg:sticky lg:top-0 lg:h-screen">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-neutral-400 mb-3">
                Action citoyenne
              </p>
              <h1 className="text-3xl font-black text-neutral-900 leading-tight">
                Écrire à vos élus
              </h1>
              <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
                Les données climatiques que vous voyez sur ce site sont réelles. Vos représentants au Sénat ont le pouvoir d'agir. Écrivez-leur.
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

            {/* Template toggle */}
            <div className="bg-neutral-950 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white">Modèle d'email</p>
                <button
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  {showTemplate ? "Masquer" : "Modifier →"}
                </button>
              </div>
              {showTemplate ? (
                <textarea
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  className="w-full text-[11px] text-white/80 bg-white/5 rounded-xl p-3 resize-none h-48 leading-relaxed focus:outline-none focus:bg-white/10 transition-colors"
                />
              ) : (
                <p className="text-[11px] text-white/60 leading-relaxed line-clamp-4">
                  {template.substring(0, 200)}…
                </p>
              )}
              {showTemplate && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(template)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="mt-2 text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  {copied ? "Copié !" : "Copier le texte"}
                </button>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              En cliquant sur "Écrire", votre client mail s'ouvre avec le modèle pré-rempli. Vous pouvez le modifier avant d'envoyer.
            </p>
          </div>

          <PageFooter />
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:overflow-y-auto">
          {/* Filters */}
          <div className="sticky top-0 bg-[#f5f4f0]/90 backdrop-blur-sm z-10 p-5 pb-3 lg:px-8 border-b border-black/[0.06]">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                placeholder="Rechercher par nom ou département…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
              />
              <div className="flex gap-1.5">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      filter === opt.value
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              {filtered.length} sénateur{filtered.length > 1 ? "s" : ""}
              {filter === "env" ? " · Commission aménagement du territoire & développement durable" : ""}
            </p>
          </div>

          {/* List */}
          <div className="p-5 lg:p-8 pt-4">
            <div className="space-y-2">
              {filtered.map(senator => (
                <SenatorCard key={senator.id} senator={senator} template={template} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-neutral-400 text-sm">
                  Aucun résultat pour "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SenatorCard({ senator, template }: { senator: Senator; template: string }) {
  const [open, setOpen] = useState(false)

  const mainCommission = senator.commissions.find(c =>
    c.includes("aménagement du territoire")
  ) || senator.commissions[0] || ""

  const commissionLabel = shortCommission(mainCommission)
  const role = getRole(mainCommission)

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-shadow ${
        senator.isEnvCommission ? "ring-1 ring-orange-200" : ""
      }`}
    >
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setOpen(!open)}
      >
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-black ${
            senator.isEnvCommission
              ? "bg-orange-100 text-orange-700"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {senator.prenom[0]}{senator.nom[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-900 truncate">
            {senator.fullName}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {commissionLabel}
            {senator.deptName && (
              <span className="text-neutral-400"> · {senator.deptName}</span>
            )}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {senator.isEnvCommission && (
            <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              Env.
            </span>
          )}
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-neutral-100">
          {/* All commissions */}
          <div className="mb-4 space-y-1">
            {senator.commissions.map((c, i) => (
              <p key={i} className="text-xs text-neutral-600">
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
              <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-400 text-xs font-semibold px-4 py-2 rounded-xl">
                Email non public
              </span>
            )}

            {senator.twitter && (
              <a
                href={`https://x.com/${senator.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{senator.twitter}
              </a>
            )}

            {senator.facebook && (
              <a
                href={senator.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
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
