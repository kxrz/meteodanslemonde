import Link from "next/link"

export default function PageFooter({ className }: { className?: string }) {
  return (
    <div className={`text-center text-xs text-neutral-500 pb-1${className ? " " + className : ""}`}>
      cestchaud.fr · Open-Meteo · ERA5 · CMIP6 ·{" "}
      <a
        href="https://leswww.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-neutral-700"
      >
        © LesWWW
      </a>
      {" · "}
      <a
        href="https://leswww.com/mentions-legales/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-neutral-700"
      >
        Mentions légales
      </a>
      {" · "}
      <Link href="/contact" className="underline underline-offset-2 hover:text-neutral-700">
        Contact
      </Link>
    </div>
  )
}
