import Eyebrow from "@/components/ui/Eyebrow"
import Title from "@/components/ui/Title"
import { cn } from "@/lib/cn"

/** Section de page : sur-titre, titre en gras, introduction courte, contenu. */
export default function Section({ id, eyebrow, title, intro, children, className, action }: {
  id?: string
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  intro?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const headingId = id ? `${id}-titre` : undefined
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn("scroll-mt-24 flex flex-col gap-5", className)}>
      {(eyebrow || title || intro) && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-3xl flex-col gap-2">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <Title id={headingId}>{title}</Title>}
            {intro && <p className="max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">{intro}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
