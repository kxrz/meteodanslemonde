"use client"

import { useId, useMemo, useRef, useState } from "react"
import Title from "@/components/ui/Title"
import Hl from "@/components/ui/Hl"
import Eyebrow from "@/components/ui/Eyebrow"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Explain from "@/components/ui/Explain"
import { buildLetter, theSeason, type LetterFacts } from "@/lib/elus-letter"
import { fmtDeltaTemp, fmtTemp } from "@/lib/format"
import { MONTHS } from "@/lib/season"
import { cn } from "@/lib/cn"

export interface Senator {
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

interface CityOption { id: string; name: string; facts: LetterFacts }

const COMMISSION_FILTERS = [
  { value: "all", short: "Toutes" },
  { value: "env", short: "Environnement" },
  { value: "eco", short: "Économie" },
  { value: "fin", short: "Finances" },
  { value: "lois", short: "Lois" },
  { value: "social", short: "Social" },
  { value: "culture", short: "Culture" },
  { value: "europe", short: "Europe" },
  { value: "defense", short: "Défense" },
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
  "aménagement du territoire": "Aménagement du territoire et développement durable",
  "affaires économiques": "Affaires économiques",
  "affaires étrangères": "Affaires étrangères et défense",
  "affaires européennes": "Affaires européennes",
  "affaires sociales": "Affaires sociales",
  culture: "Culture et éducation",
  finances: "Finances",
  "lois constitutionnelles": "Lois",
}

function shortCommission(c: string): string {
  const lower = c.toLowerCase()
  for (const [kw, short] of Object.entries(COMMISSION_SHORT)) if (lower.includes(kw)) return short
  const match = c.match(/Commission[^|]+/)
  return match ? match[0].trim() : c
}

function getRole(c: string): string {
  if (c.startsWith("Président")) return "Président(e)"
  if (c.startsWith("Vice-Président")) return "Vice-président(e)"
  return "Membre"
}

function normStr(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function buildMailto(email: string, letter: string): string {
  return `mailto:${email}?subject=${encodeURIComponent("Le climat change déjà dans notre territoire")}&body=${encodeURIComponent(letter)}`
}

export default function CitoyensClient({ senators, cities }: { senators: Senator[]; cities: CityOption[] }) {
  const [cityId, setCityId] = useState("")
  const [edited, setEdited] = useState<string | null>(null)
  const [showLetter, setShowLetter] = useState(false)
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fallback">("idle")
  const [search, setSearch] = useState("")
  const [commission, setCommission] = useState("all")
  const [dept, setDept] = useState("")
  const [limit, setLimit] = useState(12)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const ids = { city: useId(), letter: useId(), search: useId(), dept: useId(), list: useId() }

  const city = cities.find((c) => c.id === cityId) ?? null
  const generated = useMemo(() => buildLetter(city?.facts ?? null), [city])
  const letter = edited ?? generated

  const deptOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of senators) if (s.dept && s.deptName) seen.set(s.dept, s.deptName)
    return [...seen.entries()].sort((a, b) => (parseInt(a[0]) || 999) - (parseInt(b[0]) || 999)).map(([num, name]) => ({ num, name }))
  }, [senators])

  const filtered = useMemo(() => {
    let list = senators
    if (commission !== "all") {
      const kw = COMMISSION_KEYWORDS[commission]
      list = list.filter((s) => s.commissions.some((c) => c.toLowerCase().includes(kw)))
    }
    if (dept) list = list.filter((s) => s.dept === dept)
    if (search.trim()) {
      const q = normStr(search)
      list = list.filter((s) => normStr(s.fullName).includes(q))
    }
    return [...list].sort((a, b) => Number(b.isEnvCommission) - Number(a.isEnvCommission) || a.nom.localeCompare(b.nom, "fr"))
  }, [senators, search, commission, dept])

  const reachable = senators.filter((s) => s.email).length
  const envCount = senators.filter((s) => s.isEnvCommission).length
  const hasFilters = !!search || commission !== "all" || !!dept

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopyState("ok")
    } catch {
      // Presse-papiers refusé (navigateur, permissions) : on ouvre et sélectionne le texte
      setShowLetter(true)
      requestAnimationFrame(() => {
        textRef.current?.focus()
        textRef.current?.select()
      })
      setCopyState("fallback")
    }
  }

  const f = city?.facts

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-3xl flex-col gap-4 pt-2 sm:pt-6">
        <Eyebrow>Agir · {reachable} sénateurs joignables</Eyebrow>
        <Title as="h1" size="hero" animate>
          Vos élus votent. <Hl tone="chaud">Écrivez-leur.</Hl>
        </Title>
        <p className="text-[18px] leading-snug text-ink-soft">Une lettre courte, avec les vrais chiffres de votre ville. Vous la relisez, vous l&apos;envoyez.</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ── Étape 1 : la lettre ── */}
        <section aria-labelledby="etape-1" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1">
          <h2 id="etape-1" className="font-display text-2xl font-extrabold">1. Votre ville</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.city} className="text-[15px] font-semibold">Les chiffres de quelle ville&#8239;?</label>
            <select
              id={ids.city}
              value={cityId}
              onChange={(e) => { setCityId(e.target.value); setEdited(null); setCopyState("idle") }}
              className="min-h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 text-[16px] text-ink"
            >
              <option value="">Choisir parmi les {cities.length} villes suivies</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {f && (
            <Card tone="ink" className="grid grid-cols-3 gap-3 p-4 sm:p-5" as="div">
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-paper/75">Normale <Explain term="normale" invert /></p>
                <p className="font-display text-2xl font-extrabold">{fmtTemp(f.normalMonth)}</p>
                <p className="text-[13px] text-paper/75">{MONTHS[f.month]}, 1991-2020</p>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-paper/75">30 ans <Explain term="tendance" invert /></p>
                <p className="font-display text-2xl font-extrabold text-signal">{fmtDeltaTemp(f.trendSeason)}</p>
                <p className="text-[13px] text-paper/75">{theSeason(f.season)}, déjà</p>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-paper/75">2050 <Explain term="projection" invert /></p>
                <p className="font-display text-2xl font-extrabold text-signal">{fmtDeltaTemp(f.proj2050?.central)}</p>
                <p className="text-[13px] text-paper/75">{f.proj2050?.low != null && f.proj2050?.high != null && f.proj2050.high - f.proj2050.low >= 0.1 ? <>de {fmtDeltaTemp(f.proj2050.low)} à {fmtDeltaTemp(f.proj2050.high)}</> : "SSP2-4.5"}</p>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-ink bg-white p-4">
            <button
              type="button"
              aria-expanded={showLetter}
              aria-controls={ids.letter}
              onClick={() => setShowLetter((v) => !v)}
              className="flex min-h-11 items-center justify-between gap-3 text-left font-display text-lg font-extrabold"
            >
              {showLetter ? "Masquer la lettre" : "Lire et modifier la lettre"}
              <svg className={cn("h-5 w-5 shrink-0 transition-transform", showLetter && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id={ids.letter} hidden={!showLetter} className="flex flex-col gap-2">
              <label htmlFor={`${ids.letter}-txt`} className="text-[14px] font-semibold">Texte de la lettre (modifiable)</label>
              <textarea
                id={`${ids.letter}-txt`}
                ref={textRef}
                value={letter}
                onChange={(e) => setEdited(e.target.value)}
                rows={14}
                className="w-full resize-y rounded-2xl border-2 border-line bg-paper p-3 text-[15px] leading-relaxed text-ink focus:border-ink focus:outline-none"
              />
              {edited != null && (
                <button type="button" onClick={() => setEdited(null)} className="min-h-11 self-start text-[14px] font-semibold underline underline-offset-2">
                  Revenir au modèle
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={copy}>Copier la lettre</Button>
              <p aria-live="polite" className="text-[14px] font-semibold">
                {copyState === "ok" ? "Copiée ✓" : copyState === "fallback" ? "Texte sélectionné : copiez-le (Ctrl+C, ou appui long puis Copier)." : ""}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-mute">
            Le bouton « Écrire » ouvre votre messagerie avec la lettre déjà remplie. Rien ne part sans vous. Sources : Copernicus ERA5, GIEC CMIP6.
          </p>
        </section>

        {/* ── Étape 2 : l'élu ── */}
        <section aria-labelledby="etape-2" className="flex min-w-0 flex-col gap-4">
          <h2 id="etape-2" className="font-display text-2xl font-extrabold">2. Votre élu</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.search} className="text-[15px] font-semibold">Nom</label>
              <input id={ids.search} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex. Dupont" className="min-h-12 rounded-2xl border-2 border-ink bg-white px-4 text-[16px] placeholder:text-mute" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.dept} className="text-[15px] font-semibold">Département</label>
              <select id={ids.dept} value={dept} onChange={(e) => setDept(e.target.value)} className="min-h-12 w-full min-w-0 rounded-2xl border-2 border-ink bg-white px-3 text-[16px]">
                <option value="">Tous les départements</option>
                {deptOptions.map((d) => <option key={d.num} value={d.num}>{d.num} · {d.name}</option>)}
              </select>
            </div>
          </div>
          <div role="group" aria-label="Filtrer par commission" className="flex flex-wrap gap-2">
            {COMMISSION_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={commission === opt.value}
                onClick={() => setCommission(opt.value)}
                className={cn(
                  "min-h-11 rounded-full border-2 px-4 text-[14px] font-semibold",
                  commission === opt.value ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink",
                )}
              >
                {opt.short}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink-soft" aria-live="polite">
              {filtered.length} sénateur{filtered.length > 1 ? "s" : ""} · {envCount} à la commission environnement
            </p>
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setCommission("all"); setDept("") }} className="min-h-11 text-[14px] font-semibold underline underline-offset-2">
                Effacer les filtres
              </button>
            )}
          </div>

          <ul id={ids.list} className="flex flex-col gap-2">
            {filtered.slice(0, limit).map((s) => <SenatorCard key={s.id} senator={s} letter={letter} />)}
          </ul>
          {filtered.length > limit && (
            <Button variant="ghost" onClick={() => setLimit((l) => l + 24)} className="self-start">
              Voir plus ({filtered.length - limit} autres)
            </Button>
          )}
          {filtered.length === 0 && (
            <p className="rounded-2xl bg-paper-deep p-6 text-center text-[15px]">Aucun résultat{search && <> pour « {search} »</>}.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function SenatorCard({ senator, letter }: { senator: Senator; letter: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const main = senator.commissions.find((c) => c.toLowerCase().includes("aménagement du territoire")) || senator.commissions[0] || ""

  return (
    <li className={cn("overflow-hidden rounded-2xl border-2 bg-white", senator.isEnvCommission ? "border-ink" : "border-line")}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
        <span aria-hidden="true" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[14px] font-extrabold", senator.isEnvCommission ? "bg-signal" : "bg-paper-deep")}>
          {senator.prenom[0]}{senator.nom.replace(/^(de la |de |du |d['’]|le |la )/i, "")[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16px] font-bold">{senator.fullName}</span>
          <span className="block truncate text-[13px] text-ink-soft">
            {shortCommission(main)}{senator.deptName && <> · {senator.dept} {senator.deptName}</>}
          </span>
        </span>
        {senator.isEnvCommission && (
          <span className="hidden shrink-0 rounded-full bg-signal px-2.5 py-0.5 text-[12px] font-semibold sm:inline">Environnement</span>
        )}
        {senator.isEnvCommission && <span className="sr-only">, membre de la commission environnement</span>}
        {!senator.email && <span className="sr-only">, pas d&apos;email public</span>}
        <svg className={cn("h-5 w-5 shrink-0 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      <div id={panelId} hidden={!open} className="border-t border-line px-4 pb-4 pt-3">
        <ul className="mb-3 flex flex-col gap-1 text-[14px] text-ink-soft">
          {senator.commissions.map((c, i) => <li key={i}><span className="text-mute">{getRole(c)} · </span>{shortCommission(c)}</li>)}
          {senator.fonction && <li className="font-semibold text-ink">{senator.fonction}</li>}
        </ul>
        <div className="flex flex-wrap gap-2">
          {senator.email ? (
            <a href={buildMailto(senator.email, letter)} className="inline-flex min-h-11 items-center rounded-full bg-chaud px-5 font-display text-[15px] font-bold text-white hover:bg-chaud-deep">
              Écrire à {senator.civilite === "Mme" ? "la sénatrice" : "le sénateur"}
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-full bg-paper-deep px-5 text-[14px] text-ink-soft">Pas d&apos;email public</span>
          )}
          {senator.twitter && (
            <a href={`https://x.com/${senator.twitter}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 text-[14px] font-semibold">X<span className="sr-only"> (nouvel onglet)</span></a>
          )}
          {senator.facebook && (
            <a href={senator.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 text-[14px] font-semibold">Facebook<span className="sr-only"> (nouvel onglet)</span></a>
          )}
        </div>
      </div>
    </li>
  )
}
