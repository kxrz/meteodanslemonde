import Link from "next/link"
import SiteHeaderMenu from "@/components/SiteHeaderMenu"

interface Props {
  asLink?: boolean
}

export default function SiteHeader({ asLink = false }: Props) {
  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const title = (
    <span className="font-black text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none">
      En vrai, c'est{" "}
      <span className="relative inline-block">
        chaud
        <span className="absolute left-0 right-0 bottom-0.5 h-[3px] bg-red-500 rounded-full" />
      </span>
      .
    </span>
  )

  return (
    <header className="shrink-0 flex items-start justify-between px-5 py-5 border-b border-black/5 bg-[#f5f4f0]">
      <div className="flex-1 min-w-0 pr-4">
        {asLink ? (
          <Link href="/" className="hover:opacity-70 transition-opacity block">
            {title}
          </Link>
        ) : (
          title
        )}
        <div className="text-sm text-neutral-500 mt-2 leading-snug">
          <p>Nous sommes le {dateStr}, il est {timeStr}.</p>
          <p>Le ressenti d'aujourd'hui, les villes jumelles dans le monde, et ce que le GIEC prédit pour 2030–2050.</p>
        </div>
      </div>
      <SiteHeaderMenu />
    </header>
  )
}
