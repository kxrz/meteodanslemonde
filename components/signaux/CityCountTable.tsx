import Link from "next/link"

export interface CountRow {
  id: string
  name: string
  slug: string
  region: string
  /** valeurs affichées, dans l'ordre des colonnes */
  values: number[]
}

/**
 * Tableau accessible (une seule table, un vrai thead) : ville, barre sur la première valeur, colonnes de nombres.
 * La barre est proportionnelle à `max` (ex. nombre de jours de la période).
 */
export default function CityCountTable({ caption, columns, rows, max, unit = "j", tone = "chaud" }: {
  caption: string
  columns: string[]
  rows: CountRow[]
  max: number
  unit?: string
  tone?: "chaud" | "froid"
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white p-4 sm:p-6">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-ink font-mono text-[12px] uppercase tracking-[0.08em] text-mute">
            <th scope="col" className="w-[42%] py-2 pr-2 font-semibold sm:w-[32%]">Ville</th>
            <th scope="col" className="py-2 pr-2 font-semibold"><span className="sr-only">Barre</span></th>
            {columns.map((c) => (
              <th key={c} scope="col" className="w-[5.2rem] py-2 text-right font-semibold leading-tight">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <th scope="row" className="py-2 pr-2 font-normal">
                <Link href={`/a/${r.slug}`} className="group flex min-h-11 flex-col justify-center">
                  <span className="truncate font-display text-[16px] font-bold group-hover:underline">{r.name}</span>
                  <span className="truncate text-[13px] text-mute">{r.region}</span>
                </Link>
              </th>
              <td className="py-2 pr-2" aria-hidden="true">
                <span className="block h-3 rounded-full bg-paper-deep">
                  <span className={`block h-full rounded-full ${tone === "chaud" ? "bg-chaud" : "bg-froid"}`} style={{ width: `${Math.min(100, (r.values[0] / Math.max(1, max)) * 100)}%` }} />
                </span>
              </td>
              {r.values.map((v, i) => (
                <td key={i} className={i === 0 ? "py-2 text-right font-display text-[18px] font-extrabold tabular" : "py-2 text-right font-mono text-[14px] tabular text-ink-soft"}>
                  {v}&#8239;{unit}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
