"use client"

import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"

/**
 * Sélecteur de ville. Fonctionne sans JavaScript (formulaire GET), et navigue sans recharger avec.
 */
export default function CityPicker({ cities, current, action = "/jumeaux" }: { cities: { slug: string; name: string }[]; current: string; action?: string }) {
  const router = useRouter()
  return (
    <form action={action} method="get" className="flex max-w-xl flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="twin-city" className="font-display text-[17px] font-bold">Choisissez votre ville</label>
      <div className="flex items-center gap-2">
        <select
          key={current}
          id="twin-city"
          name="ville"
          defaultValue={current}
          onChange={(e) => router.push(`${action}?ville=${e.target.value}`, { scroll: false })}
          className="min-h-11 w-full min-w-0 flex-1 rounded-full border-2 border-ink bg-white px-4 font-display text-[16px] font-bold text-ink"
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <noscript>
          <Button type="submit">Voir</Button>
        </noscript>
      </div>
    </form>
  )
}
